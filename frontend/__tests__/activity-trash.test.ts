import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { accountStoreKey } from "@/lib/account-store";
import { defaultAccounts } from "@/lib/accounts";
import {
  activityStoreKey,
  actorFromRole,
  addThreadMessage,
  canViewActivity,
  deleteThreadMessage,
  listTrashedActivities,
  readActivities,
  restoreActivity,
  softDeleteActivity,
  updateExecutionActivity,
} from "@/lib/activity-simulation";
import { roles } from "@/lib/roles";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

const migration = readFileSync(
  resolve(
    process.cwd(),
    "..",
    "supabase",
    "migrations",
    "202608310001_activity_trash.sql",
  ),
  "utf8",
);
const trashPage = readFileSync(
  resolve(process.cwd(), "app", "papelera", "page.tsx"),
  "utf8",
);
const trashActions = readFileSync(
  resolve(process.cwd(), "app", "papelera", "actions.ts"),
  "utf8",
);
const trashDashboard = readFileSync(
  resolve(process.cwd(), "components", "trash-dashboard.tsx"),
  "utf8",
);
const supabaseProxy = readFileSync(
  resolve(process.cwd(), "lib", "supabase", "proxy.ts"),
  "utf8",
);

const adminRole = {
  ...roles.admin,
  accountId: "account-admin",
  accountName: "Marco Admin",
};
const anaRole = {
  ...roles.operario,
  accountId: "account-ana",
  accountName: "Ana Torres",
};
const bursonRole = {
  ...roles.burson,
  accountId: "account-burson",
  accountName: "Equipo Burson",
};

describe("Corte 5: baja reversible y Papelera", () => {
  it("define dos RPC Admin transaccionales sin eliminación física", () => {
    expect(migration).toContain("function public.soft_delete_activity_v1");
    expect(migration).toContain("function public.restore_activity_v1");
    expect(migration.match(/security definer/g)).toHaveLength(2);
    expect(migration.match(/set search_path = ''/g)).toHaveLength(2);
    expect(migration.match(/private\.require_admin_profile\(\)/g)).toHaveLength(
      2,
    );
    expect(migration).not.toMatch(/delete\s+from\s+public\.activities/i);
    expect(migration).toContain("activities_trashed_idx");
    expect(migration).toContain("where deleted_at is not null");
  });

  it("serializa filas, versiones y administración de cuentas en el orden correcto", () => {
    const softDelete = migration.slice(
      migration.indexOf("create function public.soft_delete_activity_v1"),
      migration.indexOf("create function public.restore_activity_v1"),
    );
    const restore = migration.slice(
      migration.indexOf("create function public.restore_activity_v1"),
      migration.indexOf("revoke all on function"),
    );
    expect(softDelete).toContain("for update");
    expect(softDelete).toContain("pg_advisory_xact_lock");
    expect(softDelete.indexOf("pg_advisory_xact_lock")).toBeLessThan(
      softDelete.indexOf("for update"),
    );
    expect(softDelete.lastIndexOf("private.require_admin_profile()"))
      .toBeGreaterThan(softDelete.indexOf("pg_advisory_xact_lock"));
    expect(softDelete.indexOf("activity.deleted_at is not null")).toBeLessThan(
      softDelete.indexOf("activity.version <> p_expected_version"),
    );
    expect(restore.indexOf("pg_advisory_xact_lock")).toBeLessThan(
      restore.indexOf("for update"),
    );
    expect(restore).toContain(
      "hashtextextended('sistema-r-account-administration', 0)",
    );
    expect(restore.lastIndexOf("private.require_admin_profile()"))
      .toBeGreaterThan(restore.indexOf("pg_advisory_xact_lock"));
    expect(restore).toContain("restore requires an active responsible");
    expect(restore).toContain("activity.status <> 'Entregada'");
    expect(restore).toContain("delivered activity keeps its historical responsible");
    expect(restore).toContain("resolved_responsible_id is distinct from");
  });

  it("conserva el modelo y audita sin conceder ejecución a service_role", () => {
    expect(migration).toContain("'Actividad dada de baja'");
    expect(migration).toContain("'Actividad restaurada'");
    expect(migration).toContain("'motivo', normalized_reason");
    expect(migration).toContain("deleted_at = null");
    expect(migration).toContain("deleted_by = null");
    expect(migration).toContain("deletion_reason = null");
    expect(migration).toContain("'responsable', case");
    expect(migration).toContain("else responsible.display_name");
    expect(migration).toContain("when responsible_changed then responsible.display_name");
    expect(migration).not.toMatch(/set\s+status\s*=/i);
    expect(migration).not.toMatch(/set\s+delivered_at\s*=/i);
    expect(migration).toContain(
      "from public, anon, authenticated, service_role",
    );
    expect(migration.match(/grant execute on function/g)).toHaveLength(2);
  });

  it("mantiene la Papelera como ruta exclusiva de Admin y sin autoridad cliente", () => {
    expect(trashPage).toContain(
      'requireRole((candidate) => candidate.id === "admin")',
    );
    expect(supabaseProxy).toContain('"/papelera"');
    expect(trashActions).toContain("currentSupabaseRole");
    expect(trashActions).toContain("!role.mustChangePassword");
    expect(trashActions).not.toContain("p_actor_id");
    expect(trashActions).not.toContain("p_role");
    for (const path of [
      '"/papelera"',
      '"/actividades"',
      '"/historico"',
      '"/burson"',
    ])
      expect(trashActions).toContain(`revalidatePath(${path})`);
    expect(trashDashboard).not.toContain("currentResponsible?.bursonLinked");
    expect(trashDashboard).toContain(
      "pendingActivityIds.has(item.id)",
    );
    expect(trashDashboard).toContain("pendingActivityIdsRef.current.has(item.id)");
    expect(trashDashboard).not.toContain("useTransition");
  });

  it("valida motivo y versión antes de dar de baja en demo", () => {
    const storage = new MemoryStorage();
    const item = readActivities(storage)[0];
    const admin = actorFromRole(adminRole);
    expect(
      softDeleteActivity(storage, item.id, "x", admin, item.version).ok,
    ).toBe(false);
    expect(
      softDeleteActivity(
        storage,
        item.id,
        "Motivo válido",
        admin,
        item.version + 1,
      ).ok,
    ).toBe(false);
    const unchanged = readActivities(storage).find(
      (entry) => entry.id === item.id,
    );
    expect(unchanged?.version).toBe(item.version);
    expect(unchanged?.deletedAt).toBeUndefined();
  });

  it("oculta la baja a Operario y Burson, bloquea mutaciones y conserva el hilo", () => {
    const storage = new MemoryStorage();
    const original = readActivities(storage)[0];
    const admin = actorFromRole(adminRole);
    const ana = actorFromRole(anaRole);
    const opened = addThreadMessage(
      storage,
      original.id,
      "Revisión previa a la baja",
      admin,
      original.version,
    );
    if (!opened.ok) throw new Error(opened.error);
    const removed = deleteThreadMessage(
      storage,
      opened.activity.id,
      opened.activity.thread[0].id,
      admin,
      opened.activity.thread[0].version,
    );
    if (!removed.ok) throw new Error(removed.error);
    const deleted = softDeleteActivity(
      storage,
      removed.activity.id,
      "Registro duplicado confirmado",
      admin,
      removed.activity.version,
    );
    if (!deleted.ok) throw new Error(deleted.error);

    expect(deleted.activity).toMatchObject({
      deletionReason: "Registro duplicado confirmado",
      version: removed.activity.version + 1,
    });
    expect(deleted.activity.audit[0].action).toBe("Actividad dada de baja");
    expect(canViewActivity(deleted.activity, adminRole)).toBe(true);
    expect(canViewActivity(deleted.activity, anaRole)).toBe(false);
    expect(canViewActivity(deleted.activity, bursonRole)).toBe(false);
    expect(listTrashedActivities(storage, anaRole)).toHaveLength(0);
    expect(listTrashedActivities(storage, adminRole)).toHaveLength(1);
    expect(
      updateExecutionActivity(
        storage,
        deleted.activity.id,
        { materialLink: original.materialLink, notes: "Intento" },
        ana,
        deleted.activity.version,
      ).ok,
    ).toBe(false);

    const restored = restoreActivity(
      storage,
      storage,
      deleted.activity.id,
      admin,
      deleted.activity.version,
    );
    if (!restored.ok) throw new Error(restored.error);
    expect(restored.activity.deletedAt).toBeUndefined();
    expect(restored.activity.audit[0].action).toBe("Actividad restaurada");
    expect(restored.activity.audit).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "Actividad dada de baja",
          detail: "Registro duplicado confirmado",
        }),
      ]),
    );
    const raw = JSON.parse(storage.getItem(activityStoreKey)!) as Array<{
      id: string;
      thread: Array<{ deletedAt?: string }>;
    }>;
    expect(raw.find((entry) => entry.id === original.id)?.thread[0].deletedAt).toBeTruthy();
  });

  it("exige reemplazo activo solo al restaurar trabajo abierto", () => {
    const storage = new MemoryStorage();
    const admin = actorFromRole(adminRole);
    const open = readActivities(storage).find(
      (item) => item.id === "piezas-creativas",
    )!;
    const deleted = softDeleteActivity(
      storage,
      open.id,
      "Baja temporal por reorganización",
      admin,
      open.version,
    );
    if (!deleted.ok) throw new Error(deleted.error);
    storage.setItem(
      accountStoreKey,
      JSON.stringify(
        defaultAccounts.map((account) =>
          account.id === "account-ana"
            ? {
                ...account,
                active: false,
                canCreateOwnActivities: false,
              }
            : account,
        ),
      ),
    );

    const trapped = restoreActivity(
      storage,
      storage,
      open.id,
      admin,
      deleted.activity.version,
    );
    expect(trapped.ok).toBe(false);
    if (!trapped.ok) expect(trapped.error).toContain("ya no está activo");
    const restored = restoreActivity(
      storage,
      storage,
      open.id,
      admin,
      deleted.activity.version,
      "account-carlos",
    );
    expect(restored.ok).toBe(true);
    if (restored.ok)
      expect(restored.activity).toMatchObject({
        responsibleAccountId: "account-carlos",
        responsible: "Carlos Vega",
      });
  });

  it("preserva al responsable histórico inactivo de una actividad entregada", () => {
    const storage = new MemoryStorage();
    const admin = actorFromRole(adminRole);
    const delivered = readActivities(storage).find(
      (item) => item.id === "cobertura-norte",
    )!;
    const deleted = softDeleteActivity(
      storage,
      delivered.id,
      "Archivo entregado en revisión",
      admin,
      delivered.version,
    );
    if (!deleted.ok) throw new Error(deleted.error);
    storage.setItem(
      accountStoreKey,
      JSON.stringify(
        defaultAccounts.map((account) =>
          account.id === "account-ana" ? { ...account, active: false } : account,
        ),
      ),
    );
    const reassigned = restoreActivity(
      storage,
      storage,
      delivered.id,
      admin,
      deleted.activity.version,
      "account-carlos",
    );
    expect(reassigned).toMatchObject({
      ok: false,
      error: "Una actividad entregada conserva a su responsable histórico.",
    });

    const restored = restoreActivity(
      storage,
      storage,
      delivered.id,
      admin,
      deleted.activity.version,
      "account-ana",
    );
    expect(restored.ok).toBe(true);
    if (restored.ok) {
      expect(restored.activity.responsibleAccountId).toBe("account-ana");
      expect(restored.activity.responsible).toBe(delivered.responsible);
      expect(restored.activity.audit[0].detail).toBeUndefined();
    }
  });

  it("restaura un encargo histórico con un operario normal sin exigir vínculo Burson", () => {
    const storage = new MemoryStorage();
    const admin = actorFromRole(adminRole);
    const request = readActivities(storage).find(
      (item) => item.id === "locucion-burson",
    )!;
    const deleted = softDeleteActivity(
      storage,
      request.id,
      "Revisión temporal del encargo",
      admin,
      request.version,
    );
    if (!deleted.ok) throw new Error(deleted.error);
    storage.setItem(
      accountStoreKey,
      JSON.stringify(
        defaultAccounts.map((account) =>
          account.id === "account-luis"
            ? { ...account, bursonLinked: false }
            : account.id === "account-carlos"
              ? { ...account, bursonLinked: true }
              : account,
        ),
      ),
    );

    const obsoleteLink = restoreActivity(
      storage,
      storage,
      request.id,
      admin,
      deleted.activity.version,
    );
    expect(obsoleteLink.ok).toBe(true);
    if (!obsoleteLink.ok) throw new Error(obsoleteLink.error);
    expect(obsoleteLink.activity.origin).toBe("burson");
    const removedAgain = softDeleteActivity(storage, request.id, "Segunda revisión temporal", admin, obsoleteLink.activity.version);
    if (!removedAgain.ok) throw new Error(removedAgain.error);

    const restored = restoreActivity(
      storage,
      storage,
      request.id,
      admin,
      removedAgain.activity.version,
      "account-carlos",
    );
    expect(restored.ok).toBe(true);
    if (restored.ok)
      expect(restored.activity.responsibleAccountId).toBe("account-carlos");
  });
});
