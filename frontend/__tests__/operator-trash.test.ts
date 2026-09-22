import { describe, expect, it } from "vitest";
import { canDeleteOwnActivity } from "@/lib/activity-permissions";
import { accountStoreKey } from "@/lib/account-store";
import { defaultAccounts } from "@/lib/accounts";
import { activityStoreKey, actorFromRole, listTrashedActivities, parseActivityStore, readActivities, restoreActivity, softDeleteOwnActivity, type SimulatedActivity } from "@/lib/activity-simulation";
import { roles, type Role } from "@/lib/roles";

const role = { ...roles.operario, accountId: "account-ana", accountName: "Ana Torres", canCreateOwnActivities: true };
const item: SimulatedActivity = { ...parseActivityStore(null)[0], status: "Programada", deliveredAt: undefined,
  createdByAccountId: role.accountId, createdByRoleId: "operario", responsibleAccountId: role.accountId,
  recordingModes: ["Fotografía", "Video"], materialLink: "https://example.invalid/material", operatorOpinion: "Material previo" };
function fixture(patch: Partial<SimulatedActivity> = {}) {
  const values = new Map([[activityStoreKey, JSON.stringify([{ ...item, ...patch }])]]);
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
}

describe("Papelera propia sin ampliar permisos", () => {
  it.each([
    { createdByRoleId: "admin" }, { createdByAccountId: "otro" }, { responsibleAccountId: "otro" },
    { status: "En proceso" }, { status: "Entregada" }, { deletedAt: "2026-09-22T10:00:00Z" },
  ] as Partial<SimulatedActivity>[])('rechaza %j sin modificar datos', patch => {
    const storage = fixture(patch), before = storage.getItem(activityStoreKey);
    expect(canDeleteOwnActivity({ ...item, ...patch }, role)).toBe(false);
    expect(softDeleteOwnActivity(storage, item.id, "Creada por error", role, item.version).ok).toBe(false);
    expect(storage.getItem(activityStoreKey)).toBe(before);
  });
  it.each([roles.admin, roles.aunor, roles.burson, { ...role, mustChangePassword: true }] as Role[])('no concede el flujo propio a $id con clave pendiente $mustChangePassword', candidate => {
    expect(canDeleteOwnActivity(item, candidate)).toBe(false);
    expect(softDeleteOwnActivity(fixture(), item.id, "Creada por error", candidate, item.version).ok).toBe(false);
  });
  it.each([{ canCreateOwnActivities: false }, { active: false, canCreateOwnActivities: false }, { mustChangePassword: true }, { roleId: "admin", canCreateOwnActivities: false }])('revalida la cuenta viva, incluso con rol cliente obsoleto: %j', patch => {
    const storage = fixture();
    storage.setItem(accountStoreKey, JSON.stringify(defaultAccounts.map(account => account.id === role.accountId ? { ...account, ...patch } : account)));
    expect(softDeleteOwnActivity(storage, item.id, "Creada por error", role, item.version).ok).toBe(false);
    expect(readActivities(storage)[0].deletedAt).toBeUndefined();
  });
  it("rechaza razón inválida, versión vieja y doble envío", () => {
    const storage = fixture();
    for (const reason of ["", "x", " ", "x".repeat(1001)]) expect(softDeleteOwnActivity(storage, item.id, reason, role, item.version).ok).toBe(false);
    expect(softDeleteOwnActivity(storage, item.id, "Error", role, item.version + 1).ok).toBe(false);
    expect(softDeleteOwnActivity(storage, item.id, "Error", role, item.version).ok).toBe(true);
    expect(softDeleteOwnActivity(storage, item.id, "Error", role, item.version).ok).toBe(false);
  });
  it("conserva todos los contenidos y solo Admin puede consultar/restaurar", () => {
    const storage = fixture();
    const deleted = softDeleteOwnActivity(storage, item.id, "  Creada por error  ", role, item.version);
    if (!deleted.ok) throw Error(deleted.error);
    expect(deleted.activity).toMatchObject({ version: item.version + 1, deletionReason: "Creada por error", deletedBy: { accountId: role.accountId, roleId: "operario" } });
    for (const key of ["title", "description", "spans", "materialLink", "operatorOpinion", "thread", "recordingModes", "createdByAccountId"] as const)
      expect(deleted.activity[key]).toEqual(item[key]);
    expect(deleted.activity.audit).toHaveLength(item.audit.length + 1);
    expect(deleted.activity.audit[0]).toMatchObject({ action: "Actividad propia enviada a Papelera", detail: "Creada por error" });
    expect(listTrashedActivities(storage, role)).toHaveLength(0);
    expect(listTrashedActivities(storage, roles.admin)).toHaveLength(1);
    expect(restoreActivity(storage, storage, item.id, actorFromRole(role), deleted.activity.version).ok).toBe(false);
    const restored = restoreActivity(storage, storage, item.id, actorFromRole(roles.admin), deleted.activity.version);
    if (!restored.ok) throw Error(restored.error);
    expect(restored.activity.deletedAt).toBeUndefined();
    expect(restored.activity.materialLink).toBe(item.materialLink);
    expect(restored.activity.audit).toHaveLength(item.audit.length + 2);
  });
});
