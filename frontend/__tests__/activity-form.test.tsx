import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActivityForm } from "@/components/activity-form";
import { activityDraftStorageKey, parseActivityDraft } from "@/lib/activity-draft";
import { roles } from "@/lib/roles";

describe("formulario de orden", () => {
  it("solo Coordinacion recibe el formulario de creacion", async () => { render(<ActivityForm role={roles.grabacion} />); await waitFor(() => expect(screen.getByText("No puedes editar esta actividad")).toBeDefined()); });
  it("Coordinacion elige tipo, responsable y datos administrativos", async () => { render(<ActivityForm role={roles.coordinacion} />); await waitFor(() => expect(screen.getByLabelText("Tipo")).toBeDefined()); expect(screen.getByLabelText("Responsable")).toBeDefined(); expect(screen.getByRole("button", { name: "Crear y asignar orden" })).toBeDefined(); });
  it("conserva una llave idempotente en el borrador", async () => { render(<ActivityForm role={roles.coordinacion} />); await waitFor(() => expect(screen.getByLabelText(/t.tulo/i)).toBeDefined()); fireEvent.change(screen.getByLabelText(/t.tulo/i), { target: { name: "title", value: "Orden persistente" } }); const draft = parseActivityDraft(window.localStorage.getItem(activityDraftStorageKey("coordinacion"))); expect(draft?.idempotencyKey).toBeTruthy(); expect(draft?.fields.title).toBe("Orden persistente"); });
});
