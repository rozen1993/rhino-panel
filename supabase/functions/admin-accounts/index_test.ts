import assert from "node:assert/strict";
import {
  sistemaRUsernameKey,
  temporaryPasswordFingerprint,
  temporaryPasswordFingerprintKey,
  temporaryPasswordSaltKey,
} from "../_shared/temporary-password.ts";
import { handleAdminAccountsRequest as actualHandler } from "./index.ts";
import { withCredentialMutex } from "../_shared/test-credential-context.ts";
const handleAdminAccountsRequest=(request:Request,ctx:any)=>actualHandler(request,withCredentialMutex(ctx));

const adminId = "00000000-0000-4000-8000-000000000001";
const targetId = "00000000-0000-4000-8000-000000000002";
Deno.env.set("SISTEMA_R_USERNAME_DOMAIN", "auth.sistema-r.invalid");

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
          id: adminId,
          role: "admin",
          is_active: true,
          must_change_password: false,
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

function post(body: Record<string, unknown>) {
  return new Request("http://127.0.0.1/functions/v1/admin-accounts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validCreate = {
  action: "create",
  username: "operador.prueba",
  displayName: "Operador Prueba",
  role: "operario",
  isBursonOperator: false,
  canCreateOwnActivities: false,
  temporaryPassword: "Temporal-1234!",
};

Deno.test("self reset is rejected before any Auth or database mutation",async()=>{
  const result=await actualHandler(post({action:"reset-password",profileId:adminId,temporaryPassword:"Temporal-1234!"}),{
    userClaims:{id:adminId},supabase:profileReader(),
    supabaseAdmin:{rpc(){assert.fail("must not acquire a lock or write");}},
  });
  assert.equal(result.status,409);
  assert.equal((await result.json()).code,"self_reset_not_allowed");
});

for (const retired of [{ role: "burson" }, { isBursonOperator: true }]) {
  Deno.test("rechaza el rol/vínculo retirado antes de crear usuario Auth " + JSON.stringify(retired), async () => {
    const response = await handleAdminAccountsRequest(post({ ...validCreate, ...retired }), {
      userClaims: { id: adminId },
      supabase: profileReader(),
      supabaseAdmin: { auth: { admin: { async createUser() {
        assert.fail("No debe crear una cuenta ni privilegio Burson");
      } } } },
    });
    assert.equal(response.status, 400);
  });
}

function serviceProfileReader(
  result: { data: { id: string } | null; error: Error | null },
  calls: string[],
) {
  const builder = {
    select(columns: string) {
      assert.equal(columns, "id");
      return builder;
    },
    eq(column: string, value: string) {
      assert.equal(column, "id");
      assert.equal(value, targetId);
      return builder;
    },
    async maybeSingle() {
      calls.push(`profile:lookup:${targetId}`);
      return result;
    },
  };
  return (table: string) => {
    assert.equal(table, "profiles");
    return builder;
  };
}

function serviceUsernameReader(
  result: {
    data: { username: string } | null;
    error: Error | null;
  },
  calls: string[],
) {
  const builder = {
    select(columns: string) {
      assert.equal(columns, "username");
      return builder;
    },
    eq(column: string, value: string) {
      assert.equal(column, "id");
      assert.equal(value, targetId);
      return builder;
    },
    async maybeSingle() {
      calls.push("profile:username");
      return result;
    },
  };
  return (table: string) => {
    assert.equal(table, "profiles");
    return builder;
  };
}

Deno.test(
  "alta falla cerrada cuando falta el dominio interno",
  async () => {
    const previousDomain = Deno.env.get("SISTEMA_R_USERNAME_DOMAIN");
    Deno.env.delete("SISTEMA_R_USERNAME_DOMAIN");
    try {
      const response = await handleAdminAccountsRequest(post(validCreate), {
        userClaims: { id: adminId },
        supabase: profileReader(),
        supabaseAdmin: {
          auth: {
            admin: {
              async createUser() {
                assert.fail("Auth no debe ejecutarse sin dominio configurado");
              },
            },
          },
        },
      });

      assert.equal(response.status, 500);
      assert.deepEqual(await response.json(), {
        ok: false,
        code: "server_configuration",
      });
    } finally {
      if (previousDomain === undefined) {
        Deno.env.delete("SISTEMA_R_USERNAME_DOMAIN");
      } else {
        Deno.env.set("SISTEMA_R_USERNAME_DOMAIN", previousDomain);
      }
    }
  },
);

for (const cleanupFails of [false, true]) {
  Deno.test(
    `alta compensa Auth cuando falla el perfil (cleanup=${cleanupFails})`,
    async () => {
      const calls: string[] = [];
      const ctx = {
        userClaims: { id: adminId },
        supabase: profileReader(),
        supabaseAdmin: {
          auth: {
            admin: {
              async createUser() {
                calls.push("auth:create");
                return { data: { user: { id: targetId } }, error: null };
              },
              async deleteUser(id: string) {
                calls.push(`auth:delete:${id}`);
                return {
                  error: cleanupFails ? new Error("delete failed") : null,
                };
              },
            },
          },
          async rpc(name: string) {
            calls.push(`rpc:${name}`);
            return { error: new Error("profile failed") };
          },
        },
      };

      const response = await handleAdminAccountsRequest(post(validCreate), ctx);
      assert.equal(response.status, 409);
      assert.deepEqual(await response.json(), {
        ok: false,
        code: cleanupFails
          ? "profile_create_cleanup_pending"
          : "profile_create_failed",
      });
      assert.deepEqual(calls, [
        "auth:create",
        "rpc:create_account_profile_v1",
        `auth:delete:${targetId}`,
      ]);
    },
  );
}

for (const cleanupFails of [false, true]) {
  Deno.test(`Aunor duplicado conserva compensación Auth (cleanup=${cleanupFails})`, async () => {
    const calls: string[]=[];
    const ctx={userClaims:{id:adminId},supabase:profileReader(),supabaseAdmin:{
      auth:{admin:{
        async createUser(){calls.push("auth:create");return {data:{user:{id:targetId}},error:null};},
        async deleteUser(id:string){calls.push(`auth:delete:${id}`);return {error:cleanupFails?new Error("cleanup failed"):null};},
      }},
      async rpc(name:string,payload:Record<string,unknown>){
        assert.equal(name,"create_account_profile_v1");assert.equal(payload.p_role,"aunor");
        return {error:{code:"SR009",message:"only one active Aunor account"}};
      },
    }};
    const result=await handleAdminAccountsRequest(post({...validCreate,role:"aunor"}),ctx);
    assert.equal(result.status,409);
    assert.deepEqual(await result.json(),{ok:false,code:cleanupFails?"profile_create_cleanup_pending":"aunor_account_exists"});
    assert.deepEqual(calls,["auth:create",`auth:delete:${targetId}`]);
  });
}

const orphanAuthUser = {
  id: targetId,
  email: "OPERADOR.PRUEBA@AUTH.SISTEMA-R.INVALID",
  app_metadata: { legacy: "preserved" },
};

for (
  const scenario of [
    {
      name: "lookup de Auth falla",
      code: "auth_lookup_failed",
      status: 503,
      lookupError: true,
      users: [] as typeof orphanAuthUser[],
      profile: { data: null, error: null },
      repairError: false,
      expectedCalls: ["auth:create", "auth:list:1"],
    },
    {
      name: "Auth no devuelve el usuario rechazado",
      code: "auth_create_failed",
      status: 409,
      lookupError: false,
      users: [] as typeof orphanAuthUser[],
      profile: { data: null, error: null },
      repairError: false,
      expectedCalls: ["auth:create", "auth:list:1"],
    },
    {
      name: "lookup del perfil falla",
      code: "profile_lookup_failed",
      status: 503,
      lookupError: false,
      users: [orphanAuthUser],
      profile: { data: null, error: new Error("profile lookup failed") },
      repairError: false,
      expectedCalls: [
        "auth:create",
        "auth:list:1",
        `profile:lookup:${targetId}`,
      ],
    },
    {
      name: "el perfil ya existe",
      code: "account_exists",
      status: 409,
      lookupError: false,
      users: [orphanAuthUser],
      profile: { data: { id: targetId }, error: null },
      repairError: false,
      expectedCalls: [
        "auth:create",
        "auth:list:1",
        `profile:lookup:${targetId}`,
      ],
    },
    {
      name: "reparar Auth falla",
      code: "auth_repair_failed",
      status: 409,
      lookupError: false,
      users: [orphanAuthUser],
      profile: { data: null, error: null },
      repairError: true,
      expectedCalls: [
        "auth:create",
        "auth:list:1",
        `profile:lookup:${targetId}`,
        `auth:repair:${targetId}`,
      ],
    },
  ]
) {
  Deno.test(`alta recuperable: ${scenario.name}`, async () => {
    const calls: string[] = [];
    const ctx = {
      userClaims: { id: adminId },
      supabase: profileReader(),
      supabaseAdmin: {
        auth: {
          admin: {
            async createUser() {
              calls.push("auth:create");
              return {
                data: { user: null },
                error: new Error("user already exists"),
              };
            },
            async listUsers(options: { page: number; perPage: number }) {
              assert.equal(options.perPage, 1000);
              calls.push(`auth:list:${options.page}`);
              return {
                data: { users: scenario.users },
                error: scenario.lookupError
                  ? new Error("auth lookup failed")
                  : null,
              };
            },
            async updateUserById(id: string) {
              calls.push(`auth:repair:${id}`);
              return {
                data: { user: null },
                error: scenario.repairError
                  ? new Error("auth repair failed")
                  : null,
              };
            },
          },
        },
        from: serviceProfileReader(scenario.profile, calls),
        async rpc(name: string) {
          assert.fail(`RPC inesperada: ${name}`);
        },
      },
    };

    const response = await handleAdminAccountsRequest(post(validCreate), ctx);
    assert.equal(response.status, scenario.status);
    assert.deepEqual(await response.json(), {
      ok: false,
      code: scenario.code,
    });
    assert.deepEqual(calls, scenario.expectedCalls);
  });
}

Deno.test(
  "alta recupera un usuario Auth huerfano despues de paginar",
  async () => {
    const calls: string[] = [];
    const firstPage = Array.from({ length: 1000 }, (_, index) => ({
      id: `unrelated-${index}`,
      email: `unrelated-${index}@auth.sistema-r.invalid`,
      app_metadata: {},
    }));
    const ctx = {
      userClaims: { id: adminId },
      supabase: profileReader(),
      supabaseAdmin: {
        auth: {
          admin: {
            async createUser() {
              calls.push("auth:create");
              return {
                data: { user: null },
                error: new Error("user already exists"),
              };
            },
            async listUsers(options: { page: number; perPage: number }) {
              assert.equal(options.perPage, 1000);
              calls.push(`auth:list:${options.page}`);
              return {
                data: {
                  users: options.page === 1 ? firstPage : [orphanAuthUser],
                },
                error: null,
              };
            },
            async updateUserById(
              id: string,
              payload: {
                password: string;
                email_confirm: boolean;
                app_metadata: Record<string, unknown>;
              },
            ) {
              calls.push(`auth:repair:${id}`);
              assert.equal(id, targetId);
              assert.equal(payload.password, validCreate.temporaryPassword);
              assert.equal(payload.email_confirm, true);
              assert.equal(payload.app_metadata.legacy, "preserved");
              assert.equal(
                payload.app_metadata[sistemaRUsernameKey],
                validCreate.username,
              );
              const generatedSalt = String(
                payload.app_metadata[temporaryPasswordSaltKey],
              );
              assert.match(
                String(payload.app_metadata[temporaryPasswordFingerprintKey]),
                /^[a-f0-9]{64}$/,
              );
              assert.match(
                generatedSalt,
                /^[A-Za-z0-9_-]{22}$/,
              );
              assert.equal(
                payload.app_metadata[temporaryPasswordFingerprintKey],
                await temporaryPasswordFingerprint(
                  orphanAuthUser.email,
                  validCreate.temporaryPassword,
                  generatedSalt,
                ),
              );
              return { data: { user: { id: targetId } }, error: null };
            },
          },
        },
        from: serviceProfileReader({ data: null, error: null }, calls),
        async rpc(name: string, args: Record<string, unknown>) {
          calls.push(`rpc:${name}`);
          assert.equal(name, "create_account_profile_v1");
          assert.deepEqual(args, {
            p_profile_id: targetId,
            p_username: validCreate.username,
            p_display_name: validCreate.displayName,
            p_role: validCreate.role,
            p_is_burson_operator: validCreate.isBursonOperator,
            p_can_create_own_activities: validCreate.canCreateOwnActivities,
            p_actor_id: adminId,
          });
          return { error: null };
        },
      },
    };

    const response = await handleAdminAccountsRequest(post(validCreate), ctx);
    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), { ok: true, profileId: targetId });
    assert.deepEqual(calls, [
      "auth:create",
      "auth:list:1",
      "auth:list:2",
      `profile:lookup:${targetId}`,
      `auth:repair:${targetId}`,
      "rpc:create_account_profile_v1",
    ]);
  },
);

for (
  const scenario of [
    {
      name: "prepare falla antes de tocar Auth",
      failAt: "prepare",
      code: "reset_prepare_failed",
      expectedCalls: ["auth:get", "profile:username", "rpc:prepare"],
    },
    {
      name: "Auth falla y conserva el bloqueo preparado",
      failAt: "auth",
      code: "auth_reset_failed",
      expectedCalls: [
        "auth:get",
        "profile:username",
        "rpc:prepare",
        "auth:update",
      ],
    },
    {
      name: "confirm falla despues de cambiar Auth",
      failAt: "confirm",
      code: "reset_confirm_failed",
      expectedCalls: [
        "auth:get",
        "profile:username",
        "rpc:prepare",
        "auth:update",
        "rpc:confirm",
      ],
    },
  ]
) {
  Deno.test(`reset fail-closed: ${scenario.name}`, async () => {
    const calls: string[] = [];
    const ctx = {
      userClaims: { id: adminId },
      supabase: profileReader(),
      supabaseAdmin: {
        auth: {
          admin: {
            async getUserById() {
              calls.push("auth:get");
              return {
                data: {
                  user: {
                    id: targetId,
                    email: "operador.prueba@auth.sistema-r.invalid",
                    app_metadata: { sistema_r_username: "operador.prueba" },
                  },
                },
                error: null,
              };
            },
            async updateUserById() {
              calls.push("auth:update");
              return {
                data: { user: { id: targetId } },
                error: scenario.failAt === "auth"
                  ? new Error("auth failed")
                  : null,
              };
            },
          },
        },
        from: serviceUsernameReader(
          { data: { username: "operador.prueba" }, error: null },
          calls,
        ),
        async rpc(name: string) {
          if (name === "prepare_temporary_password_reset_v1") {
            calls.push("rpc:prepare");
            return {
              error: scenario.failAt === "prepare"
                ? new Error("prepare failed")
                : null,
            };
          }
          assert.equal(name, "confirm_temporary_password_reset_v1");
          calls.push("rpc:confirm");
          return {
            error: scenario.failAt === "confirm"
              ? new Error("confirm failed")
              : null,
          };
        },
      },
    };

    const response = await handleAdminAccountsRequest(
      post({
        action: "reset-password",
        profileId: targetId,
        temporaryPassword: "Temporal-5678!",
      }),
      ctx,
    );
    assert.equal(response.status, 409);
    const payload = await response.json();
    assert.equal(payload.ok, false);
    assert.equal(payload.code, scenario.code);
    assert.deepEqual(calls, scenario.expectedCalls);
  });
}

Deno.test(
  "reset repara el username de Auth desde el perfil canonico",
  async () => {
    const calls: string[] = [];
    const email = "operador.prueba@auth.sistema-r.invalid";
    const updatedMetadata: Record<string, unknown>[] = [];
    const ctx = {
      userClaims: { id: adminId },
      supabase: profileReader(),
      supabaseAdmin: {
        auth: {
          admin: {
            async getUserById() {
              calls.push("auth:get");
              return {
                data: {
                  user: {
                    id: targetId,
                    email,
                    app_metadata: { legacy: "preserved" },
                  },
                },
                error: null,
              };
            },
            async updateUserById(
              id: string,
              payload: {
                password: string;
                app_metadata: Record<string, unknown>;
              },
            ) {
              calls.push("auth:update");
              assert.equal(id, targetId);
              assert.equal(payload.password, "Temporal-5678!");
              updatedMetadata.push(payload.app_metadata);
              return { data: { user: { id: targetId } }, error: null };
            },
          },
        },
        from: serviceUsernameReader(
          { data: { username: "Operador.Prueba" }, error: null },
          calls,
        ),
        async rpc(name: string) {
          calls.push(`rpc:${name}`);
          return { error: null };
        },
      },
    };

    const response = await handleAdminAccountsRequest(
      post({
        action: "reset-password",
        profileId: targetId,
        temporaryPassword: "Temporal-5678!",
      }),
      ctx,
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true, profileId: targetId });
    const metadata = updatedMetadata[0];
    assert.ok(metadata);
    assert.equal(metadata.legacy, "preserved");
    assert.equal(metadata[sistemaRUsernameKey], "operador.prueba");
    assert.match(
      String(metadata[temporaryPasswordFingerprintKey]),
      /^[a-f0-9]{64}$/,
    );
    assert.match(
      String(metadata[temporaryPasswordSaltKey]),
      /^[A-Za-z0-9_-]{22}$/,
    );
    assert.deepEqual(calls, [
      "auth:get",
      "profile:username",
      "rpc:prepare_temporary_password_reset_v1",
      "auth:update",
      "rpc:confirm_temporary_password_reset_v1",
    ]);
  },
);

Deno.test(
  "reset no bloquea la cuenta si falta el username canonico",
  async () => {
    const calls: string[] = [];
    const response = await handleAdminAccountsRequest(
      post({
        action: "reset-password",
        profileId: targetId,
        temporaryPassword: "Temporal-5678!",
      }),
      {
        userClaims: { id: adminId },
        supabase: profileReader(),
        supabaseAdmin: {
          auth: {
            admin: {
              async getUserById() {
                calls.push("auth:get");
                return {
                  data: {
                    user: {
                      id: targetId,
                      email: "operador.prueba@auth.sistema-r.invalid",
                      app_metadata: {},
                    },
                  },
                  error: null,
                };
              },
              async updateUserById() {
                assert.fail("Auth no debe cambiar sin username canonico");
              },
            },
          },
          from: serviceUsernameReader({ data: null, error: null }, calls),
          async rpc() {
            assert.fail("El bloqueo no debe iniciarse sin username canonico");
          },
        },
      },
    );

    assert.equal(response.status, 409);
    assert.deepEqual(await response.json(), {
      ok: false,
      code: "profile_username_unavailable",
    });
    assert.deepEqual(calls, ["auth:get", "profile:username"]);
  },
);
