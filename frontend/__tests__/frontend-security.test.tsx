import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActivityDashboard } from "@/components/activity-dashboard";
import { ActivityDetail } from "@/components/activity-detail";
import { ActivityForm } from "@/components/activity-form";
import { activityStoreKey } from "@/lib/activity-simulation";
import { safeMaterialUrl } from "@/lib/external-link";
import { roles } from "@/lib/roles";

describe("seguridad defensiva del frontend", () => {
  it("solo permite enlaces HTTPS conocidos de OneDrive", () => {
    expect(safeMaterialUrl("https://onedrive.live.com/example")).toContain("onedrive.live.com");
    expect(safeMaterialUrl("https://empresa.sharepoint.com/folder")).toContain("sharepoint.com");
    expect(safeMaterialUrl("javascript:alert(1)")).toBeNull();
    expect(safeMaterialUrl("https://sitio-malicioso.example/material")).toBeNull();
    expect(safeMaterialUrl("http://onedrive.live.com/inseguro")).toBeNull();
  });

  it("oculta el detalle de una actividad perteneciente a otro rol", () => {
    render(<ActivityDetail id="resumen-seguridad" role={roles.grabacion} />);
    expect(screen.getByText("No tienes permiso para ver esta actividad")).toBeDefined();
    expect(screen.queryByText("Resumen semanal de seguridad vial")).toBeNull();
  });

  it("impide editar por URL una actividad de otro tipo", () => {
    render(<ActivityForm activityId="resumen-seguridad" editing role={roles.grabacion} />);
    expect(screen.getByText("No puedes editar esta actividad")).toBeDefined();
    expect(screen.queryByLabelText(/^Título/)).toBeNull();
  });

  it("avisa cuando el almacenamiento local está dañado", async () => {
    localStorage.setItem(activityStoreKey, "{dato-invalido");
    render(<ActivityDashboard role={roles.coordinacion} />);
    await waitFor(() => expect(screen.getByRole("alert")).toBeDefined());
    expect(screen.getByText(/datos locales estaban dañados/)).toBeDefined();
  });
});
