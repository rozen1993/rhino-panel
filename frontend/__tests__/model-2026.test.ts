import { describe, expect, it } from "vitest";
import { defaultAccounts } from "@/lib/accounts";
import {
  addThreadMessage,
  advanceActivity,
  actorFromRole,
  canEditActivity,
  createBursonActivity,
  createOwnActivity,
  editActivity,
  parseActivityStore,
  readActivities,
  reassignOpenBursonActivities,
} from "@/lib/activity-simulation";
import { activityTypes, roleIds, roles } from "@/lib/roles";
import {
  accountStoreKey,
  readAccounts,
  upsertAccount,
} from "@/lib/account-store";

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

const draft = {
  type: "Grabación" as const,
  title: "Cobertura de prueba",
  description: "Registro completo del encargo comunicado por teléfono.",
  spans: [
    { start: "2026-08-20", end: "2026-08-20" },
    { start: "2026-08-27", end: "2026-08-29" },
  ],
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
    expect(
      defaultAccounts.filter(
        (account) =>
          account.active &&
          account.roleId === "operario" &&
          account.bursonLinked,
      ),
    ).toHaveLength(1);
  });

  it("transfiere atómicamente el vínculo Burson a otro operario", () => {
    const storage = new MemoryStorage();
    storage.setItem(accountStoreKey, JSON.stringify(defaultAccounts));
    const ana = defaultAccounts.find(
      (account) => account.id === "account-ana",
    )!;
    const result = upsertAccount(
      storage,
      {
        name: ana.name,
        username: ana.username,
        password: ana.password,
        roleId: "operario",
        bursonLinked: true,
      },
      "Marco Admin",
      ana.id,
    );
    expect(result.ok).toBe(true);
    const accounts = readAccounts(storage);
    expect(
      accounts.filter((account) => account.active && account.bursonLinked),
    ).toHaveLength(1);
    expect(
      accounts.find((account) => account.id === "account-ana")?.bursonLinked,
    ).toBe(true);
    expect(
      accounts.find((account) => account.id === "account-luis")?.bursonLinked,
    ).toBe(false);
  });

  it("crea una actividad propia programada con fechas discontinuas", () => {
    const storage = new MemoryStorage();
    const role = {
      ...roles.operario,
      accountId: "account-ana",
      accountName: "Ana Torres",
    };
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
    const role = {
      ...roles.burson,
      accountId: "account-burson",
      accountName: "Equipo Burson",
    };
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
    const role = {
      ...roles.operario,
      accountId: "account-ana",
      accountName: "Ana Torres",
    };
    const created = createOwnActivity(storage, draft, role);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const actor = actorFromRole(role);
    expect(advanceActivity(storage, created.activity.id, actor).ok).toBe(true);
    const delivery = advanceActivity(storage, created.activity.id, actor);
    expect(delivery.ok).toBe(false);
    expect(
      readActivities(storage).find((item) => item.id === created.activity.id)
        ?.status,
    ).toBe("En proceso");
  });

  it("conserva enlace y opinión al crear, sin duplicar un reintento", () => {
    const storage = new MemoryStorage();
    const role = {
      ...roles.operario,
      accountId: "account-ana",
      accountName: "Ana Torres",
    };
    const complete = {
      ...draft,
      materialLink: "https://onedrive.live.com/prueba",
      notes: "Entrega revisada",
    };
    const first = createOwnActivity(storage, complete, role, "request-1");
    const retry = createOwnActivity(storage, complete, role, "request-1");
    expect(first.ok && first.activity.materialLink).toBe(complete.materialLink);
    expect(first.ok && first.activity.operatorOpinion).toBe(complete.notes);
    expect(retry.ok && first.ok && retry.activity.id).toBe(
      first.ok ? first.activity.id : "",
    );
    expect(
      readActivities(storage).filter(
        (item) => item.idempotencyKey === "request-1",
      ),
    ).toHaveLength(1);
  });

  it("bloquea solo la entrega después del primer mensaje Admin", () => {
    const storage = new MemoryStorage();
    const role = {
      ...roles.operario,
      accountId: "account-ana",
      accountName: "Ana Torres",
    };
    const created = createOwnActivity(
      storage,
      {
        ...draft,
        materialLink: "https://onedrive.live.com/original",
        notes: "Original",
      },
      role,
    );
    if (!created.ok) throw new Error(created.error);
    const operator = actorFromRole(role);
    advanceActivity(storage, created.activity.id, operator);
    const delivered = advanceActivity(storage, created.activity.id, operator);
    if (!delivered.ok) throw new Error(delivered.error);
    const admin = actorFromRole({
      ...roles.admin,
      accountId: "account-admin",
      accountName: "Marco Admin",
    });
    const opened = addThreadMessage(
      storage,
      created.activity.id,
      "Revisando la entrega",
      admin,
    );
    if (!opened.ok) throw new Error(opened.error);
    const edited = editActivity(
      storage,
      created.activity.id,
      {
        ...draft,
        title: "Título corregido",
        materialLink: "https://onedrive.live.com/cambiado",
        notes: "Cambiada",
      },
      operator,
      opened.activity.version,
    );
    expect(edited.ok).toBe(true);
    if (edited.ok) {
      expect(edited.activity.title).toBe("Título corregido");
      expect(edited.activity.materialLink).toBe(
        "https://onedrive.live.com/original",
      );
      expect(edited.activity.operatorOpinion).toBe("Original");
    }
  });

  it("impide que otro operario edite una actividad ajena", () => {
    const item = readActivities(new MemoryStorage())[0];
    expect(
      canEditActivity(item, {
        ...roles.operario,
        accountId: "account-carlos",
        accountName: "Carlos Vega",
      }),
    ).toBe(false);
  });

  it("no permite eliminar la última cuenta Admin", () => {
    const storage = new MemoryStorage();
    storage.setItem(accountStoreKey, JSON.stringify(defaultAccounts));
    const admin = defaultAccounts.find(
      (account) => account.roleId === "admin",
    )!;
    const result = upsertAccount(
      storage,
      {
        name: admin.name,
        username: admin.username,
        password: admin.password,
        roleId: "operario",
        bursonLinked: false,
      },
      "Marco Admin",
      admin.id,
    );
    expect(result.ok).toBe(false);
  });

  it("reasigna los encargos Burson pendientes al transferir el vínculo", () => {
    const storage = new MemoryStorage();
    const admin = actorFromRole({
      ...roles.admin,
      accountId: "account-admin",
      accountName: "Marco Admin",
    });
    reassignOpenBursonActivities(
      storage,
      "account-luis",
      "account-ana",
      "Ana Torres",
      admin,
    );
    const pending = readActivities(storage).find(
      (item) => item.id === "locucion-burson",
    );
    expect(pending?.responsibleAccountId).toBe("account-ana");
  });

  it("descarta un almacén corrupto en vez de confiar en su forma", () => {
    expect(
      parseActivityStore('[{"id":"incompleto"}]').some(
        (item) => item.id === "incompleto",
      ),
    ).toBe(false);
  });
});
