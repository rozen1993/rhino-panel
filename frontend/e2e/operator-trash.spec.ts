import { expect, test, type Page } from "@playwright/test";

async function login(page: Page, user: "ana" | "admin") {
  await page.goto("/acceso");
  await page.getByRole("listitem").filter({ hasText: user === "ana" ? "Ana Torres" : "Marco Admin" }).getByRole("button", { name: "Ingresar" }).click();
  await page.locator("#usuario").fill(user);
  await page.locator("#clave").fill(`${user}2026`);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForURL("**/actividades");
}

for (const width of [1440, 390]) {
  test(`baja propia recuperable, confirmación y gestión centrada (${width})`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1080 });
    await login(page, "ana");
    await page.getByRole("link", { name: "Crear actividad propia" }).click();
    await page.getByLabel("Actividad o proyecto").fill("Cobertura institucional de prueba");
    await page.getByLabel("Descripción", { exact: true }).fill("Fotografía y video para validar el flujo local. Información sintética.");
    await page.getByLabel("Lugar o referencia").fill("Sede de prueba");
    await page.getByLabel("Inicio", { exact: true }).fill("2026-09-22");
    await page.getByLabel("Fin", { exact: true }).fill("2026-09-22");
    await page.getByRole("checkbox", { name: "Fotografía", exact: true }).check();
    await page.getByRole("checkbox", { name: "Video", exact: true }).check();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath("modalidades-implementadas.png"), fullPage: true });
    await page.locator("main button[type=submit]").click();
    await page.getByRole("link", { name: "Ver actividad", exact: true }).click();
    await expect(page).toHaveURL(/\/actividades\/(?!nueva)[^/?]+$/);
    const detailUrl = page.url();
    const edit = page.getByRole("link", { name: "Editar actividad", exact: true });
    const remove = page.getByRole("button", { name: "Eliminar actividad", exact: true });
    await expect(edit).toBeVisible(); await expect(remove).toBeVisible();
    for (const button of [edit, remove]) expect(await button.evaluate(el => getComputedStyle(el).justifyContent)).toBe("center");
    const editBox = (await edit.boundingBox())!, removeBox = (await remove.boundingBox())!;
    expect(Math.abs(editBox.width - removeBox.width)).toBeLessThan(1);
    expect(Math.abs(editBox.height - removeBox.height)).toBeLessThan(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 390) {
      const heading = (await page.getByRole("heading", { name: "Cobertura institucional de prueba", exact: true }).boundingBox())!;
      const actions = (await page.getByRole("heading", { name: "Material y estado" }).boundingBox())!;
      const description = (await page.getByRole("heading", { name: "Descripción", exact: true }).boundingBox())!;
      expect(heading.y).toBeLessThan(actions.y); expect(actions.y).toBeLessThan(description.y);
    }
    await page.screenshot({ path: info.outputPath("acciones-implementadas.png"), fullPage: true });
    await remove.click();
    const dialog = page.getByRole("dialog", { name: "¿Enviar a Papelera?" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Cancelar", exact: true })).toBeFocused();
    await expect(dialog.getByRole("button", { name: "Enviar a Papelera", exact: true })).toBeDisabled();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0); await expect(remove).toBeFocused();
    await remove.click();
    await dialog.getByLabel("Motivo de eliminación (obligatorio)").fill("Actividad duplicada de prueba");
    // Native modal keeps keyboard focus inside even after cycling repeatedly.
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
      expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
    }
    await page.screenshot({ path: info.outputPath("confirmacion-implementada.png"), fullPage: false });
    await dialog.getByRole("button", { name: "Enviar a Papelera", exact: true }).click();
    await expect(page).toHaveURL(/\/actividades$/);
    await expect(page.getByRole("link", { name: "Papelera", exact: true })).toHaveCount(0);
    await page.goto(detailUrl);
    await expect(page.getByRole("button", { name: "Eliminar actividad", exact: true })).toHaveCount(0);
    await page.goto("/papelera"); await expect(page).toHaveURL(/\/sin-acceso$/);
    // Same isolated browser storage; Admin alone recovers the deleted fixture.
    await page.context().clearCookies({ name: /^rhino_(?:rol|cuenta)_prueba_v2$/ });
    await login(page, "admin");
    await page.goto("/papelera");
    await expect(page.getByRole("heading", { name: "Cobertura institucional de prueba", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Restaurar actividad", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Actividad restaurada.");
    await page.goto(detailUrl);
    await expect(page.getByRole("heading", { name: "Cobertura institucional de prueba", exact: true })).toBeVisible();
    await expect(page.getByRole("list", { name: "Modalidades de grabación" })).toContainText("Fotografía");
    await page.getByText("Trazabilidad completa", { exact: true }).click();
    await expect(page.getByText("Actividad propia enviada a Papelera", { exact: true })).toBeVisible();
  });
}

test("el operario no recibe baja propia en actividades creadas por Admin", async ({ page }) => {
  await login(page, "ana");
  await page.goto("/actividades/piezas-creativas");
  await expect(page.getByRole("button", { name: "Eliminar actividad", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Editar actividad", exact: true })).toHaveCount(0);
});
