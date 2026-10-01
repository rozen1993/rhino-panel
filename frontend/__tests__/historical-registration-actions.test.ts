import { beforeEach, it, expect, vi } from "vitest";
import { roles } from "@/lib/roles";
const mocks = vi.hoisted(() => ({
  role: vi.fn(),
  rpc: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/session", () => ({ currentRole: mocks.role }));
vi.mock("@/lib/data-source", () => ({ resolveDataSource: () => "supabase" }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ rpc: mocks.rpc }),
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));
import { registerHistoricalAction } from "@/app/actividades/registro-historico/actions";
import type { HistoricalRegistration } from "@/lib/historical-registration";
const id = "00000000-0000-4000-8000-000000000010",
  key = "00000000-0000-4000-8000-000000000011";
const p: HistoricalRegistration = {
  type: "Edición",
  title: "Video sintético",
  description: "",
  placeName: "",
  spans: [],
  deliveryDueOn: "2026-04-17",
  recordingModes: [],
  classification: "standard",
  responsibleAccountId: id,
  materialLink: "https://example.invalid/final",
  notes: "",
  referenceLink: "",
  serviceId: "redes",
  confirmed: true,
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.role.mockResolvedValue(roles.admin);
  mocks.rpc.mockResolvedValue({ data: { activityId: id }, error: null });
});
it.each([
  null,
  roles.operario,
  roles.aunor,
  { ...roles.admin, mustChangePassword: true },
])("rechaza invocación directa no autorizada", async (role) => {
  mocks.role.mockResolvedValue(role);
  expect(await registerHistoricalAction(p, key)).toMatchObject({ ok: false });
  expect(mocks.rpc).not.toHaveBeenCalled();
});
it("guarda en una sola RPC con la sesión y revalida el contrato", async () => {
  expect(await registerHistoricalAction(p, key)).toMatchObject({
    ok: true,
    activityId: id,
  });
  expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith(
    "register_historical_activity_v1",
    { p_request_id: key, p_payload: p },
  );
  expect(mocks.revalidate).toHaveBeenCalledWith("/contrato");
});
it("distingue rechazo confirmado de respuesta incierta", async () => {
  mocks.rpc.mockResolvedValue({ error: { code: "SR003" } });
  expect(await registerHistoricalAction(p, key)).not.toHaveProperty(
    "uncertain",
  );
  mocks.rpc.mockRejectedValue(new Error("Respuesta interrumpida"));
  expect(await registerHistoricalAction(p, key)).toMatchObject({
    ok: false,
    uncertain: true,
  });
});
it("mantiene la solicitud si el SDK devuelve un error de transporte sin lanzar", async () => {
  mocks.rpc.mockResolvedValue({
    data: null,
    error: { code: "", message: "TypeError: fetch failed" },
  });
  expect(await registerHistoricalAction(p, key)).toMatchObject({
    ok: false,
    uncertain: true,
  });
});
