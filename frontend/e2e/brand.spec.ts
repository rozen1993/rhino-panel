import { expect, test } from "@playwright/test";

test("DaVinci aparece en portada, acceso y panel sin cambiar el diseño adaptable", async ({ page }) => {
  for (const width of [390, 1366]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/", "/acceso"]) {
      await page.goto(path);
      await expect(page).toHaveTitle("DaVinci");
      await expect(page.getByText("DaVinci", { exact: true })).toBeVisible();
      await expect(page.getByText(/Rhino Audiovisuales/i)).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
  }
  await page.getByRole("listitem").filter({ hasText: "Marco Admin" }).getByRole("button", { name: "Ingresar" }).click();
  await page.locator("#usuario").fill("admin");
  await page.locator("#clave").fill("admin2026");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/actividades$/);
  await expect(page.getByText("DaVinci", { exact: true })).toBeVisible();
  await page.goto("/pagina-inexistente-marca");
  await expect(page.getByText("Revisa la dirección o vuelve a la portada de DaVinci.")).toBeVisible();
});
