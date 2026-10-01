import { test, expect, type Page } from "@playwright/test";
import { resolve } from "node:path";
async function login(page: Page, username = "admin") {
  await page.goto("/acceso");
  await page
    .getByRole("listitem")
    .filter({
      hasText:
        username === "admin"
          ? "Marco Admin"
          : username === "aunor"
            ? "Aunor"
            : "Ana Torres",
    })
    .getByRole("button", { name: "Ingresar" })
    .click();
  await page.locator("#usuario").fill(username);
  await page.locator("#clave").fill(username + "2026");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForURL((url) => url.pathname !== "/acceso");
}
test.beforeEach(async ({ page }) => {
  await page.route("**/*", (r) =>
    new URL(r.request().url()).hostname === "localhost"
      ? r.continue()
      : r.abort(),
  );
});
for (const width of [1440, 390])
  test(`registro histórico y centro de contrato ${width}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewportSize({ width, height: 1000 });
    await login(page);
    await page
      .getByRole("link", { name: "Registrar trabajo terminado", exact: true })
      .click();
    const type = page.getByRole("combobox", {
      name: "Tipo de servicio",
      exact: true,
    });
    for (const kind of ["Locución", "Creatividad", "Grabación"]) {
      await type.selectOption(kind);
      await expect(
        page.getByLabel("Fecha de realización", { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByLabel("Fecha de entrega del proyecto", { exact: true }),
      ).toHaveCount(0);
    }
    const capture =
      process.env.SISTEMA_R_NEW_CAPTURE_DIR ??
      "../docs/implementacion-historico-centro-2026-09-30";
    await page.screenshot({
      path: resolve(capture, `registro-grabacion-${width}.png`),
      fullPage: true,
    });
    await type.selectOption("Edición");
    await expect(page.getByRole("radio", { name: "Sin clasificar" })).toHaveCount(0);
    await expect(page.getByLabel("Descripción", { exact: true })).toHaveCount(
      0,
    );
    await expect(
      page.getByLabel("Lugar o referencia", { exact: true }),
    ).toHaveCount(0);
    await expect(page.locator("input[type=date]")).toHaveCount(1);
    const title = `Histórico entregado prueba aislada ${width}`;
    await page.getByLabel("Nombre del trabajo", { exact: true }).fill(title);
    await page
      .getByLabel("Fecha de entrega del proyecto", { exact: true })
      .fill("2026-04-17");
    await page
      .getByRole("combobox", { name: "Responsable", exact: true })
      .selectOption("account-ana");
    await page
      .getByRole("combobox", { name: "Servicio del contrato", exact: true })
      .selectOption("redes");
    await page
      .getByLabel("Material final · enlace HTTPS", { exact: true })
      .fill("https://example.invalid/material");
    await page.getByRole("radio", { name: "Estándar", exact: true }).check();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: resolve(capture, `registro-edicion-${width}.png`),
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Revisar antes de registrar" })
      .click();
    await expect(
      page.getByRole("button", { name: "Confirmar registro histórico" }),
    ).toBeDisabled();
    await page
      .getByRole("checkbox", { name: /Confirmo que este trabajo/ })
      .check();
    await page
      .getByRole("button", { name: "Confirmar registro histórico" })
      .click();
    await expect(
      page.getByRole("heading", { name: "Registro completado" }),
    ).toBeVisible();
    const savedHref = await page
      .getByRole("link", { name: "Ver ficha del trabajo" })
      .getAttribute("href");
    await page.getByRole("button", { name: "Registrar otro trabajo" }).click();
    await expect(
      page.getByLabel("Nombre del trabajo", { exact: true }),
    ).toHaveValue("");
    await page.goto(savedHref!);
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Iniciar", exact: true }),
    ).toHaveCount(0);
    await page.goto("/contrato?mes=2026-04");
    const cards = page.getByRole("region", { name: "Servicios mensuales" });
    await expect(cards.locator("article")).toHaveCount(8);
    await cards
      .locator("article")
      .filter({
        has: page.getByRole("heading", {
          name: "Videos para redes sociales",
          exact: true,
        }),
      })
      .getByRole("button", { name: "Ver trabajos" })
      .click();
    const detail = page.getByRole("region", { name: "Detalle del servicio" });
    await expect(
      detail.getByRole("link", { name: title, exact: true }),
    ).toBeVisible();
    await detail.getByRole("link", { name: title, exact: true }).click();
    await page.getByRole("link", { name: "Volver", exact: true }).click();
    await expect(page).toHaveURL(/\/contrato\?mes=2026-04$/);
    await expect(page.getByRole("heading", { name: "Centro de contrato", exact: true })).toBeVisible();
    await expect(cards.locator("article")).toHaveCount(8);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: resolve(capture, `contrato-${width}.png`),
      fullPage: true,
    });
    await page.getByRole("button", { name: "Anual", exact: true }).click();
    await expect(
      page
        .getByRole("region", { name: "Servicios anuales" })
        .locator("article"),
    ).toHaveCount(4);
    await expect(
      page.getByRole("heading", {
        name: "Videos de fiesta de fin de año",
        exact: true,
      }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
for (const username of ["ana", "aunor"])
  test(`${username} no accede a las herramientas Admin`, async ({ page }) => {
    await login(page, username);
    await page.goto("/actividades/registro-historico");
    await expect(page).toHaveURL(/\/sin-acceso$/);
    await page.goto("/contrato");
    await expect(page).toHaveURL(/\/sin-acceso$/);
  });
