import { describe, expect, it } from "vitest";
import {
  actorFromRole,
  addInternalComment,
  advanceActivity,
  approveActivity,
  cancelActivity,
  deleteInternalComment,
  observeActivity,
  readActivities,
  rejectActivity,
  softDeleteActivity,
  updateDelivery,
  upsertActivity,
} from "@/lib/activity-simulation";
import type { ActivityDraftFields } from "@/lib/activity-draft";
import { activityTypes, roles } from "@/lib/roles";

const fields: ActivityDraftFields = {
  date: "2026-08-20T10:00",
  type: activityTypes[0],
  title: "Nueva cobertura",
  responsible: "Grabacion",
  responsibleAccountId: "test-grabacion",
  status: "Programada",
  progress: "0%",
  placeName: "Peaje",
  placeReference: "",
  placeKm: "",
  placeDirection: "",
  placeLatitude: "",
  placeLongitude: "",
  description: "Prueba",
  deliveryDate: "",
  materialLink: "",
  notes: "",
};
const coordinator = actorFromRole(roles.coordinacion);
const worker = actorFromRole(roles.grabacion);
const supervisor = actorFromRole(roles.supervision);

describe("dominio de actividades", () => {
  it("deduplica una creacion reintentada con la misma llave", () => {
    const first = upsertActivity(
      localStorage,
      fields,
      roles.coordinacion,
      undefined,
      "same-key",
    );
    const second = upsertActivity(
      localStorage,
      fields,
      roles.coordinacion,
      undefined,
      "same-key",
    );
    expect(second.id).toBe(first.id);
    expect(
      readActivities(localStorage).filter((item) => item.id === first.id),
    ).toHaveLength(1);
  });
  it("aísla la orden por cuenta responsable", () => {
    const created = upsertActivity(localStorage, fields, roles.coordinacion);
    const other = { ...worker, accountId: "otra-cuenta", name: "Otra" };
    expect(advanceActivity(localStorage, created.id, other)).toMatchObject({
      ok: false,
    });
    expect(advanceActivity(localStorage, created.id, worker)).toMatchObject({
      ok: true,
      activity: { status: "En proceso" },
    });
  });
  it("no entrega sin enlace y revalida al aprobar", () => {
    const created = upsertActivity(
      localStorage,
      { ...fields, status: "Por subir" },
      roles.coordinacion,
    );
    expect(advanceActivity(localStorage, created.id, worker)).toMatchObject({
      ok: false,
    });
    const updated = updateDelivery(
      localStorage,
      created.id,
      {
        materialLink: "https://onedrive.live.com/abc",
        progress: "0%",
        notes: "Listo",
      },
      worker,
      created.version,
    );
    if (!updated.ok) throw new Error(updated.error);
    const delivered = advanceActivity(localStorage, created.id, worker);
    expect(delivered).toMatchObject({
      ok: true,
      activity: { status: "Entregada" },
    });
    if (!delivered.ok) return;
    expect(
      approveActivity(
        localStorage,
        created.id,
        supervisor,
        delivered.activity.version,
      ),
    ).toMatchObject({ ok: true });
  });
  it("exige avance 100 para Edicion y Creatividad", () => {
    const created = upsertActivity(
      localStorage,
      {
        ...fields,
        type: activityTypes[1],
        responsible: "Edicion",
        responsibleAccountId: "test-edicion",
        status: "Por subir",
        materialLink: "https://onedrive.live.com/abc",
        progress: "75%",
      },
      roles.coordinacion,
    );
    expect(
      advanceActivity(localStorage, created.id, actorFromRole(roles.edicion)),
    ).toMatchObject({ ok: false });
  });
  it("detecta decisiones sobre una version obsoleta", () => {
    const created = upsertActivity(
      localStorage,
      {
        ...fields,
        status: "Entregada",
        materialLink: "https://onedrive.live.com/v1",
      },
      roles.coordinacion,
    );
    const changed = updateDelivery(
      localStorage,
      created.id,
      {
        materialLink: "https://onedrive.live.com/v2",
        progress: "0%",
        notes: "Nueva version",
      },
      worker,
      created.version,
    );
    expect(changed.ok).toBe(true);
    expect(
      observeActivity(
        localStorage,
        created.id,
        "Revisar",
        supervisor,
        created.version,
      ),
    ).toMatchObject({ ok: false });
  });
  it("observa o rechaza y permite ciclos de reenvio", () => {
    const observedBase = upsertActivity(
      localStorage,
      {
        ...fields,
        status: "Entregada",
        materialLink: "https://onedrive.live.com/v1",
      },
      roles.coordinacion,
    );
    const observed = observeActivity(
      localStorage,
      observedBase.id,
      "Corrige audio",
      supervisor,
      observedBase.version,
    );
    expect(observed).toMatchObject({
      ok: true,
      activity: { status: "Observada" },
    });
    if (!observed.ok) throw new Error(observed.error);
    const resubmitted = advanceActivity(
      localStorage,
      observedBase.id,
      worker,
      observed.activity.version,
    );
    expect(resubmitted).toMatchObject({
      ok: true,
      activity: { status: "Entregada" },
    });
    if (!resubmitted.ok) throw new Error(resubmitted.error);
    expect(
      approveActivity(
        localStorage,
        observedBase.id,
        supervisor,
        resubmitted.activity.version,
      ),
    ).toMatchObject({ ok: true, activity: { status: "Aprobada" } });
    const rejectedBase = upsertActivity(
      localStorage,
      {
        ...fields,
        title: "Rechazo",
        status: "Entregada",
        materialLink: "https://onedrive.live.com/v1",
      },
      roles.coordinacion,
    );
    const rejected = rejectActivity(
      localStorage,
      rejectedBase.id,
      "Material inutilizable",
      false,
      supervisor,
      rejectedBase.version,
    );
    expect(rejected).toMatchObject({
      ok: true,
      activity: { status: "Rechazada" },
    });
    expect(
      advanceActivity(localStorage, rejectedBase.id, worker),
    ).toMatchObject({ ok: false });
  });
  it("aplica permisos en el dominio aunque se invoquen acciones directamente", () => {
    const created = upsertActivity(
      localStorage,
      {
        ...fields,
        status: "Entregada",
        materialLink: "https://onedrive.live.com/v1",
      },
      roles.coordinacion,
    );
    expect(
      observeActivity(localStorage, created.id, "No autorizado", worker),
    ).toMatchObject({ ok: false });
    expect(
      rejectActivity(localStorage, created.id, "No autorizado", true, coordinator),
    ).toMatchObject({ ok: false });
    expect(approveActivity(localStorage, created.id, worker)).toMatchObject({
      ok: false,
    });
    expect(() => upsertActivity(localStorage, fields, roles.grabacion)).toThrow(
      /Coordinación/,
    );
  });
  it("Coordinacion no altera el reporte operativo al editar datos administrativos", () => {
    const created = upsertActivity(
      localStorage,
      {
        ...fields,
        status: "Entregada",
        progress: "100%",
        materialLink: "https://onedrive.live.com/original",
        notes: "Mensaje del operario",
      },
      roles.coordinacion,
    );
    const edited = upsertActivity(
      localStorage,
      {
        ...fields,
        title: "Título administrativo actualizado",
        status: "Programada",
        progress: "0%",
        materialLink: "https://onedrive.live.com/sobrescrito",
        notes: "Mensaje sobrescrito",
      },
      roles.coordinacion,
      created.id,
    );
    expect(edited).toMatchObject({
      title: "Título administrativo actualizado",
      status: "Entregada",
      progress: 100,
      materialLink: "https://onedrive.live.com/original",
      deliveryMessage: "Mensaje del operario",
    });
  });
  it("solo Coordinacion cancela y elimina logicamente antes de iniciar", () => {
    const created = upsertActivity(localStorage, fields, roles.coordinacion);
    expect(
      cancelActivity(localStorage, created.id, "Motivo", supervisor),
    ).toMatchObject({ ok: false });
    expect(
      cancelActivity(localStorage, created.id, "Cambio de plan", coordinator),
    ).toMatchObject({ ok: true });
    const removable = upsertActivity(
      localStorage,
      { ...fields, title: "Retirable" },
      roles.coordinacion,
    );
    expect(
      softDeleteActivity(
        localStorage,
        removable.id,
        "Orden duplicada",
        coordinator,
      ),
    ).toMatchObject({ ok: true });
  });
  it("solo el autor elimina su comentario", () => {
    const created = upsertActivity(localStorage, fields, roles.coordinacion);
    const added = addInternalComment(
      localStorage,
      created.id,
      "Coordinar horario",
      coordinator,
    );
    if (!added.ok) throw new Error(added.error);
    const id = added.activity.comments[0].id;
    expect(
      deleteInternalComment(localStorage, created.id, id, worker),
    ).toMatchObject({ ok: false });
    expect(
      deleteInternalComment(localStorage, created.id, id, coordinator),
    ).toMatchObject({ ok: true });
  });
});
