import assert from "node:assert/strict";
import test from "node:test";
import { getBackendIdentity } from "../lib/backend-identity.ts";

test("server sessions require an active, backend-verified identity", async (t) => {
  const originalFetch = globalThis.fetch;
  const originalBase = process.env.API_BASE;
  const originalPublic = process.env.NEXT_PUBLIC_API_BASE;
  t.after(() => {
    globalThis.fetch = originalFetch;
    if (originalBase === undefined) delete process.env.API_BASE; else process.env.API_BASE = originalBase;
    if (originalPublic === undefined) delete process.env.NEXT_PUBLIC_API_BASE; else process.env.NEXT_PUBLIC_API_BASE = originalPublic;
  });
  process.env.API_BASE = "http://backend.example/";
  process.env.NEXT_PUBLIC_API_BASE = "https://public.example";
  const valid = { ok: true, aktif: true, member_id: 42, role: "user", nama: "Test", email: "test@example.test" };
  for (const [name, status, data, expected] of [
    ["active user", 200, valid, true],
    ["inactive user", 200, { ...valid, aktif: false }, false],
    ["forged or expired token", 401, { ok: false }, false],
    ["backend failure", 503, {}, false],
    ["missing identity", 200, { ok: true }, false],
    ["null response", 200, null, false],
  ]) {
    await t.test(name, async () => {
      globalThis.fetch = async (url, init) => {
        assert.equal(url, "http://backend.example/v1/auth/me");
        assert.equal(init.headers.Authorization, "Bearer test-token");
        assert.equal(init.cache, "no-store");
        return Response.json(data, { status });
      };
      const identity = await getBackendIdentity("test-token");
      assert.equal(Boolean(identity), expected);
      if (identity) assert.equal(identity.role, "user");
    });
  }
  globalThis.fetch = async () => { throw new Error("offline"); };
  assert.equal(await getBackendIdentity("token"), null);
  assert.equal(await getBackendIdentity(""), null);
});
