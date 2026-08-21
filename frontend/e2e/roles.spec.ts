import { expect, test, type Page } from "@playwright/test";

const credentials = { admin: "admin2026", ana: "ana2026", burson: "burson2026", luis: "luis2026" } as const;
async function login(page: Page, user: keyof typeof credentials) {
  await page.goto("/acceso");
  await page.locator("#usuario").fill(user);
  await page.locator("#clave").fill(credentials[user]);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => url.pathname !== "/acceso");
}

test("los tres roles conservan sus fronteras", async ({ page }) => {
  await login(page, "burson");
  await expect(page).toHaveURL(/\/burson$/);
  await page.goto("/historico");
  await expect(page).toHaveURL(/\/sin-acceso$/);

  await login(page, "ana");
  await expect(page).toHaveURL(/\/actividades$/);
  await expect(page.getByRole("link", { name: /Nueva actividad/ })).toBeVisible();

  await login(page, "admin");
  await page.goto("/historico");
  await expect(page.getByRole("heading", { name: "Histórico 2026" })).toBeVisible();
  await expect(page.getByLabel("Leyenda de tipos")).toContainText("Grabación");
});

test("el histórico responde como el mockup en móvil, tablet, laptop y PC", async ({ page }) => {
  await login(page, "admin");
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1366, height: 900 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/historico");
    await expect(page.getByRole("heading", { name: "Histórico 2026" })).toBeVisible();
    await expect(page.getByText("ENERO", { exact: true })).toBeVisible();
    await expect(page.getByText("DICIEMBRE", { exact: true })).toBeVisible();
  }
});
