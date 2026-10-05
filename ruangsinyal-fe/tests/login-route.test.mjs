import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);

test("login route handles invalid input and backend outages without HTTP 500", async (t) => {
  const oldFetch = globalThis.fetch;
  const oldTurnstile = process.env.TURNSTILE_ENABLED;
  process.env.TURNSTILE_ENABLED = "false";
  t.after(() => {
    globalThis.fetch = oldFetch;
    if (oldTurnstile === undefined) delete process.env.TURNSTILE_ENABLED;
    else process.env.TURNSTILE_ENABLED = oldTurnstile;
  });
  const source = readFileSync(new URL("../app/api/auth/login/route.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const exports = {};
  const load = (name) => {
    if (name === "@/lib/server-auth") return { PK_AUTH_COOKIE: "pk_auth_token" };
    if (name === "@/lib/serverTurnstile") return { verifyTurnstileToken: async () => ({ success: true }) };
    return require(name);
  };
  new Function("require", "exports", outputText)(load, exports);
  const request = (body) => new Request("http://localhost/api/auth/login", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  globalThis.fetch = async () => { throw new Error("backend must not be called for invalid input"); };
  for (const body of [null, [], {}, { email: 42, password: "test-password" }, { email: "test@example.test", password: {} }]) {
    assert.equal((await exports.POST(request(body))).status, 400);
  }
  const body = { email: "test@example.test", password: "test-password" };
  assert.equal((await exports.POST(request(body))).status, 503);
  for (const [upstreamStatus, upstreamBody, expected] of [
    [503, {}, 503], [429, {}, 429], [401, { ok: false }, 401], [200, null, 401], [200, { ok: true, token: {} }, 401],
  ]) {
    globalThis.fetch = async () => Response.json(upstreamBody, { status: upstreamStatus });
    assert.equal((await exports.POST(request(body))).status, expected);
  }
  const token = `header.${Buffer.from(JSON.stringify({ role: "user" })).toString("base64url")}.test-signature`;
  globalThis.fetch = async () => Response.json({ ok: true, token });
  const response = await exports.POST(request(body));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).role, "user");
  assert.match(response.headers.get("set-cookie"), /pk_auth_token=/);
});
