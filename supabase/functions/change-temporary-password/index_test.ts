import assert from "node:assert/strict";
import { handleTemporaryPasswordChange } from "./index.ts";
import {
  temporaryPasswordFingerprint,
  temporaryPasswordFingerprintKey,
  temporaryPasswordSaltKey,
} from "../_shared/temporary-password.ts";

const callerId = "00000000-0000-4000-8000-000000000010";
const email = "temporal@auth.sistema-r.invalid";
const oldPassword = "Temporal-1234!";
const newPassword = "Personal-9876!";
const salt = "ABEiM0RVZneImaq7zN3u_w";

function profileReader() {
  const builder = {
    select() {
      return builder;
    },
    eq() {
      return builder;
    },
    async maybeSingle() {
      return {
        data: {
          id: callerId,
          is_active: true,
          must_change_password: true,
        },
        error: null,
      };
    },
  };
  return {
    from(table: string) {
      assert.equal(table, "profiles");
      return builder;
    },
  };
}

async function requestContext(failAt: string) {
  const expectedFingerprint = await temporaryPasswordFingerprint(
    email,
    oldPassword,
    salt,
  );
  const calls: string[] = [];
  let updateCount = 0;
  const ctx = {
    userClaims: {
      id: callerId,
      email,
      appMetadata: {
        [temporaryPasswordFingerprintKey]: expectedFingerprint,
        [temporaryPasswordSaltKey]: salt,
      },
    },
    supabase: profileReader(),
    supabaseAdmin: {
      auth: {
        admin: {
          async updateUserById() {
            updateCount += 1;
            calls.push(updateCount === 1 ? "auth:password" : "auth:metadata");
            return {
              data: { user: { id: callerId } },
              error: (failAt === "auth" && updateCount === 1) ||
                  (failAt === "metadata" && updateCount === 2)
                ? new Error("update failed")
                : null,
            };
          },
          async getUserById() {
            calls.push("auth:get");
            return {
              data: failAt === "lookup" ? { user: null } : {
                user: {
                  id: callerId,
                  app_metadata: {
                    [temporaryPasswordFingerprintKey]: expectedFingerprint,
                    [temporaryPasswordSaltKey]: salt,
                  },
                },
              },
              error: failAt === "lookup" ? new Error("lookup failed") : null,
            };
          },
        },
      },
      async rpc(name: string) {
        assert.equal(name, "complete_temporary_password_change_v1");
        calls.push("rpc:complete");
        return {
          error: failAt === "complete" ? new Error("complete failed") : null,
        };
      },
    },
  };
  return { calls, ctx };
}

function passwordRequest(password = newPassword) {
  return new Request(
    "http://127.0.0.1/functions/v1/change-temporary-password",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    },
  );
}

Deno.test("cambio obligatorio rechaza conservar la clave temporal", async () => {
  const { calls, ctx } = await requestContext("none");
  const response = await handleTemporaryPasswordChange(
    passwordRequest(oldPassword),
    ctx,
  );
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    ok: false,
    code: "same_password",
    message: "La nueva clave debe ser diferente de la clave temporal.",
  });
  assert.deepEqual(calls, []);
});

for (
  const scenario of [
    {
      failAt: "auth",
      status: 409,
      code: "auth_update_failed",
      calls: ["auth:password"],
    },
    {
      failAt: "complete",
      status: 409,
      code: "finalize_failed",
      calls: ["auth:password", "rpc:complete"],
    },
  ]
) {
  Deno.test(`cambio obligatorio falla cerrado en ${scenario.failAt}`, async () => {
    const { calls, ctx } = await requestContext(scenario.failAt);
    const response = await handleTemporaryPasswordChange(
      passwordRequest(),
      ctx,
    );
    assert.equal(response.status, scenario.status);
    const payload = await response.json();
    assert.equal(payload.ok, false);
    assert.equal(payload.code, scenario.code);
    assert.deepEqual(calls, scenario.calls);
  });
}

for (
  const scenario of [
    {
      failAt: "lookup",
      cleanupPending: true,
      calls: ["auth:password", "rpc:complete", "auth:get"],
    },
    {
      failAt: "metadata",
      cleanupPending: true,
      calls: [
        "auth:password",
        "rpc:complete",
        "auth:get",
        "auth:metadata",
      ],
    },
    {
      failAt: "none",
      cleanupPending: false,
      calls: [
        "auth:password",
        "rpc:complete",
        "auth:get",
        "auth:metadata",
      ],
    },
  ]
) {
  Deno.test(`limpieza de huella reporta ${scenario.failAt}`, async () => {
    const { calls, ctx } = await requestContext(scenario.failAt);
    const response = await handleTemporaryPasswordChange(
      passwordRequest(),
      ctx,
    );
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      ok: true,
      fingerprintCleanupPending: scenario.cleanupPending,
    });
    assert.deepEqual(calls, scenario.calls);
  });
}
