import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TrashDashboard } from "@/components/trash-dashboard";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import type { SimulatedActivity } from "@/lib/activity-simulation";
import { roles } from "@/lib/roles";

const mocks = vi.hoisted(() => ({
  restore: vi.fn(),
}));

vi.mock("@/app/papelera/actions", () => ({
  restoreSupabaseActivityAction: mocks.restore,
}));
vi.mock("@/lib/account-store", () => ({ useAccounts: () => [] }));
vi.mock("@/lib/activity-simulation", () => ({
  actorFromRole: () => ({
    accountId: "admin-id",
    name: "Admin",
    roleId: "admin",
    roleLabel: "Admin",
  }),
  restoreActivity: vi.fn(),
  useSimulatedActivities: () => [],
}));

const adminRole = {
  ...roles.admin,
  accountId: "admin-id",
  accountName: "Admin",
};

function trashedActivity(
  id: string,
  title: string,
  responsibleAccountId = "operator-id",
): SimulatedActivity {
  const moment = "2026-08-31T10:00:00-05:00";
  return {
    id,
    type: "Edición",
    title,
    responsible: "Operario Original",
    responsibleAccountId,
    status: "Programada",
    origin: "operario",
    spans: [{ start: "2026-09-01", end: "2026-09-01" }],
    description: "Actividad en Papelera",
    place: "",
    materialLink: "",
    operatorOpinion: "",
    referenceLink: "",
    createdByAccountId: "admin-id",
    createdByRoleId: "admin",
    createdAt: moment,
    updatedAt: moment,
    version: 2,
    detailHydration: "complete",
    thread: [],
    audit: [],
    deletedAt: moment,
    deletedBy: {
      accountId: "admin-id",
      name: "Admin",
      roleId: "admin",
      roleLabel: "Admin",
    },
    deletionReason: "Registro duplicado",
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe("Papelera por tarjeta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("aísla operaciones pendientes, evita el doble envío y acepta respuestas fuera de orden", async () => {
    const first = deferred<{ ok: true }>();
    const second = deferred<{ ok: true }>();
    mocks.restore.mockImplementation((id: string) =>
      id === "trash-a" ? first.promise : second.promise,
    );
    render(
      <TrashDashboard
        dataSource="supabase"
        initialActivities={[
          trashedActivity("trash-a", "Actividad A"),
          trashedActivity("trash-b", "Actividad B"),
        ]}
        initialOperators={[
          { id: "operator-id", name: "Operario Original", bursonLinked: false },
        ]}
        role={adminRole}
      />,
    );

    const firstCard = screen
      .getByRole("heading", { name: "Actividad A" })
      .closest("article");
    const secondCard = screen
      .getByRole("heading", { name: "Actividad B" })
      .closest("article");
    if (!firstCard || !secondCard) throw new Error("Tarjetas no encontradas");
    const firstButton = within(firstCard).getByRole("button");
    const secondButton = within(secondCard).getByRole("button");

    fireEvent.click(firstButton);
    fireEvent.click(firstButton);
    expect(mocks.restore).toHaveBeenCalledTimes(1);
    expect((firstButton as HTMLButtonElement).disabled).toBe(true);
    expect(firstButton.textContent).toContain("Restaurando…");
    expect((secondButton as HTMLButtonElement).disabled).toBe(false);
    expect(secondButton.textContent).toContain("Restaurar actividad");

    fireEvent.click(secondButton);
    expect(mocks.restore).toHaveBeenCalledTimes(2);
    expect((secondButton as HTMLButtonElement).disabled).toBe(true);

    await act(async () => second.resolve({ ok: true }));
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "Actividad B" })).toBeNull(),
    );
    expect(screen.getByRole("heading", { name: "Actividad A" })).not.toBeNull();

    await act(async () => first.resolve({ ok: true }));
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "Actividad A" })).toBeNull(),
    );
  });

  it("inmoviliza el reemplazo enviado y libera la tarjeta después de un error", async () => {
    const request = deferred<{ ok: true }>();
    mocks.restore.mockReturnValueOnce(request.promise);
    render(
      <TrashDashboard
        dataSource="supabase"
        initialActivities={[
          trashedActivity("trash-c", "Actividad C", "inactive-operator"),
        ]}
        initialOperators={[
          { id: "new-operator", name: "Operario Nuevo", bursonLinked: false },
        ]}
        role={adminRole}
      />,
    );

    const select = screen.getByLabelText("Nuevo Operario responsable");
    const button = screen.getByRole("button", {
      name: "Restaurar actividad",
    });
    fireEvent.change(select, { target: { value: "new-operator" } });
    fireEvent.click(button);
    expect((select as HTMLSelectElement).disabled).toBe(true);
    expect(mocks.restore).toHaveBeenCalledWith(
      "trash-c",
      2,
      "new-operator",
    );

    await act(async () => request.reject(new Error("network")));
    await waitFor(() =>
      expect((button as HTMLButtonElement).disabled).toBe(false),
    );
    expect((select as HTMLSelectElement).disabled).toBe(false);
    expect(screen.getByRole("status").textContent).toContain(
      "Actividad C: no se pudo completar la restauración",
    );
  });
});
