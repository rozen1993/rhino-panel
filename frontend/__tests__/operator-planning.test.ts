import { describe, expect, it } from "vitest";
import { canReplanActivity } from "@/lib/activity-permissions";
import { parseActivityStore } from "@/lib/activity-simulation";
import { roles } from "@/lib/roles";
import { normalizeRecordingModes, recordingModes, recordingModesError } from "@/lib/recording-modes";
import { destinationsFor } from "@/components/nav-bar";

const role = { ...roles.operario, accountId: "creator", canCreateOwnActivities: true };
const activity = { ...parseActivityStore(null)[0], status: "Programada" as const,
  createdByAccountId: "creator", createdByRoleId: "operario" as const, responsibleAccountId: "creator" };

describe("edición propia autorizada", () => {
  it("permite corregir la planificación propia programada", () => expect(canReplanActivity(activity, role)).toBe(true));
  it.each([
    { createdByRoleId: "admin" as const }, { createdByAccountId: "other" },
    { responsibleAccountId: "other" }, { status: "En proceso" as const },
    { status: "Entregada" as const }, { deletedAt: "2026-09-21T12:00:00Z" },
  ])("deniega la edición cuando cambia la autoridad: %j", patch => expect(canReplanActivity({ ...activity, ...patch }, role)).toBe(false));
  it("deniega después de revocar el permiso o exigir nueva clave", () => {
    expect(canReplanActivity(activity, { ...role, canCreateOwnActivities: false })).toBe(false);
    expect(canReplanActivity(activity, { ...role, mustChangePassword: true })).toBe(false);
  });
  it("permite Histórico incluso al operario sin creación, sin habilitar Cuentas ni Papelera", () => {
    const links = destinationsFor(roles.operario).map(link => link.href);
    expect(links).toContain("/historico");
    expect(links).not.toContain("/cuentas");
    expect(links).not.toContain("/papelera");
  });
});

describe("modalidades de Grabación", () => {
  it.each(Array.from({ length: 7 }, (_, index) => ({ modes: recordingModes.filter((_, bit) => (index + 1) & (1 << bit)) })))("acepta $modes", ({modes}) => {
    expect(recordingModesError("Grabación", modes)).toBeNull();
  });
  it.each([undefined, [], ["Video", "Video"], ["Desconocida"], [null], "Video"].map(modes => ({modes})))("rechaza una selección inválida: $modes", ({modes}) => {
    expect(recordingModesError("Grabación", modes)).not.toBeNull();
  });
  it("no acepta modalidades en otros tipos y normaliza el orden", () => {
    expect(recordingModesError("Edición", ["Video"])).not.toBeNull();
    expect(recordingModesError("Locución", [])).toBeNull();
    expect(normalizeRecordingModes(["Vuelo con dron", "Video"])).toEqual(["Video", "Vuelo con dron"]);
  });
});
