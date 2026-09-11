import { expect, test } from "@playwright/test";
import type { SimulatedActivity } from "../lib/activity-simulation";

// Only the fresh Playwright browser's demo store; never local/remote work databases.
const fixtures: SimulatedActivity[] = ["Cobertura institucional", "Entrevista y tomas de apoyo", "Grabación de invitación"].map((title, index) => ({
  id: `visual-panel-${index}`,
  title,
  type: "Grabación",
  responsible: "Ana Torres",
  responsibleAccountId: "account-ana",
  status: index === 0 ? "En proceso" : "Programada",
  origin: "operario",
  spans: [{ start: "2026-09-11", end: "2026-09-11", place: "Sede de demostración" }],
  description: index === 0 ? "Registro de la jornada, entrevistas y recursos para la edición. Material ficticio para verificar el diseño. ".repeat(6) : "Preparación de cámara, sonido y tomas de apoyo. Datos ficticios de prueba visual.",
  place: "Sede de demostración",
  materialLink: "https://example.com/material-demo",
  operatorOpinion: "Observación de demostración conservada íntegramente.",
  createdByAccountId: "account-admin",
  createdByRoleId: "admin",
  createdAt: "2026-09-01T12:00:00Z",
  updatedAt: "2026-09-01T12:00:00Z",
  referenceLink: "",
  version: 1,
  detailHydration: "complete",
  thread: [], audit: [],
}));

for (const width of [320, 390, 768, 1366, 1920]) {
  test(`panel histórico legible y navegación conservada a ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/acceso");
    await page.getByRole("listitem").filter({ hasText: "Marco Admin" }).getByRole("button", { name: "Ingresar" }).click();
    await page.locator("#usuario").fill("admin");
    await page.locator("#clave").fill("admin2026");
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.waitForURL(url => url.pathname !== "/acceso");
    await page.evaluate(data => localStorage.setItem("rhino:actividades-simuladas:v4", JSON.stringify(data)), fixtures);
    await page.goto("/historico?tipo=grabacion&anio=2026");
    if (width === 320) await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
    const day = page.getByRole("button", { name: /11 de septiembre: Grabación/ });
    await day.click();
    const panel = width < 768 ? page.getByRole("dialog").getByRole("complementary") : page.locator('aside[aria-labelledby="activity-detail-title-desktop"]');
    const choices = panel.getByRole("region", { name: "Actividades de esta fecha" });
    await expect(choices.getByRole("article")).toHaveCount(3);
    await expect(panel.locator("time")).toHaveAttribute("datetime", "2026-09-11");
    await expect(choices).not.toContainText("visual-panel-");
    expect(await choices.locator("span.inline-flex").filter({ hasText: "En proceso" }).evaluate(el => getComputedStyle(el).backgroundColor)).toBe("rgb(37, 99, 235)");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await panel.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    // Viewport captures reflect the sticky panel's real position, unlike full-page stitching.
    await page.screenshot({ path: info.outputPath(`lista-${width}.png`), fullPage: false });

    const action = choices.getByRole("button", { name: /visual-panel-0/ });
    await action.click();
    const back = panel.getByRole("button", { name: /Volver a las actividades del día/ });
    await expect(back).toBeFocused();
    await expect(panel.getByText(fixtures[0].description.trim(), { exact: true })).toBeVisible();
    await expect(panel.getByText("ID: visual-panel-0", { exact: true })).not.toBeVisible();
    await expect(panel.getByRole("link", { name: /Abrir material/ })).toHaveAttribute("href", fixtures[0].materialLink);
    await page.screenshot({ path: info.outputPath(`detalle-${width}.png`), fullPage: false });
    await panel.getByText("Referencia de la actividad", { exact: true }).click();
    await expect(panel.getByText("ID: visual-panel-0", { exact: true })).toBeVisible();
    await panel.getByText("Opinión del operario", { exact: true }).click();
    await expect(panel.getByText(fixtures[0].operatorOpinion, { exact: true })).toBeVisible();
    await back.click();
    await expect(action).toBeFocused();
    await expect(choices.getByRole("article")).toHaveCount(3);
    await expect(panel.locator("time")).toHaveAttribute("datetime", "2026-09-11");
    if (width < 768) {
      await page.keyboard.press("Escape");
      await expect(day).toBeFocused();
    }
  });
}
