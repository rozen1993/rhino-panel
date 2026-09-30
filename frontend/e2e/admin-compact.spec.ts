import { test, expect } from "@playwright/test";
import { resolve } from "node:path";
const captures = process.env.SISTEMA_R_CAPTURE_DIR ?? "../docs/implementacion-ficha-admin-2026-09-30";
for (const width of [1440, 390])
  test(`ficha compacta: contrato y reemplazo ${width}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route("**/*", (route) =>
      new URL(route.request().url()).hostname === "localhost"
        ? route.continue()
        : route.abort(),
    );
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/acceso");
    await page
      .getByRole("listitem")
      .filter({ hasText: "Marco Admin" })
      .getByRole("button", { name: "Ingresar" })
      .click();
    await page.locator("#usuario").fill("admin");
    await page.locator("#clave").fill("admin2026");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await page.waitForURL((url) => url.pathname !== "/acceso");
    // Each viewport owns its fixture; never change the shared delivery example
    // used by the Aunor navigation regression tests.
    await page.goto("/actividades/nueva");
    await page
      .getByLabel("Operario responsable")
      .selectOption({ label: "Ana Torres" });
    await page.getByLabel("Tipo de servicio").selectOption("Edición");
    await page
      .getByLabel("Actividad o proyecto")
      .fill(`Ficha compacta sintética ${width}`);
    await page.getByLabel("Fecha de entrega del proyecto").fill("2026-04-12");
    await page.getByRole("radio", { name: "Estándar", exact: true }).check();
    await page
      .getByRole("button", { name: "Planificar y asignar", exact: true })
      .click();
    await page
      .getByRole("link", { name: "Ver actividad", exact: true })
      .click();
    const panel = page.getByRole("region", {
      name: "Gestión Aunor",
      exact: true,
    });
    await expect(
      panel.getByRole("heading", { name: "Relación con el contrato" }),
    ).toBeVisible();
    await expect(
      panel.getByRole("textbox", { name: "Motivo y acuerdo registrado" }),
    ).not.toBeVisible();
    await panel
      .getByRole("combobox", { name: "Servicio del contrato", exact: true })
      .selectOption("redes");
    await panel
      .getByRole("combobox", { name: "Periodo contractual", exact: true })
      .selectOption({ label: "abril de 2026 · 4 trabajos" });
    await expect(
      panel.getByRole("complementary", { name: "Vista previa del conteo" }),
    ).toContainText("El conteo aún no cambia");
    await panel
      .getByRole("button", { name: "Guardar relación", exact: true })
      .click();
    await expect(panel.getByRole("status")).toContainText(
      "Relación contractual guardada",
    );
    await expect(
      page.locator(".technical-surface").getByText(/Programada/).first(),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await panel.screenshot({
      path: resolve(captures, `ficha-compacta-${width}.png`),
      style: "nav { visibility: hidden !important; }",
    });
    const disclosure = panel.locator("details").filter({
      has: page.getByRole("heading", {
        name: "Esta actividad reemplaza a…",
        includeHidden: true,
      }),
    });
    await disclosure.locator("summary").click();
    await panel
      .getByRole("combobox", { name: "Actividad original", exact: true })
      .selectOption(
        width === 1440 ? "edicion-seguridad" : "aunor-senalizacion",
      );
    await panel
      .getByRole("textbox", { name: "Motivo y acuerdo registrado" })
      .fill(
        "Sustitución sintética autorizada para comprobar el flujo compacto.",
      );
    await panel
      .getByRole("textbox", { name: "Solicitado por" })
      .fill("Solicitante de ejemplo");
    await panel.getByLabel("Fecha del acuerdo").fill("2026-04-12T10:00");
    await expect(
      panel.getByText("Pendiente de confirmación por Aunor", { exact: true }),
    ).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await panel.screenshot({
      path: resolve(captures, `reemplazo-compacto-${width}.png`),
      style: "nav { visibility: hidden !important; }",
    });
    // First case writes synthetic server memory; the second only checks keyboard close/focus.
    if (width === 1440) {
      await panel
        .getByRole("button", { name: "Registrar reemplazo", exact: true })
        .click();
      await expect(panel.getByRole("status")).toContainText(
        "Reemplazo y acuerdo registrados",
      );
    } else {
      await panel
        .getByRole("button", { name: "Cancelar", exact: true })
        .click();
    }
    await expect(disclosure.locator("summary")).toBeFocused();
    expect(errors).toEqual([]);
  });
