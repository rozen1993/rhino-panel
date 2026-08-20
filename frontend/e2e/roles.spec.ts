import { expect, test, type Page } from "@playwright/test";

const credentials = { grabacion: "grabacion2026", coordinacion: "coordinacion2026", supervision: "supervision2026", aunor: "aunor2026", burson: "burson2026" } as const;
async function login(page: Page, user: keyof typeof credentials) { await page.goto("/acceso"); await page.locator("#usuario").fill(user); await page.locator("#clave").fill(credentials[user]); await page.getByRole("button", { name: "Entrar" }).click(); await page.waitForURL((url) => url.pathname !== "/acceso"); }

test("Coordinacion crea, el responsable entrega y Supervision aprueba", async ({ page }) => {
  const title = `Orden E2E ${Date.now()}`;
  await login(page, "coordinacion"); await page.goto("/actividades/nueva");
  await page.locator("#activity-date").fill("2026-08-20T10:30"); await page.locator("#activity-title").fill(title); await page.locator("#activity-type").selectOption({ label: "Grabación" }); await page.locator("#activity-responsible").selectOption("test-grabacion"); await page.locator("#place-name").fill("Peaje E2E"); await page.getByRole("button", { name: "Crear y asignar orden" }).click(); await expect(page.getByText("Orden guardada.")).toBeVisible();

  await login(page, "grabacion"); const row = page.getByRole("row").filter({ hasText: title }); await expect(row).toBeVisible(); await row.getByRole("link", { name: "Ver" }).click(); await page.getByRole("link", { name: "Editar reporte" }).click(); await page.locator("#material-link").fill("https://onedrive.live.com/e2e"); await page.locator("#activity-notes").fill("Material listo para revision"); await page.getByRole("button", { name: "Guardar reporte" }).click(); await page.getByRole("link", { name: "Ver actividad" }).click();
  await page.getByRole("button", { name: "Avanzar" }).click(); await expect(page.getByText("En proceso").first()).toBeVisible(); await page.getByRole("button", { name: "Avanzar" }).click(); await expect(page.getByText("Por subir").first()).toBeVisible(); await page.getByRole("button", { name: "Avanzar" }).click(); await expect(page.getByText("Entregada").first()).toBeVisible();

  await login(page, "supervision"); await page.goto("/supervision"); await page.getByText(title).locator("xpath=ancestor::div[.//a[normalize-space()='Revisar detalle']][1]").getByRole("link", { name: "Revisar detalle" }).click(); await page.getByRole("button", { name: "Aprobar" }).click(); await expect(page.getByText("Actividad aprobada.")).toBeVisible(); await expect(page.getByText("Aprobada").first()).toBeVisible();
});

test("un operario no puede crear ordenes ni abrir trabajo ajeno", async ({ page }) => { await login(page, "grabacion"); await page.goto("/actividades/nueva"); await expect(page).toHaveURL(/\/sin-acceso$/); await page.goto("/actividades/resumen-seguridad"); await expect(page.getByText("No tienes permiso para ver esta actividad")).toBeVisible(); });

test("Historico valida y conserva el enlace", async ({ page }) => { await login(page, "supervision"); await page.goto("/historico"); const input = page.getByLabel("Enlace al histórico"); await input.fill("https://evil.example/excel"); await page.getByRole("button", { name: "Guardar enlace" }).click(); await expect(page.getByText(/Usa un enlace HTTPS/)).toBeVisible(); await input.fill("https://onedrive.live.com/excel-e2e"); await page.getByRole("button", { name: "Guardar enlace" }).click(); await page.reload(); await expect(input).toHaveValue("https://onedrive.live.com/excel-e2e"); });

test("las vistas principales responden en movil y escritorio", async ({ page }) => { await login(page, "supervision"); for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) { await page.setViewportSize(viewport); await page.goto("/supervision"); await expect(page.getByRole("heading", { name: "Panel de supervisión" })).toBeVisible(); await page.goto("/historial"); await expect(page.getByRole("heading", { name: "Historial mensual" })).toBeVisible(); } });

test("AUNOR y Burson conservan sus fronteras", async ({ page }) => { await login(page, "aunor"); await expect(page).toHaveURL(/\/aunor$/); await page.goto("/supervision"); await expect(page).toHaveURL(/\/sin-acceso$/); await login(page, "burson"); await page.goto("/burson"); await expect(page.getByText(/Vista de solo lectura/)).toBeVisible(); await page.goto("/actividades"); await expect(page).toHaveURL(/\/sin-acceso$/); });
