import { describe, expect, it } from "vitest";
import {
  activityYears,
  touchesMonth,
} from "@/components/activity-dashboard";
import { defaultAccounts } from "@/lib/accounts";
import {
  addThreadMessage,
  advanceActivity,
  actorFromRole,
  canEditActivity,
  canViewActivity,
  createBursonActivity,
  createOwnActivity,
  deleteThreadMessage,
  editThreadMessage,
  parseActivityStore,
  planActivity,
  readActivities,
  reassignOpenBursonActivities,
  replanActivity,
  softDeleteActivity,
  updateExecutionActivity,
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
  responsibleAccountId: "account-ana",
  materialLink: "",
  notes: "",
  referenceLink: "",
};

const adminRole = {
  ...roles.admin,
  accountId: "account-admin",
  accountName: "Marco Admin",
};
const authorizedOperator = {
  ...roles.operario,
  accountId: "account-ana",
  accountName: "Ana Torres",
  canCreateOwnActivities: true,
};
const regularOperator = {
  ...roles.operario,
  accountId: "account-carlos",
  accountName: "Carlos Vega",
};

describe("modelo operativo vigente desde el 2026-08-28", () => {
  it("conserva los roles internos y añade el acceso Aunor aprobado", () => {
    expect(roleIds).toEqual(["operario", "admin", "burson", "aunor"]);
    expect(roles.aunor.administers).toBe(false);
    expect(roles.aunor.canCreateOwnActivities).toBe(false);
    expect(roles.operario.canCreateOwnActivities).toBe(false);
    expect(roles.admin.administers).toBe(true);
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

  it("transfiere atómicamente el vínculo Burson sin confundirlo con el permiso de crear", () => {
    const storage = new MemoryStorage();
    storage.setItem(accountStoreKey, JSON.stringify(defaultAccounts));
    const ana = defaultAccounts.find((account) => account.id === "account-ana")!;
    const result = upsertAccount(
      storage,
      {
        name: ana.name,
        username: ana.username,
        password: ana.password,
        roleId: "operario",
        bursonLinked: true,
        canCreateOwnActivities: ana.canCreateOwnActivities,
      },
      "Marco Admin",
      ana.id,
    );
    expect(result.ok).toBe(true);
    const accounts = readAccounts(storage);
    expect(accounts.filter((account) => account.active && account.bursonLinked)).toHaveLength(1);
    expect(accounts.find((account) => account.id === "account-ana")).toMatchObject({
      bursonLinked: true,
      canCreateOwnActivities: true,
    });
    expect(accounts.find((account) => account.id === "account-luis")?.bursonLinked).toBe(false);
  });

  it("rechaza al Operario general y permite al autorizado crear solo para sí mismo", () => {
    const storage = new MemoryStorage();
    expect(createOwnActivity(storage, draft, regularOperator).ok).toBe(false);
    const result = createOwnActivity(
      storage,
      { ...draft, responsibleAccountId: "account-carlos" },
      authorizedOperator,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.activity.responsibleAccountId).toBe("account-ana");
      expect(result.activity.createdByRoleId).toBe("operario");
    }
  });

  it("aísla la idempotencia por autor y rechaza reutilizar la clave con otro payload", () => {
    const storage = new MemoryStorage();
    const key = "00000000-0000-4000-8000-000000000001";
    const first = createOwnActivity(storage, draft, authorizedOperator, key);
    if (!first.ok) throw new Error(first.error);

    const replay = createOwnActivity(storage, draft, authorizedOperator, key);
    expect(replay.ok && "replayed" in replay && replay.replayed).toBe(true);
    expect(replay.ok && replay.activity.id).toBe(first.activity.id);

    const conflict = createOwnActivity(
      storage,
      { ...draft, title: "Otro payload" },
      authorizedOperator,
      key,
    );
    expect(conflict.ok).toBe(false);
    if (!conflict.ok) expect(conflict.error).toContain("SR006");

    const authorizedCarlos = {
      ...regularOperator,
      canCreateOwnActivities: true,
    };
    const otherActor = createOwnActivity(
      storage,
      { ...draft, title: "Solicitud de Carlos" },
      authorizedCarlos,
      key,
    );
    expect(otherActor.ok).toBe(true);
    if (otherActor.ok)
      expect(otherActor.activity.createdByAccountId).toBe("account-carlos");
  });

  it("rechaza el replay de Admin si la actividad ya fue reasignada", () => {
    const storage = new MemoryStorage();
    const key = "00000000-0000-4000-8000-000000000002";
    const first = planActivity(
      storage,
      new MemoryStorage(),
      draft,
      adminRole,
      key,
    );
    if (!first.ok) throw new Error(first.error);
    const reassigned = replanActivity(
      storage,
      new MemoryStorage(),
      first.activity.id,
      { ...draft, responsibleAccountId: "account-carlos" },
      actorFromRole(adminRole),
      first.activity.version,
    );
    if (!reassigned.ok) throw new Error(reassigned.error);

    const replay = planActivity(
      storage,
      new MemoryStorage(),
      draft,
      adminRole,
      key,
    );
    expect(replay.ok).toBe(false);
    if (!replay.ok) expect(replay.error).toContain("SR006");
  });

  it("el vínculo Burson no concede acceso a encargos de otro responsable", () => {
    const bursonActivity = readActivities(new MemoryStorage()).find(
      (item) => item.origin === "burson",
    )!;
    expect(
      canViewActivity(bursonActivity, {
        ...authorizedOperator,
        bursonLinked: true,
      }),
    ).toBe(false);
    expect(
      canViewActivity(bursonActivity, {
        ...regularOperator,
        accountId: "account-luis",
        bursonLinked: true,
      }),
    ).toBe(true);
  });

  it("permite a Admin planificar y asignar sin escribir campos de ejecución", () => {
    const storage = new MemoryStorage();
    const result = planActivity(
      storage,
      new MemoryStorage(),
      {
        ...draft,
        responsibleAccountId: "account-carlos",
        materialLink: "https://onedrive.live.com/no-debe-entrar",
        notes: "No debe entrar",
      },
      adminRole,
      "request-admin-1",
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.activity.responsibleAccountId).toBe("account-carlos");
      expect(result.activity.createdByRoleId).toBe("admin");
      expect(result.activity.materialLink).toBe("");
      expect(result.activity.operatorOpinion).toBe("");
    }
  });

  it("asigna automáticamente un encargo Burson al operario especial", () => {
    const result = createBursonActivity(
      new MemoryStorage(),
      new MemoryStorage(),
      draft,
      {
        ...roles.burson,
        accountId: "account-burson",
        accountName: "Equipo Burson",
      },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.activity.origin).toBe("burson");
      expect(result.activity.responsibleAccountId).toBe("account-luis");
    }
  });

  it("repite el mismo encargo Burson después de transferir al responsable", () => {
    const storage = new MemoryStorage();
    const key = "00000000-0000-4000-8000-000000000003";
    const bursonRole = {
      ...roles.burson,
      accountId: "account-burson",
      accountName: "Equipo Burson",
    };
    const first = createBursonActivity(
      storage,
      new MemoryStorage(),
      { ...draft, referenceLink: "https://burson.example/referencia" },
      bursonRole,
      key,
    );
    if (!first.ok) throw new Error(first.error);
    reassignOpenBursonActivities(
      storage,
      "account-luis",
      "account-ana",
      "Ana Torres",
      actorFromRole(adminRole),
    );

    const replay = createBursonActivity(
      storage,
      new MemoryStorage(),
      { ...draft, referenceLink: "https://burson.example/referencia" },
      bursonRole,
      key,
    );
    expect(replay.ok && replay.replayed).toBe(true);
    if (replay.ok) {
      expect(replay.activity.id).toBe(first.activity.id);
      expect(replay.activity.responsibleAccountId).toBe("account-ana");
    }
  });

  it("separa planificación, ejecución y transición de estado", () => {
    const storage = new MemoryStorage();
    const planned = planActivity(
      storage,
      new MemoryStorage(),
      draft,
      adminRole,
    );
    if (!planned.ok) throw new Error(planned.error);
    const operator = actorFromRole(authorizedOperator);
    expect(advanceActivity(storage, planned.activity.id, operator).ok).toBe(true);
    expect(advanceActivity(storage, planned.activity.id, operator).ok).toBe(false);
    const current = readActivities(storage).find(
      (item) => item.id === planned.activity.id,
    )!;
    const execution = updateExecutionActivity(
      storage,
      current.id,
      {
        materialLink: "https://onedrive.live.com/material de entrega",
        notes: "Trabajo concluido",
      },
      operator,
      current.version,
    );
    if (!execution.ok) throw new Error(execution.error);
    expect(execution.activity.materialLink).toBe(
      "https://onedrive.live.com/material%20de%20entrega",
    );
    const delivery = advanceActivity(
      storage,
      execution.activity.id,
      operator,
      execution.activity.version,
    );
    expect(delivery.ok && delivery.activity.status).toBe("Entregada");
  });

  it("impide vaciar el enlace de una actividad ya entregada", () => {
    const storage = new MemoryStorage();
    const planned = planActivity(
      storage,
      new MemoryStorage(),
      draft,
      adminRole,
    );
    if (!planned.ok) throw new Error(planned.error);
    const operator = actorFromRole(authorizedOperator);
    const execution = updateExecutionActivity(
      storage,
      planned.activity.id,
      {
        materialLink: "https://onedrive.live.com/entrega-conservada",
        notes: "Lista",
      },
      operator,
      planned.activity.version,
    );
    if (!execution.ok) throw new Error(execution.error);
    const started = advanceActivity(
      storage,
      execution.activity.id,
      operator,
      execution.activity.version,
    );
    if (!started.ok) throw new Error(started.error);
    const delivered = advanceActivity(
      storage,
      started.activity.id,
      operator,
      started.activity.version,
    );
    if (!delivered.ok) throw new Error(delivered.error);

    const cleared = updateExecutionActivity(
      storage,
      delivered.activity.id,
      { materialLink: "", notes: "Lista" },
      operator,
      delivered.activity.version,
    );
    expect(cleared.ok).toBe(false);
    expect(
      readActivities(storage).find(
        (item) => item.id === delivered.activity.id,
      )?.materialLink,
    ).toBe("https://onedrive.live.com/entrega-conservada");
  });

  it("bloquea solo enlace y opinión tras el primer mensaje de Admin", () => {
    const storage = new MemoryStorage();
    const planned = planActivity(
      storage,
      new MemoryStorage(),
      draft,
      adminRole,
    );
    if (!planned.ok) throw new Error(planned.error);
    const operator = actorFromRole(authorizedOperator);
    const execution = updateExecutionActivity(
      storage,
      planned.activity.id,
      {
        materialLink: "https://onedrive.live.com/original",
        notes: "Original",
      },
      operator,
      planned.activity.version,
    );
    if (!execution.ok) throw new Error(execution.error);
    const started = advanceActivity(
      storage,
      execution.activity.id,
      operator,
      execution.activity.version,
    );
    if (!started.ok) throw new Error(started.error);
    const delivered = advanceActivity(
      storage,
      started.activity.id,
      operator,
      started.activity.version,
    );
    if (!delivered.ok) throw new Error(delivered.error);
    const opened = addThreadMessage(
      storage,
      delivered.activity.id,
      "Revisando la entrega",
      actorFromRole(adminRole),
      delivered.activity.version,
    );
    if (!opened.ok) throw new Error(opened.error);

    expect(
      updateExecutionActivity(
        storage,
        opened.activity.id,
        {
          materialLink: "https://onedrive.live.com/cambiado",
          notes: "Cambiada",
        },
        operator,
        opened.activity.version,
      ).ok,
    ).toBe(false);
    const replanned = replanActivity(
      storage,
      new MemoryStorage(),
      opened.activity.id,
      { ...draft, title: "Título corregido" },
      actorFromRole(adminRole),
      opened.activity.version,
    );
    expect(replanned.ok && replanned.activity.title).toBe("Título corregido");
  });

  it("mantiene permisos, versiones y baja lógica del hilo privado", () => {
    const storage = new MemoryStorage();
    const accounts = new MemoryStorage();
    const planned = planActivity(storage, accounts, draft, adminRole);
    if (!planned.ok) throw new Error(planned.error);
    const admin = actorFromRole(adminRole);
    const operator = actorFromRole(authorizedOperator);
    const outsider = actorFromRole(regularOperator);
    const execution = updateExecutionActivity(
      storage,
      planned.activity.id,
      {
        materialLink: "https://onedrive.live.com/hilo-privado",
        notes: "Entrega para conversar",
      },
      operator,
      planned.activity.version,
    );
    if (!execution.ok) throw new Error(execution.error);
    const started = advanceActivity(
      storage,
      execution.activity.id,
      operator,
      execution.activity.version,
    );
    if (!started.ok) throw new Error(started.error);
    const delivered = advanceActivity(
      storage,
      started.activity.id,
      operator,
      started.activity.version,
    );
    if (!delivered.ok) throw new Error(delivered.error);

    expect(
      addThreadMessage(
        storage,
        delivered.activity.id,
        "Intento del responsable",
        operator,
        delivered.activity.version,
      ).ok,
    ).toBe(false);
    expect(
      addThreadMessage(
        storage,
        delivered.activity.id,
        "Intento ajeno",
        outsider,
        null,
      ).ok,
    ).toBe(false);

    const opened = addThreadMessage(
      storage,
      delivered.activity.id,
      "Admin abre el hilo",
      admin,
      delivered.activity.version,
    );
    if (!opened.ok) throw new Error(opened.error);
    expect(opened.activity.version).toBe(delivered.activity.version + 1);
    expect(opened.activity.thread[0]).toMatchObject({
      version: 1,
      opensThread: true,
    });

    const replied = addThreadMessage(
      storage,
      opened.activity.id,
      "Respuesta de la responsable",
      operator,
      null,
    );
    if (!replied.ok) throw new Error(replied.error);
    expect(replied.activity.version).toBe(opened.activity.version);
    expect(replied.activity.updatedAt).toBe(opened.activity.updatedAt);
    expect(replied.activity.thread[1].id).not.toBe(
      replied.activity.thread[0].id,
    );

    const operatorMessage = replied.activity.thread[1];
    expect(
      editThreadMessage(
        storage,
        replied.activity.id,
        operatorMessage.id,
        "Edición ajena",
        admin,
        operatorMessage.version,
      ).ok,
    ).toBe(false);
    const edited = editThreadMessage(
      storage,
      replied.activity.id,
      operatorMessage.id,
      "Respuesta corregida",
      operator,
      operatorMessage.version,
    );
    if (!edited.ok) throw new Error(edited.error);
    expect(edited.activity.version).toBe(replied.activity.version);
    expect(edited.activity.thread[1].version).toBe(2);

    const removed = deleteThreadMessage(
      storage,
      edited.activity.id,
      edited.activity.thread[0].id,
      admin,
      edited.activity.thread[0].version,
    );
    if (!removed.ok) throw new Error(removed.error);
    expect(removed.activity.threadOpenedAt).toBe(opened.activity.threadOpenedAt);
    expect(removed.activity.thread[0].text).toBe("Admin abre el hilo");
    expect(removed.activity.thread[0].deletedAt).toBeTruthy();
    expect(removed.activity.version).toBe(edited.activity.version);
    expect(removed.activity.audit[0]).toMatchObject({
      action: "Mensaje eliminado",
      detail: `Mensaje ${edited.activity.thread[0].id}`,
    });
  });

  it("transfiere el acceso al hilo cuando Admin reasigna", () => {
    const storage = new MemoryStorage();
    const accounts = new MemoryStorage();
    const planned = planActivity(storage, accounts, draft, adminRole);
    if (!planned.ok) throw new Error(planned.error);
    const admin = actorFromRole(adminRole);
    const operator = actorFromRole(authorizedOperator);
    const execution = updateExecutionActivity(
      storage,
      planned.activity.id,
      {
        materialLink: "https://onedrive.live.com/reasignacion-hilo",
        notes: "Lista",
      },
      operator,
      planned.activity.version,
    );
    if (!execution.ok) throw new Error(execution.error);
    const started = advanceActivity(
      storage,
      execution.activity.id,
      operator,
      execution.activity.version,
    );
    if (!started.ok) throw new Error(started.error);
    const delivered = advanceActivity(
      storage,
      started.activity.id,
      operator,
      started.activity.version,
    );
    if (!delivered.ok) throw new Error(delivered.error);
    const opened = addThreadMessage(
      storage,
      delivered.activity.id,
      "Inicio antes de reasignar",
      admin,
      delivered.activity.version,
    );
    if (!opened.ok) throw new Error(opened.error);
    const oldReply = addThreadMessage(
      storage,
      opened.activity.id,
      "Respuesta original",
      operator,
      null,
    );
    if (!oldReply.ok) throw new Error(oldReply.error);

    const reassigned = replanActivity(
      storage,
      accounts,
      oldReply.activity.id,
      { ...draft, responsibleAccountId: "account-carlos" },
      admin,
      oldReply.activity.version,
    );
    if (!reassigned.ok) throw new Error(reassigned.error);
    const oldMessage = reassigned.activity.thread[1];
    expect(
      editThreadMessage(
        storage,
        reassigned.activity.id,
        oldMessage.id,
        "Ya no debe poder",
        operator,
        oldMessage.version,
      ).ok,
    ).toBe(false);
    const newResponsible = actorFromRole(regularOperator);
    expect(
      addThreadMessage(
        storage,
        reassigned.activity.id,
        "Asumo el hilo",
        newResponsible,
        null,
      ).ok,
    ).toBe(true);
  });

  it("impide que otro Operario o Burson editen una actividad ajena", () => {
    const item = readActivities(new MemoryStorage())[0];
    expect(canEditActivity(item, regularOperator)).toBe(false);
    expect(
      canEditActivity(item, {
        ...roles.burson,
        accountId: "account-burson",
        accountName: "Equipo Burson",
      }),
    ).toBe(false);
    expect(canEditActivity(item, adminRole)).toBe(true);
  });

  it("reserva la baja lógica exclusivamente para Admin", () => {
    const storage = new MemoryStorage();
    const item = readActivities(storage)[0];
    expect(
      softDeleteActivity(
        storage,
        item.id,
        "Solicitud de baja",
        actorFromRole(authorizedOperator),
        item.version,
      ).ok,
    ).toBe(false);
    expect(
      softDeleteActivity(
        storage,
        item.id,
        "Solicitud de baja",
        actorFromRole(adminRole),
        item.version,
      ).ok,
    ).toBe(true);
  });

  it("no permite eliminar la última cuenta Admin", () => {
    const storage = new MemoryStorage();
    storage.setItem(accountStoreKey, JSON.stringify(defaultAccounts));
    const admin = defaultAccounts.find((account) => account.roleId === "admin")!;
    const result = upsertAccount(
      storage,
      {
        name: admin.name,
        username: admin.username,
        password: admin.password,
        roleId: "operario",
        bursonLinked: false,
        canCreateOwnActivities: false,
      },
      "Marco Admin",
      admin.id,
    );
    expect(result.ok).toBe(false);
  });

  it("reasigna los encargos Burson pendientes al transferir el vínculo", () => {
    const storage = new MemoryStorage();
    reassignOpenBursonActivities(
      storage,
      "account-luis",
      "account-ana",
      "Ana Torres",
      actorFromRole(adminRole),
    );
    expect(
      readActivities(storage).find((item) => item.id === "locucion-burson")
        ?.responsibleAccountId,
    ).toBe("account-ana");
  });

  it("permite navegar actividades futuras sin fijar el panel a 2026", () => {
    const future = {
      ...readActivities(new MemoryStorage())[0],
      spans: [{ start: "2028-03-02", end: "2028-03-04" }],
    };
    expect(activityYears([future], 2026)).toEqual([2026, 2028]);
    expect(touchesMonth(future, 2, 2028)).toBe(true);
    expect(touchesMonth(future, 2, 2026)).toBe(false);
  });

  it("descarta un almacén corrupto en vez de confiar en su forma", () => {
    expect(
      parseActivityStore('[{"id":"incompleto"}]').some(
        (item) => item.id === "incompleto",
      ),
    ).toBe(false);
  });
});
