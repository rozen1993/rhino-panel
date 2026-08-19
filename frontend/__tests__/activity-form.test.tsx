import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ActivityForm } from "@/components/activity-form";
import { activityDraftStorageKey, type ActivityDraft } from "@/lib/activity-draft";
import { roles } from "@/lib/roles";

describe("formulario de actividad", () => {
  it("exige ubicación para Grabación (D-056)", () => {
    render(<ActivityForm role={roles.grabacion} />);
    expect(screen.getByLabelText(/^Nombre del lugar/).hasAttribute("required")).toBe(true);
  });

  it("deja la ubicación opcional para Locución (D-056)", () => {
    render(<ActivityForm role={roles.locucion} />);
    expect(screen.getByLabelText(/^Nombre del lugar/).hasAttribute("required")).toBe(false);
  });

  it("guarda los cambios y conserva una clave idempotente", () => {
    render(<ActivityForm role={roles.grabacion} />);
    fireEvent.change(screen.getByLabelText(/^Título/), { target: { value: "Cobertura nocturna" } });

    const rawDraft = window.localStorage.getItem(activityDraftStorageKey("grabacion"));
    expect(rawDraft).not.toBeNull();
    const draft = JSON.parse(rawDraft!) as ActivityDraft;
    expect(draft.fields.title).toBe("Cobertura nocturna");
    expect(draft.idempotencyKey.length).toBeGreaterThan(10);

    fireEvent.change(screen.getByLabelText(/^Descripción/), { target: { value: "Trabajo en campo" } });
    const updatedDraft = JSON.parse(window.localStorage.getItem(activityDraftStorageKey("grabacion"))!) as ActivityDraft;
    expect(updatedDraft.idempotencyKey).toBe(draft.idempotencyKey);
  });

  it("restaura el borrador después de volver a montar el formulario", async () => {
    const firstRender = render(<ActivityForm role={roles.grabacion} />);
    fireEvent.change(screen.getByLabelText(/^Título/), { target: { value: "Actividad recuperada" } });
    firstRender.unmount();

    render(<ActivityForm role={roles.grabacion} />);
    await waitFor(() => expect((screen.getByLabelText(/^Título/) as HTMLInputElement).value).toBe("Actividad recuperada"));
    expect(screen.getByText("Guardado en este teléfono")).toBeDefined();
  });

  it("elimina el borrador cuando el reintento simulado termina", () => {
    vi.useFakeTimers();
    try {
      render(<ActivityForm role={roles.grabacion} />);
      fireEvent.change(screen.getByLabelText(/^Título/), { target: { value: "Actividad por enviar" } });
      fireEvent.change(screen.getByLabelText(/^Fecha/), { target: { value: "2026-08-18T10:00" } });
      fireEvent.change(screen.getByLabelText(/^Responsable/), { target: { value: "Grabación" } });
      fireEvent.change(screen.getByLabelText(/^Estado inicial/), { target: { value: "Programada" } });
      fireEvent.change(screen.getByLabelText(/^Nombre del lugar/), { target: { value: "Peaje" } });
      fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
      expect(screen.getByRole("button", { name: "Reintentando…" })).toBeDefined();

      act(() => vi.advanceTimersByTime(900));

      expect(window.localStorage.getItem(activityDraftStorageKey("grabacion"))).toBeNull();
      expect(screen.getByText(/Actividad guardada en la simulación/)).toBeDefined();
    } finally {
      vi.useRealTimers();
    }
  });
});
