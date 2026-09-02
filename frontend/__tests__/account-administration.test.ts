import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  completeDemoPasswordChange,
  readAccounts,
  resetTemporaryPassword,
  toggleAccount,
  upsertAccount,
} from "@/lib/account-store";
import {
  defaultAccounts,
  parseAccountsCookie,
  serializeAccountsCookie,
} from "@/lib/accounts";
import {
  generateTemporaryPassword,
  passwordPolicyError,
} from "@/lib/password-policy";

const root = resolve(process.cwd(), "..");
const migration = readFileSync(
  resolve(
    root,
    "supabase",
    "migrations",
    "202608290001_account_administration.sql",
  ),
  "utf8",
);
const bursonMigration = readFileSync(
  resolve(
    root,
    "supabase",
    "migrations",
    "202608300001_burson_channel.sql",
  ),
  "utf8",
);
const trashMigration = readFileSync(
  resolve(
    root,
    "supabase",
    "migrations",
    "202608310001_activity_trash.sql",
  ),
  "utf8",
);
const adminFunction = readFileSync(
  resolve(root, "supabase", "functions", "admin-accounts", "index.ts"),
  "utf8",
);
const changeFunction = readFileSync(
  resolve(
    root,
    "supabase",
    "functions",
    "change-temporary-password",
    "index.ts",
  ),
  "utf8",
);
const temporaryPasswordModule = readFileSync(
  resolve(
    root,
    "supabase",
    "functions",
    "_shared",
    "temporary-password.ts",
  ),
  "utf8",
);
const accountActions = readFileSync(
  resolve(process.cwd(), "app", "cuentas", "actions.ts"),
  "utf8",
);
const roleGate = readFileSync(
  resolve(process.cwd(), "components", "mobile-shell.tsx"),
  "utf8",
);
const supabaseConfig = readFileSync(
  resolve(root, "supabase", "config.toml"),
  "utf8",
);

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe("administración de cuentas y clave temporal", () => {
  it("protege Admin, Burson y el vínculo especial dentro de una transacción", () => {
    expect(migration).toContain("profiles_one_active_burson");
    expect(migration).toContain("last Admin must remain active");
    expect(migration).toContain("active Burson account must remain");
    expect(migration).toContain(
      "transfer the Burson link before changing this operator",
    );
    expect(migration).toContain(
      "activity.status <> 'Entregada'",
    );
    expect(migration).toContain("activity.deleted_at is null");
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain(
      "reassign open activities before deactivating operator",
    );
    expect(migration).toContain("profiles_burson_operator_active");
    expect(migration).toContain(
      "if not p_is_active and p_is_burson_operator then",
    );
    expect(migration).toContain("if p_is_active and p_is_burson_operator then");
    expect(migration).toContain("and not previous_profile.can_create_own_activities");
    expect(migration).toContain(
      "revoke all on table public.audit_events from service_role",
    );
    expect(migration).toContain(
      "revoke all on table public.account_audit_events from service_role",
    );
  });

  it("mantiene advisory antes de todo bloqueo de perfil administrativo", () => {
    const requireServiceAdmin = migration.slice(
      migration.indexOf("create function private.require_service_admin"),
      migration.indexOf("create function private.reassign_open_burson_activities"),
    );
    expect(requireServiceAdmin).toMatch(/language plpgsql\s+volatile/);
    expect(requireServiceAdmin).toContain("for share;");

    const assertLockOrder = (
      source: string,
      functionName: string,
      authorization: string,
    ) => {
      const start = source.indexOf(`create function public.${functionName}`);
      const next = source.indexOf("create function ", start + 1);
      const block = source.slice(start, next < 0 ? source.length : next);
      expect(start, functionName).toBeGreaterThanOrEqual(0);
      expect(block.indexOf("pg_advisory_xact_lock"), functionName).toBeGreaterThanOrEqual(0);
      expect(block.indexOf(authorization), functionName).toBeGreaterThan(
        block.indexOf("pg_advisory_xact_lock"),
      );
    };

    for (const name of [
      "create_account_profile_v1",
      "prepare_temporary_password_reset_v1",
      "confirm_temporary_password_reset_v1",
    ])
      assertLockOrder(migration, name, "private.require_service_admin");
    assertLockOrder(migration, "update_account_v1", "private.require_admin_profile");
    assertLockOrder(
      bursonMigration,
      "create_burson_request_v1",
      "private.require_active_profile('burson')",
    );
    for (const name of ["soft_delete_activity_v1", "restore_activity_v1"])
      assertLockOrder(trashMigration, name, "private.require_admin_profile");
    expect(accountActions).toContain('code === "40P01"');
  });

  it("reserva las operaciones Auth privilegiadas para Edge Functions", () => {
    const createRpc = migration.slice(
      migration.indexOf("create function public.create_account_profile_v1"),
      migration.indexOf("create function public.update_account_v1"),
    );
    expect(migration).toContain(
      "grant execute on function public.create_account_profile_v1",
    );
    expect(migration).toMatch(
      /create_account_profile_v1[\s\S]*?\) to service_role;/,
    );
    expect(createRpc).toMatch(
      /can_create_own_activities, must_change_password[\s\S]*p_can_create_own_activities, true/,
    );
    expect(adminFunction).toMatch(
      /withSupabase<EdgeDatabase>\(\s*\{ auth: "user" \}/,
    );
    expect(adminFunction).toContain("data.role !== \"admin\"");
    expect(adminFunction).toContain("createUser({");
    expect(adminFunction).toContain("deleteUser(");
    expect(adminFunction).toContain("updateUserById(");
    expect(adminFunction).toContain("listUsers({");
    expect(adminFunction).toContain("profile_create_cleanup_pending");
    expect(adminFunction).toContain("temporaryPasswordFingerprintKey");
    expect(temporaryPasswordModule).toContain('name: "PBKDF2"');
    expect(temporaryPasswordModule).toContain("fingerprintIterations = 600_000");
    expect(temporaryPasswordModule).toContain("temporaryPasswordSaltKey");
    expect(adminFunction.indexOf("unsupported_action")).toBeLessThan(
      adminFunction.indexOf("const temporaryPassword"),
    );
    expect(adminFunction).not.toMatch(/SERVICE_ROLE|sb_secret_|service_role/i);
  });

  it("audita el reset en dos fases y limpia el flag solo después de Auth", () => {
    const resetFlow = adminFunction.slice(
      adminFunction.indexOf('body.action === "reset-password"'),
    );
    expect(migration).toContain("must_change_password = true");
    expect(migration).toContain("session.revoked_at is null");
    expect(migration).toContain(
      "Rotación de clave temporal iniciada; sesiones revocadas",
    );
    expect(migration).toContain("confirm_temporary_password_reset_v1");
    expect(migration).toContain("Clave temporal regenerada por Admin");
    expect(
      resetFlow.indexOf("prepare_temporary_password_reset_v1"),
    ).toBeLessThan(resetFlow.indexOf("updateUserById"));
    expect(resetFlow.indexOf("updateUserById")).toBeLessThan(
      resetFlow.indexOf("confirm_temporary_password_reset_v1"),
    );
    expect(changeFunction).toContain("same_password");
    expect(changeFunction).toContain("temporaryPasswordFingerprint");
    expect(changeFunction).toContain("updateUserById(callerId, { password })");
    expect(
      changeFunction.indexOf("updateUserById(callerId, { password })"),
    ).toBeLessThan(
      changeFunction.indexOf("complete_temporary_password_change_v1"),
    );
    expect(changeFunction).toContain("{ p_profile_id: callerId }");
  });

  it("genera claves temporales fuertes sin un prefijo fijo", () => {
    const generated = Array.from({ length: 64 }, generateTemporaryPassword);
    expect(new Set(generated)).toHaveLength(generated.length);
    for (const password of generated) {
      expect(password).toHaveLength(16);
      expect(passwordPolicyError(password)).toBeNull();
      expect(password.startsWith("Rr7!")).toBe(false);
    }
  });

  it("mantiene la política fuerte también en la configuración Auth", () => {
    expect(supabaseConfig).toMatch(/minimum_password_length\s*=\s*12/);
    expect(supabaseConfig).toMatch(
      /password_requirements\s*=\s*"lower_upper_letters_digits_symbols"/,
    );
    expect(passwordPolicyError("ClaveValida9!")).toBeNull();
    for (const invalid of [
      "Corta9!",
      "sinmayuscula9!",
      "SINMINUSCULA9!",
      "SinNumeroClave!",
      "SinSimboloClave9",
    ])
      expect(passwordPolicyError(invalid), invalid).not.toBeNull();
  });

  it("conecta el permiso real y fuerza la ruta exclusiva de cambio", () => {
    expect(accountActions).toContain(
      "setSupabaseOperatorCreationPermissionAction",
    );
    expect(accountActions).toContain("set_operator_creation_permission_v1");
    expect(roleGate).toContain(
      'if (role.mustChangePassword) redirect("/cambiar-clave")',
    );
  });

  it("reproduce en demo la emisión y reemplazo obligatorio de la clave", () => {
    const storage = new MemoryStorage();
    const created = upsertAccount(
      storage,
      {
        name: "Operaria Temporal",
        username: "operaria.temporal",
        password: "Temporal9!Clave",
        roleId: "operario",
        bursonLinked: false,
        canCreateOwnActivities: true,
      },
      "Marco Admin",
    );
    if (!created.ok) throw new Error(created.error);
    expect(created.account.mustChangePassword).toBe(true);

    const reused = completeDemoPasswordChange(
      storage,
      created.account.id,
      "Temporal9!Clave",
    );
    expect(reused).toEqual({
      ok: false,
      error: "La nueva clave debe ser diferente de la clave temporal.",
    });

    const changed = completeDemoPasswordChange(
      storage,
      created.account.id,
      "Definitiva8!Clave",
    );
    expect(changed.ok).toBe(true);
    expect(
      readAccounts(storage).find((item) => item.id === created.account.id),
    ).toMatchObject({
      password: "Definitiva8!Clave",
      mustChangePassword: false,
    });

    const reset = resetTemporaryPassword(
      storage,
      created.account.id,
      "Reinicio7!Clave",
      "Marco Admin",
    );
    expect(reset.ok && reset.account.mustChangePassword).toBe(true);

    expect(
      toggleAccount(storage, created.account.id, "Marco Admin", true),
    ).toEqual({
      ok: false,
      error: "Reasigna primero las actividades abiertas de este Operario.",
    });
    const deactivated = toggleAccount(
      storage,
      created.account.id,
      "Marco Admin",
      false,
    );
    expect(deactivated.ok).toBe(true);
    expect(deactivated.ok && deactivated.account.canCreateOwnActivities).toBe(
      false,
    );
    expect(
      readAccounts(storage).find((item) => item.id === created.account.id)
        ?.canCreateOwnActivities,
    ).toBe(false);
    const inactiveGrant = upsertAccount(
      storage,
      {
        name: "Operaria Temporal",
        username: "operaria.temporal",
        password: "",
        roleId: "operario",
        bursonLinked: false,
        canCreateOwnActivities: true,
      },
      "Marco Admin",
      created.account.id,
    );
    expect(inactiveGrant).toMatchObject({ ok: false });
  });

  it("mantiene exactamente una cuenta Burson activa también en demo", () => {
    const storage = new MemoryStorage();
    const created = upsertAccount(
      storage,
      {
        name: "Segundo Burson",
        username: "burson.dos",
        password: "Temporal9!Clave",
        roleId: "burson",
        bursonLinked: false,
        canCreateOwnActivities: false,
      },
      "Marco Admin",
    );
    expect(created).toMatchObject({
      ok: false,
      error: "Debe existir exactamente una cuenta Burson activa.",
    });

    const burson = readAccounts(storage).find(
      (account) => account.roleId === "burson" && account.active,
    );
    expect(burson).toBeDefined();
    expect(toggleAccount(storage, burson!.id, "Marco Admin", false)).toMatchObject({
      ok: false,
      error: "Debe permanecer activa la única cuenta Burson.",
    });
  });

  it("rechaza cookies demo que rompen invariantes de cuenta", () => {
    type Compact = {
      i: string;
      u: string;
      p: string;
      r: "admin" | "operario" | "burson";
      b: boolean;
      c: boolean;
      m: boolean;
      a: boolean;
      n: string;
    };
    const valid = JSON.parse(
      serializeAccountsCookie(defaultAccounts),
    ) as Compact[];
    expect(parseAccountsCookie(JSON.stringify(valid))).toHaveLength(
      defaultAccounts.length,
    );

    const invalidVariants = [
      (items: Compact[]) => {
        items.find((item) => item.r === "admin")!.a = false;
      },
      (items: Compact[]) => {
        items.find((item) => item.r === "burson")!.a = false;
      },
      (items: Compact[]) => {
        const duplicate = structuredClone(
          items.find((item) => item.r === "burson")!,
        );
        duplicate.i = "account-burson-duplicate";
        duplicate.u = "burson.duplicate";
        items.push(duplicate);
      },
      (items: Compact[]) => {
        items.find((item) => item.b)!.b = false;
      },
      (items: Compact[]) => {
        items.find((item) => item.u === "carlos")!.b = true;
      },
      (items: Compact[]) => {
        items.find((item) => item.r === "admin")!.c = true;
      },
      (items: Compact[]) => {
        items.find((item) => item.r === "burson")!.b = true;
      },
      (items: Compact[]) => {
        const operator = items.find((item) => item.u === "carlos")!;
        operator.a = false;
        operator.c = true;
      },
    ];

    for (const mutate of invalidVariants) {
      const candidate = structuredClone(valid);
      mutate(candidate);
      expect(parseAccountsCookie(JSON.stringify(candidate))).toEqual([]);
    }
  });
});
