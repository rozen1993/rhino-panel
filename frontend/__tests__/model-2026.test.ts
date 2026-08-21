import { describe, expect, it } from "vitest";
import { defaultAccounts } from "@/lib/accounts";
import { createBursonActivity, createOwnActivity, advanceActivity, actorFromRole, readActivities } from "@/lib/activity-simulation";
import { activityTypes, roleIds, roles } from "@/lib/roles";
import { accountStoreKey, readAccounts, upsertAccount } from "@/lib/account-store";

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

const draft = {
  type: "Grabación" as const,
  title: "Cobertura de prueba",
  description: "Registro completo del encargo comunicado por teléfono.",
  spans: [{ start: "2026-08-20", end: "2026-08-20" }, { start: "2026-08-27", end: "2026-08-29" }],
  placeName: "Lima",
  materialLink: "",
  notes: "",
  referenceLink: "",
};

describe("modelo operativo 2026", () => {
  it("conserva exactamente tres roles y tres facultades diferenciadas", () => {
    expect(roleIds).toEqual(["operario", "admin", "burson"]);
    expect(roles.operario.createsOwnActivities).toBe(true);
    expect(roles.admin.seesAllActivities).toBe(true);
    expect(roles.burson.createsBursonRequests).toBe(true);
    expect(activityTypes).toHaveLength(4);
  });

  it("mantiene exactamente un operario activo vinculado a Burson", () => {
    expect(defaultAccounts.filter((account) => account.active && account.roleId === "operario" && account.bursonLinked)).toHaveLength(1);
  });

  it("transfiere atómicamente el vínculo Burson a otro operario", () => {
    const storage = new MemoryStorage();
    storage.setItem(accountStoreKey, JSON.stringify(defaultAccounts));
    const ana = defaultAccounts.find((account) => account.id === "account-ana")!;
    const result = upsertAccount(storage, { name: ana.name, username: ana.username, password: ana.password, roleId: "operario", bursonLinked: true }, "Marco Admin", ana.id);
    expect(result.ok).toBe(true);
    const accounts = readAccounts(storage);
    expect(accounts.filter((account) => account.active && account.bursonLinked)).toHaveLength(1);
    expect(accounts.find((account) => account.id === "account-ana")?.bursonLinked).toBe(true);
    expect(accounts.find((account) => account.id === "account-luis")?.bursonLinked).toBe(false);
  });

  it("crea una actividad propia programada con fechas discontinuas", () => {
    const storage = new MemoryStorage();
    const role = { ...roles.operario, accountId: "account-ana", accountName: "Ana Torres" };
    const result = createOwnActivity(storage, draft, role);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.activity.status).toBe("Programada");
      expect(result.activity.spans).toHaveLength(2);
      expect(result.activity.responsibleAccountId).toBe("account-ana");
    }
  });

  it("asigna automáticamente un encargo Burson al operario especial", () => {
    const activities = new MemoryStorage();
    const accounts = new MemoryStorage();
    const role = { ...roles.burson, accountId: "account-burson", accountName: "Equipo Burson" };
    const result = createBursonActivity(activities, accounts, draft, role);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.activity.origin).toBe("burson");
      expect(result.activity.responsibleAccountId).toBe("account-luis");
      expect(result.activity.status).toBe("Programada");
    }
  });

  it("solo entrega con un enlace válido de OneDrive", () => {
    const storage = new MemoryStorage();
    const role = { ...roles.operario, accountId: "account-ana", accountName: "Ana Torres" };
    const created = createOwnActivity(storage, draft, role);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const actor = actorFromRole(role);
    expect(advanceActivity(storage, created.activity.id, actor).ok).toBe(true);
    const delivery = advanceActivity(storage, created.activity.id, actor);
    expect(delivery.ok).toBe(false);
    expect(readActivities(storage).find((item) => item.id === created.activity.id)?.status).toBe("En proceso");
  });
});
