import { expect, test, type Page } from "@playwright/test";

const credentials = {
  admin: "admin2026",
  ana: "ana2026",
  burson: "burson2026",
  luis: "luis2026",
} as const;
const accountNames = {
  admin: "Marco Admin",
  ana: "Ana Torres",
  burson: "Equipo Burson",
  luis: "Luis Mendoza",
} as const;
async function login(page: Page, user: keyof typeof credentials) {
  await page.goto("/acceso");
  await page
    .getByRole("listitem")
    .filter({ hasText: accountNames[user] })
    .getByRole("button", { name: "Ingresar" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Acceso de colaborador" }),
  ).toBeVisible();
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
  await expect(
    page.getByRole("link", { name: /Nueva actividad/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Cerrar sesión/ }).click();
  await expect(page).toHaveURL(/\/acceso$/);

  await login(page, "admin");
  await page.goto("/historico");
  await expect(
    page.getByRole("heading", { name: "Histórico 2026" }),
  ).toBeVisible();
  await expect(page.getByLabel("Leyenda de tipos")).toContainText("Grabación");
});

test("el histórico responde como el mockup en móvil, tablet, laptop y PC", async ({
  page,
}) => {
  await login(page, "admin");
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1366, height: 900 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/historico");
    await expect(
      page.getByRole("heading", { name: "Histórico 2026" }),
    ).toBeVisible();
    await expect(page.getByText("ENERO", { exact: true })).toBeVisible();
    await expect(page.getByText("DICIEMBRE", { exact: true })).toBeVisible();
    await page.screenshot({
      fullPage: true,
      path: `.verificacion/current-historico-${viewport.width}.png`,
    });
  }
});

test("la entrega persiste y Admin bloquea sus campos al iniciar la conversación", async ({
  page,
}) => {
  await login(page, "ana");
  await page.getByRole("link", { name: /Nueva actividad/ }).click();
  await page.waitForURL(/\/actividades\/nueva$/);
  await expect(
    page.getByRole("heading", { name: "Nueva actividad", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Actividad o proyecto")
    .fill("Cobertura E2E persistente");
  await page.getByLabel("Lugar o referencia").fill("Lima");
  await page
    .getByLabel("Descripción")
    .fill("Actividad creada por el recorrido crítico del navegador.");
  await page.getByLabel("Inicio").fill("2026-08-21");
  await page.getByLabel("Fin").fill("2026-08-21");
  await page
    .getByLabel("Enlace de OneDrive")
    .fill("https://onedrive.live.com/prueba-e2e");
  await page
    .getByLabel("Opinión opcional")
    .fill("Entrega lista para revisión.");
  await page.getByRole("button", { name: "Guardar actividad" }).click();
  await expect(page.getByText(/Actividad registrada/)).toBeVisible();
  await page.getByRole("link", { name: "Ver actividad" }).click();
  await page.waitForURL(/\/actividades\/(?!nueva)[^/]+$/);
  const activityPath = new URL(page.url()).pathname;
  await expect(
    page.getByRole("heading", { name: "Cobertura E2E persistente" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByText("Entrega lista para revisión.")).toBeVisible();

  await page.getByRole("button", { name: "Iniciar" }).click();
  await expect(page.getByText(/En proceso/).first()).toBeVisible();
  await page.getByRole("button", { name: "Entregar" }).click();
  await expect(page.getByText(/Entregada/).first()).toBeVisible();

  await page.getByRole("button", { name: /Cerrar sesión/ }).click();
  await expect(page).toHaveURL(/\/acceso$/);
  await login(page, "admin");
  await page.goto(activityPath);
  await page
    .getByPlaceholder("Escribe un mensaje para el responsable")
    .fill("Revisión iniciada por Admin.");
  await page.getByRole("button", { name: "Enviar mensaje" }).click();
  await expect(page.getByText("ENTREGA BLOQUEADA")).toBeVisible();

  await page.getByRole("button", { name: /Cerrar sesión/ }).click();
  await expect(page).toHaveURL(/\/acceso$/);
  await login(page, "ana");
  await page.goto(activityPath);
  await page.getByRole("link", { name: "Editar" }).click();
  await expect(page.getByLabel("Enlace de OneDrive")).toBeDisabled();
  await expect(page.getByLabel("Opinión opcional")).toBeDisabled();
});
