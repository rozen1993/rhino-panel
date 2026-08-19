import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BursonDashboard } from "@/components/burson-dashboard";
import { addBursonComment, deleteBursonComment, deleteBursonRequest, editBursonComment, readBursonRequests, type BursonFields, upsertBursonRequest } from "@/lib/burson-store";
import { roles } from "@/lib/roles";

const fields: BursonFields = { request: "Nueva campaña", date: "2026-08-19", responsible: "Coordinación", material: "Fotografías", status: "Solicitado", rhinoPending: "Seleccionar fotos", bursonPending: "Validar texto", deliveryDate: "", approvalDate: "" };

describe("tablero funcional de Burson", () => {
  it("crea, edita y registra los cambios de estado", () => {
    const created = upsertBursonRequest(localStorage, fields, "Coordinación");
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const edited = upsertBursonRequest(localStorage, { ...fields, request: "Campaña corregida", status: "En proceso" }, "Supervisión", created.request.id);
    expect(edited.ok && edited.request.request).toBe("Campaña corregida");
    expect(edited.ok && edited.request.history[0]).toMatchObject({ status: "En proceso", actor: "Supervisión" });
  });

  it("edita y elimina comentarios con trazabilidad", () => {
    const created = upsertBursonRequest(localStorage, fields, "Coordinación");
    if (!created.ok) throw new Error(created.error);
    const commented = addBursonComment(localStorage, created.request.id, "Texto con eror", "Coordinación");
    if (!commented.ok) throw new Error(commented.error);
    const commentId = commented.request.comments[0].id;
    expect(editBursonComment(localStorage, created.request.id, commentId, "Texto corregido", "Coordinación").ok).toBe(true);
    expect(deleteBursonComment(localStorage, created.request.id, commentId, "Coordinación").ok).toBe(true);
    expect(readBursonRequests(localStorage).find((item) => item.id === created.request.id)?.comments[0].deletedAt).toBeTruthy();
  });

  it("elimina solicitudes lógicamente", () => {
    const created = upsertBursonRequest(localStorage, fields, "Coordinación");
    if (!created.ok) throw new Error(created.error);
    expect(deleteBursonRequest(localStorage, created.request.id, "Supervisión").ok).toBe(true);
    expect(readBursonRequests(localStorage).find((item) => item.id === created.request.id)?.deletedBy).toBe("Supervisión");
  });

  it("mantiene el rol Burson en solo lectura", () => {
    render(<BursonDashboard role={roles.burson} />);
    expect(screen.getByText(/Vista de solo lectura/)).toBeDefined();
    expect(screen.queryByRole("button", { name: /Nueva solicitud/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "Editar" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Eliminar" })).toBeNull();
  });

  it("permite abrir el formulario únicamente a un rol escritor", () => {
    render(<BursonDashboard role={roles.coordinacion} />);
    fireEvent.click(screen.getByRole("button", { name: /Nueva solicitud/ }));
    expect(screen.getByText("Coordinación con Burson")).toBeDefined();
  });
});
