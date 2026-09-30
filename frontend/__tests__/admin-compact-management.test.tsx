import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createAunorExamples } from "@/lib/aunor-examples";
import { parseActivityStore } from "@/lib/activity-simulation";
import { roles } from "@/lib/roles";
import {
  previewContractRelation,
  validAdminActivityInput,
} from "@/lib/admin-activity-management";
const mocks = vi.hoisted(() => ({ read: vi.fn(), save: vi.fn() }));
vi.mock("@/app/aunor/actions", () => ({
  getAunorWorkspaceAction: mocks.read,
  performAunorAction: vi.fn(),
}));
vi.mock("@/app/aunor/admin-management-actions", () => ({
  saveAdminActivityAction: mocks.save,
}));
import { AdminAunorPanel } from "@/components/admin-aunor-panel";
const workspace = () => {
  const w = createAunorExamples();
  w.contractPeriods = [
    {
      id: "00000000-0000-4000-8000-000000000099",
      service_id: "cobertura",
      cadence: "monthly",
      starts_on: "2026-04-01",
      ends_on: "2026-04-30",
      target: 10,
      version: 1,
    },
  ];
  return w;
};
beforeEach(() => {
  mocks.read.mockResolvedValue({ ok: true, data: workspace() });
  mocks.save.mockResolvedValue({ ok: true, activity: null });
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it("no consulta ni dibuja administración para cliente u operario", () => {
  const item = parseActivityStore(null)[0];
  for (const role of [roles.aunor, roles.operario]) {
    const { unmount } = render(<AdminAunorPanel item={item} role={role} />);
    expect(screen.queryByRole("region", { name: "Gestión Aunor" })).toBeNull();
    unmount();
  }
  expect(mocks.read).not.toHaveBeenCalled();
});
it("guarda servicio y periodo juntos, sin exigir resumen manual, y conserva estado", async () => {
  const item = { ...parseActivityStore(null)[0], id: "cobertura-norte" };
  render(<AdminAunorPanel item={item} role={roles.admin} />);
  const service = await screen.findByLabelText("Servicio del contrato");
  fireEvent.change(service, { target: { value: "cobertura" } });
  fireEvent.change(screen.getByLabelText("Periodo contractual"), {
    target: { value: workspace().contractPeriods![0].id },
  });
  expect(mocks.save).not.toHaveBeenCalled();
  expect(
    screen.getByText("Motivo y acuerdo registrado").closest("details")?.open,
  ).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "Guardar relación" }));
  await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(1));
  expect(mocks.save.mock.calls[0][0]).toMatchObject({
    command: "relation",
    activityId: item.id,
    activityVersion: item.version,
    serviceId: "cobertura",
    confirmed: true,
    periodId: workspace().contractPeriods![0].id,
  });
  expect(mocks.save.mock.calls[0][0]).not.toHaveProperty("status");
});
it("la vista previa no duplica entregadas, no cuenta programadas ni reemplazadas", () => {
  const w = workspace(),
    a = w.activities.find((a) => a.id === "cobertura-norte")!,
    p = w.contractPeriods![0];
  a.contract_period_id = p.id;
  expect(previewContractRelation(w, a.id, "cobertura", p.id, "")?.delta).toBe(
    0,
  );
  a.contract_period_id = null;
  expect(previewContractRelation(w, a.id, "cobertura", p.id, "")?.delta).toBe(
    1,
  );
  a.status = "Programada";
  expect(previewContractRelation(w, a.id, "cobertura", p.id, "")?.delta).toBe(
    0,
  );
  a.status = "Entregada";
  w.replacements[0].original_activity_id = a.id;
  expect(previewContractRelation(w, a.id, "cobertura", p.id, "")?.delta).toBe(
    0,
  );
  expect(previewContractRelation(w, a.id, "redes", p.id, "")).toBeNull();
});
it("reutiliza requestId cuando falla la respuesta del guardado", async () => {
  mocks.save.mockResolvedValue({ ok: false, error: "Reintenta" });
  const item = { ...parseActivityStore(null)[0], id: "cobertura-norte" };
  render(<AdminAunorPanel item={item} role={roles.admin} />);
  await screen.findByLabelText("Servicio del contrato");
  fireEvent.click(screen.getByRole("button", { name: "Guardar relación" }));
  await screen.findByRole("alert");
  fireEvent.click(
    await screen.findByRole("button", { name: "Guardar relación" }),
  );
  await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(2));
  expect(mocks.save.mock.calls[0][0].requestId).toBe(
    mocks.save.mock.calls[1][0].requestId,
  );
});
it("valida confirmación y respaldo sin exigir aprobación del cliente", () => {
  expect(
    validAdminActivityInput({
      command: "relation",
      activityId: "demo",
      requestId: "uuid",
      activityVersion: 1,
      publicationVersion: 0,
      summary: "Título",
      serviceId: "cobertura",
      periodId: null,
      notPerformedReason: "",
      confirmed: false,
    }),
  ).toBe(false);
  expect(
    validAdminActivityInput({
      command: "replacement",
      activityId: "demo",
      requestId: "uuid",
      activityVersion: 1,
      originalId: "other",
      agreementId: "",
      reason: "Cambio acordado",
      channel: "Llamada",
      contactedAt: "2026-04-12T14:00:00Z",
      requesterDeclared: "Solicitante",
      evidenceLink: "http://unsafe.example",
    }),
  ).toBe(false);
});
