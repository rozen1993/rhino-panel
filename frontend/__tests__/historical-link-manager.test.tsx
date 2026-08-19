import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HistoricalLinkManager } from "@/components/historical-link-manager";

describe("enlace al histórico", () => {
  it("permite cambiar el enlace dentro de la simulación", () => {
    render(<HistoricalLinkManager />);
    const input = screen.getByLabelText(/^Enlace al histórico/);
    fireEvent.change(input, { target: { value: "https://onedrive.live.com/historico-rhino" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar enlace" }));
    expect(screen.getByRole("link", { name: "Abrir histórico" }).getAttribute("href")).toBe("https://onedrive.live.com/historico-rhino");
    expect(screen.getByText("Enlace actualizado en esta simulación.")).toBeDefined();
  });
});
