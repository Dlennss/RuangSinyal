import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import ts from "typescript";

function sessionModule({ cookie = "", oauth = null, identity = null } = {}) {
  const source = readFileSync(new URL("../lib/server-auth.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const checked = [];
  const exports = {};
  const dependencies = {
    "next/headers": { cookies: async () => ({ get: (key) => key === "pk_auth_token" && cookie ? { value: cookie } : undefined }) },
    "next-auth": { getServerSession: async () => oauth },
    "@/lib/nextauth": { authOptions: {} },
    react: { cache: (fn) => fn },
    "@/lib/backend-identity": { getBackendIdentity: async (token) => { checked.push(token); return identity; } },
  };
  new Function("require", "exports", outputText)((name) => {
    assert.ok(name in dependencies, `unexpected dependency: ${name}`);
    return dependencies[name];
  }, exports);
  return { ...exports, checked };
}

const identity = { member_id: 9, nama: "Test User", email: "test@example.invalid", role: "user" };

test("password login cookie supplies verified checkout token without NextAuth", async () => {
  const auth = sessionModule({ cookie: "password-token", identity });
  const session = await auth.getAppServerSession();
  assert.equal(session.backendToken, "password-token");
  assert.equal(session.user.role, "user");
  assert.deepEqual(auth.checked, ["password-token"]);
});

test("Google login still supplies verified backend identity and ignores stale role", async () => {
  const auth = sessionModule({ oauth: { backendToken: "google-token", user: { role: "super_admin" } }, identity });
  const session = await auth.getAppServerSession();
  assert.equal(session.backendToken, "google-token");
  assert.equal(session.user.role, "user");
  assert.deepEqual(auth.checked, ["google-token"]);
});

test("expired cookies and invalid Google sessions cannot authorize wallet checkout", async () => {
  for (const options of [{ cookie: "expired" }, { oauth: { backendToken: "expired" } }, {}]) {
    assert.equal(await sessionModule(options).getAppServerSession(), null);
  }
});

test("all public checkout pages use the shared password and Google session reader", () => {
  const root = fileURLToPath(new URL("../app/(site)", import.meta.url));
  let checkoutPages = 0;
  function visit(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) { visit(path); continue; }
      if (!entry.name.endsWith(".tsx")) continue;
      const source = readFileSync(path, "utf8");
      assert.doesNotMatch(source, /getServerSession/, path);
      if (/authToken=/.test(source)) {
        checkoutPages++;
        assert.match(source, /await getAppServerSession\(\)/, path);
      }
    }
  }
  visit(root);
  assert.ok(checkoutPages > 10, "expected all public product routes to be checked");
});
