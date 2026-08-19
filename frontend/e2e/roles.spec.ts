import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const credentials = {
  grabacion: "grabacion2026", edicion: "edicion2026", coordinacion: "coordinacion2026", creatividad: "creatividad2026",
  locucion: "locucion2026", supervision: "supervision2026", aunor: "aunor2026", burson: "burson2026",
} as const;

async function login(page: Page, user: keyof typeof credentials) {
  await page.goto("/acceso");
  await page.locator("#usuario").fill(user);
  await page.locator("#clave").fill(credentials[user]);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => url.pathname !== "/acceso");
}

async function setRole(context: BrowserContext, role: keyof typeof credentials) {
  await context.addCookies([{ name: "rhino_rol_prueba", value: role, domain: "localhost", path: "/" }]);
}

const workRoles = [
  { id: "grabacion", label: "Grabación", place: true },
  { id: "edicion", label: "Edición", place: false },
  { id: "coordinacion", label: "Coordinación", place: false },
  { id: "creatividad", label: "Creatividad", place: false },
  { id: "locucion", label: "Locución", place: false },
] as const;

for (const role of workRoles) {
  test(`${role.label} crea una actividad de su propio tipo`, async ({ page }) => {
    await login(page, role.id);
    await expect(page).toHaveURL(/\/actividades$/);
    await page.goto("/actividades/nueva");
    const title = `Prueba E2E ${role.label}`;
    await page.locator("#activity-date").fill("2026-08-19T10:30");
    await page.locator("#activity-title").fill(title);
    if (role.id === "grabacion") {
      await page.reload();
      await expect(page.locator("#activity-title")).toHaveValue(title);
    }
    await page.locator("#activity-responsible").selectOption({ label: role.label });
    await page.locator("#activity-status").selectOption("Programada");
    if (role.place) await page.locator("#place-name").fill("Peaje E2E");
    await page.getByRole("button", { name: "Guardar actividad" }).click();
    await expect(page.getByRole("link", { name: "Ver actividad" })).toBeVisible();
    await page.getByRole("link", { name: "Ver actividad" }).click();
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
  });
}

test("Supervisión aprueba una entrega y conserva la trazabilidad", async ({ page }) => {
  await login(page, "supervision");
  await expect(page).toHaveURL(/\/supervision$/);
  const title = "Agenda de rodaje con cuadrilla norte";
  const card = page.getByText(title, { exact: true }).locator('xpath=ancestor::div[.//button[normalize-space()="Aprobar"]][1]');
  await card.getByRole("button", { name: "Aprobar" }).click();
  await expect(page.getByText("Actividad aprobada.")).toBeVisible();
  await page.goto("/actividades/agenda-cuadrilla-norte");
  await expect(page.getByRole("region", { name: "Historial de estado" })).toContainText("Aprobada");
});

test("AUNOR comenta, Supervisión responde y el estado no cambia", async ({ page, context }) => {
  await login(page, "aunor");
  await expect(page).toHaveURL(/\/aunor$/);
  const input = page.locator("#comment-peaje-chillon");
  await input.fill("Comentario E2E de AUNOR");
  await input.locator("..").getByRole("button", { name: "Enviar opinión" }).click();
  await expect(page.getByText("Tu opinión fue enviada a Supervisión.")).toBeVisible();
  await setRole(context, "supervision");
  await page.goto("/supervision");
  await expect(page.getByText("Comentario E2E de AUNOR")).toBeVisible();
  await page.getByRole("button", { name: "Responder" }).first().click();
  await page.locator("textarea[id^=feedback-reply]").fill("Respuesta E2E de Rhino");
  await page.locator("textarea[id^=feedback-reply]").locator("..").getByRole("button", { name: "Enviar" }).click();
  await setRole(context, "aunor");
  await page.goto("/aunor");
  await expect(page.getByText(/Respuesta E2E de Rhino/)).toBeVisible();
  await expect(page.getByRole("region", { name: "Actividades" })).toContainText("En trabajo");
});

test("Coordinación escribe en Burson y Burson solo consulta", async ({ page, context }) => {
  await login(page, "coordinacion");
  await page.goto("/burson");
  await page.getByRole("button", { name: /Nueva solicitud/ }).click();
  await page.getByRole("textbox", { name: "Solicitud", exact: true }).fill("Solicitud E2E Burson");
  await page.getByLabel("Fecha", { exact: true }).fill("2026-08-19");
  await page.getByLabel("Material solicitado").fill("Piezas para redes");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Solicitud E2E Burson")).toBeVisible();
  await setRole(context, "burson");
  await page.goto("/burson");
  await expect(page.getByText("Solicitud E2E Burson")).toBeVisible();
  await expect(page.getByText(/Vista de solo lectura/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Nueva solicitud|Editar|Eliminar/ })).toHaveCount(0);
});

test("las rutas directas respetan la matriz de permisos", async ({ page, context }) => {
  await setRole(context, "grabacion");
  await page.goto("/cuentas");
  await expect(page).toHaveURL(/\/sin-acceso$/);
  await page.goto("/actividades/resumen-seguridad");
  await expect(page.getByText("No tienes permiso para ver esta actividad")).toBeVisible();
  await page.goto("/actividades/nueva?editar=resumen-seguridad");
  await expect(page.getByText("No puedes editar esta actividad")).toBeVisible();
  await setRole(context, "burson");
  await page.goto("/actividades");
  await expect(page).toHaveURL(/\/sin-acceso$/);
  await setRole(context, "aunor");
  await page.goto("/supervision");
  await expect(page).toHaveURL(/\/sin-acceso$/);
});

test("las vistas principales responden en móvil, tablet y escritorio", async ({ page, context }) => {
  await setRole(context, "supervision");
  for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1280, height: 900 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/supervision");
    await expect(page.getByRole("heading", { name: "Panel de supervisión" })).toBeVisible();
    await page.goto("/historial");
    await expect(page.getByRole("heading", { name: "Historial mensual" })).toBeVisible();
  }
});

test("una ruta inexistente muestra el 404 personalizado", async ({ page }) => {
  await page.goto("/ruta-que-no-existe");
  await expect(page.getByRole("heading", { name: "Esta página no existe" })).toBeVisible();
});
