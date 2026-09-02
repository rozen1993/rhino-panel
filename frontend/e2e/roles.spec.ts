import { expect, test, type Page } from "@playwright/test";

const credentials = {
  admin: "admin2026",
  ana: "ana2026",
  carlos: "carlos2026",
  burson: "burson2026",
} as const;
const accountNames = {
  admin: "Marco Admin",
  ana: "Ana Torres",
  carlos: "Carlos Vega",
  burson: "Equipo Burson",
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

async function switchUser(page: Page, user: keyof typeof credentials) {
  await page.context().clearCookies({
    name: /^rhino_(?:rol|cuenta)_prueba_v2$/,
  });
  await login(page, user);
}

async function fillPlanning(page: Page, title: string) {
  await page.getByLabel("Actividad o proyecto").fill(title);
  await page.getByLabel("Lugar o referencia").fill("Lima");
  await page
    .getByLabel("Descripción")
    .fill("Recorrido verificable del contrato vigente de Sistema R.");
  await page.getByLabel("Inicio").fill("2026-08-29");
  await page.getByLabel("Fin").fill("2026-08-29");
}

function accountCard(page: Page, name: string) {
  return page
    .getByRole("heading", { name, exact: true })
    .locator(
      "xpath=ancestor::div[contains(concat(' ', normalize-space(@class), ' '), ' relative ')][1]",
    );
}

test("los roles vigentes respetan navegación y acceso directo", async ({
  page,
}) => {
  await login(page, "burson");
  await expect(page).toHaveURL(/\/burson$/);
  await page
    .getByRole("link", {
      name: "Consultar encargo Locución institucional Burson",
    })
    .click();
  await page.waitForURL(/\/burson\/[^/?]+$/);
  const bursonRequestPath = new URL(page.url()).pathname;
  await expect(
    page.getByRole("heading", { name: "Locución institucional Burson" }),
  ).toBeVisible();
  await expect(page.getByText("Trazabilidad completa")).toHaveCount(0);
  await expect(page.getByText("Conversación con Admin")).toHaveCount(0);
  await page.goto(bursonRequestPath.replace("/burson/", "/actividades/"));
  await expect(page).toHaveURL(/\/sin-acceso$/);
  await page.goto("/historico");
  await expect(page).toHaveURL(/\/sin-acceso$/);
  await page.goto("/papelera");
  await expect(page).toHaveURL(/\/sin-acceso$/);

  await switchUser(page, "carlos");
  await expect(page).toHaveURL(/\/actividades$/);
  await expect(
    page.getByRole("link", { name: "Crear actividad propia" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Nueva actividad" }),
  ).toHaveCount(0);
  await page.goto("/actividades/nueva");
  await expect(page).toHaveURL(/\/sin-acceso$/);
  await page.goto("/papelera");
  await expect(page).toHaveURL(/\/sin-acceso$/);

  await switchUser(page, "ana");
  await expect(
    page.getByRole("link", { name: "Crear actividad propia" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Nueva actividad" }),
  ).toHaveCount(0);

  await switchUser(page, "admin");
  await expect(
    page.getByRole("link", { name: "Planificar actividad" }),
  ).toBeVisible();
  await page.goto("/historico");
  await expect(
    page.getByRole("heading", { name: "Histórico 2026" }),
  ).toBeVisible();
});

test("Burson crea y consulta un encargo sin superficies internas", async ({
  page,
}) => {
  await login(page, "burson");
  await fillPlanning(page, "Encargo Burson E2E");
  await page
    .getByLabel("Enlace de referencia opcional")
    .fill("https://burson.example/referencia-e2e");
  await expect(page.getByLabel("Operario responsable")).toHaveCount(0);
  await expect(page.getByLabel("Enlace del material")).toHaveCount(0);
  await page.getByRole("button", { name: "Crear encargo" }).click();
  await expect(page.getByText("Encargo creado y asignado.")).toBeVisible();
  await page.getByRole("link", { name: "Ver encargo" }).click();
  await page.waitForURL(/\/burson\/[^/?]+$/);

  await expect(
    page.getByRole("heading", { name: "Encargo Burson E2E" }),
  ).toBeVisible();
  await expect(page.getByText("Luis Mendoza", { exact: true })).toBeVisible();
  await expect(page.getByText("Trazabilidad completa")).toHaveCount(0);
  await expect(page.getByText("Conversación con Admin")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Editar plan" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Iniciar" })).toHaveCount(0);
});

test("Admin concede y revoca el permiso individual de creación", async ({
  page,
}) => {
  await login(page, "admin");
  await page.goto("/cuentas");

  await accountCard(page, "Carlos Vega")
    .getByRole("button", { name: "Editar" })
    .click();
  await page
    .getByLabel("Permitir que cree actividades propias")
    .check();
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.getByText("Cuenta actualizada.")).toBeVisible();
  await expect(accountCard(page, "Carlos Vega")).toContainText(
    "Creación propia autorizada",
  );

  await switchUser(page, "carlos");
  await expect(
    page.getByRole("link", { name: "Crear actividad propia" }),
  ).toBeVisible();

  await switchUser(page, "admin");
  await page.goto("/cuentas");
  await accountCard(page, "Carlos Vega")
    .getByRole("button", { name: "Editar" })
    .click();
  await page
    .getByLabel("Permitir que cree actividades propias")
    .uncheck();
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(accountCard(page, "Carlos Vega")).not.toContainText(
    "Creación propia autorizada",
  );

  await switchUser(page, "carlos");
  await expect(
    page.getByRole("link", { name: "Crear actividad propia" }),
  ).toHaveCount(0);
  await page.goto("/actividades/nueva");
  await expect(page).toHaveURL(/\/sin-acceso$/);
});

test("una cuenta nueva reemplaza obligatoriamente su clave temporal", async ({
  page,
}) => {
  const username = "temporal.e2e";
  const finalPassword = "Definitiva8!E2E";

  await login(page, "admin");
  await page.goto("/cuentas");
  await page.getByRole("button", { name: "Dar de alta" }).click();
  await page.getByLabel("Nombre").fill("Cuenta Temporal E2E");
  await page.getByLabel("Usuario").fill(username);
  const temporaryPassword = await page
    .getByLabel("Clave temporal")
    .inputValue();
  expect(temporaryPassword).toMatch(/[A-Z]/);
  expect(temporaryPassword).toMatch(/[a-z]/);
  expect(temporaryPassword).toMatch(/[0-9]/);
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.getByText("Cuenta creada.")).toBeVisible();
  await expect(page.getByText(temporaryPassword, { exact: true })).toBeVisible();

  await page.context().clearCookies({
    name: /^rhino_(?:rol|cuenta)_prueba_v2$/,
  });
  await page.goto("/acceso");
  await page
    .getByRole("listitem")
    .filter({ hasText: "Cuenta Temporal E2E" })
    .getByRole("button", { name: "Ingresar" })
    .click();
  await page.locator("#usuario").fill(username);
  await page.locator("#clave").fill(temporaryPassword);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/cambiar-clave$/);
  await expect(
    page.getByRole("heading", { name: "Cambia tu clave temporal" }),
  ).toBeVisible();

  await page.goto("/actividades");
  await expect(page).toHaveURL(/\/cambiar-clave$/);
  await page.getByLabel("Nueva clave", { exact: true }).fill(finalPassword);
  await page.getByLabel("Repite la nueva clave").fill(finalPassword);
  await page
    .getByRole("button", { name: "Guardar clave y continuar" })
    .click();
  await expect(page).toHaveURL(/\/actividades$/);
});

test("el Operario autorizado crea una actividad forzada a su cuenta", async ({
  page,
}) => {
  await login(page, "ana");
  await page.getByRole("link", { name: "Crear actividad propia" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Crear actividad propia",
      exact: true,
      level: 1,
    }),
  ).toBeVisible();
  await expect(page.getByLabel("Operario responsable")).toHaveCount(0);
  await expect(page.getByLabel("Enlace del material")).toHaveCount(0);

  await fillPlanning(page, "Actividad propia E2E");
  await page
    .getByRole("button", { name: "Crear actividad propia" })
    .click();
  await expect(page.getByText("Actividad propia creada.")).toBeVisible();
  await page.getByRole("link", { name: "Ver actividad" }).click();
  await page.waitForURL(/\/actividades\/(?!nueva(?:\/|$))[^/?]+$/);
  await expect(
    page.getByRole("heading", { name: "Actividad propia E2E" }),
  ).toBeVisible();
  await expect(page.getByText("Ana Torres", { exact: true }).last()).toBeVisible();
});

test("Admin planifica y el responsable controla solamente la ejecución", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const title = "Plan Admin E2E";

  await login(page, "admin");
  await page.getByRole("link", { name: "Planificar actividad" }).click();
  await page.getByLabel("Operario responsable").selectOption({
    label: "Ana Torres",
  });
  await fillPlanning(page, title);
  await expect(page.getByLabel("Enlace del material")).toHaveCount(0);
  await page.getByRole("button", { name: "Planificar y asignar" }).click();
  await expect(
    page.getByText("Actividad planificada y asignada."),
  ).toBeVisible();
  await page.getByRole("link", { name: "Ver actividad" }).click();
  await page.waitForURL(/\/actividades\/(?!nueva(?:\/|$))[^/?]+$/);
  const activityPath = new URL(page.url()).pathname;
  await expect(page.getByRole("link", { name: "Editar plan" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Iniciar" })).toHaveCount(0);

  await switchUser(page, "ana");
  await page.goto(activityPath);
  await page.getByRole("link", { name: "Actualizar entrega" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Actualizar ejecución",
      exact: true,
      level: 1,
    }),
  ).toBeVisible();
  await expect(page.getByLabel("Actividad o proyecto")).toHaveCount(0);
  await page
    .getByLabel("Enlace del material")
    .fill("https://onedrive.live.com/plan-admin-e2e");
  await page
    .getByLabel("Opinión opcional")
    .fill("Entrega preparada por la responsable.");
  await page.getByRole("button", { name: "Guardar ejecución" }).click();
  await expect(page.getByText("Ejecución actualizada.")).toBeVisible();

  await page.goto(activityPath);
  await page.getByRole("button", { name: "Iniciar" }).click();
  await expect(page.getByText("Actividad iniciada.")).toBeVisible();
  await page.getByRole("button", { name: "Entregar" }).click();
  await expect(page.getByText("Actividad entregada.")).toBeVisible();

  await switchUser(page, "admin");
  await page.goto(activityPath);
  await page
    .getByPlaceholder("Escribe un mensaje para el responsable")
    .fill("Revisión iniciada por Admin.");
  await page.getByRole("button", { name: "Enviar mensaje" }).click();
  await expect(page.getByText("ENTREGA BLOQUEADA")).toBeVisible();
  await expect(page.getByText("Revisión iniciada por Admin.")).toBeVisible();
  const editAdminMessage = page.getByRole("button", { name: "Editar" });
  await editAdminMessage.focus();
  await expect(editAdminMessage).toBeFocused();
  await page.keyboard.press("Enter");
  await page.getByLabel("Editar mensaje").fill("Revisión activa por Admin.");
  await page.getByRole("button", { name: "Guardar mensaje" }).click();
  await expect(page.getByText("Revisión activa por Admin.")).toBeVisible();

  await page.getByRole("link", { name: "Editar plan" }).click();
  await expect(page.getByLabel("Actividad o proyecto")).toBeEnabled();
  await expect(page.getByLabel("Enlace del material")).toHaveCount(0);
  await page.getByLabel("Lugar o referencia").fill("Lima actualizada");
  await page.getByRole("button", { name: "Guardar planificación" }).click();
  await expect(page.getByText("Planificación actualizada.")).toBeVisible();

  await switchUser(page, "ana");
  await page.goto(activityPath);
  await page
    .getByPlaceholder("Escribe un mensaje para el responsable")
    .fill("Respuesta privada de Ana.");
  await page.getByRole("button", { name: "Enviar mensaje" }).click();
  await expect(page.getByText("Respuesta privada de Ana.")).toBeVisible();
  await page.getByRole("button", { name: "Editar" }).click();
  await page.getByLabel("Editar mensaje").fill("Respuesta corregida de Ana.");
  await page.getByRole("button", { name: "Guardar mensaje" }).click();
  await expect(page.getByText("Respuesta corregida de Ana.")).toBeVisible();
  await page.getByRole("button", { name: "Eliminar" }).click();
  await expect(page.getByText("Respuesta corregida de Ana.")).toHaveCount(0);
  await page.getByRole("link", { name: "Actualizar entrega" }).click();
  await expect(page.getByLabel("Enlace del material")).toBeDisabled();
  await expect(page.getByLabel("Opinión opcional")).toBeDisabled();
});

test("Admin da de baja y restaura desde una Papelera aislada", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const title = "Actividad Papelera E2E";
  const reason = "Duplicado confirmado durante la verificación E2E";

  await login(page, "admin");
  await page.getByRole("link", { name: "Planificar actividad" }).click();
  await page.getByLabel("Operario responsable").selectOption({
    label: "Ana Torres",
  });
  await fillPlanning(page, title);
  await page.getByRole("button", { name: "Planificar y asignar" }).click();
  await page.getByRole("link", { name: "Ver actividad" }).click();
  await page.waitForURL(/\/actividades\/(?!nueva(?:\/|$))[^/?]+$/);
  const activityPath = new URL(page.url()).pathname;

  await page.getByText("Administrar registro").click();
  await page.getByPlaceholder("Motivo de la baja (obligatorio)").fill(reason);
  await page.getByRole("button", { name: "Dar de baja" }).click();
  await expect(page).toHaveURL(/\/papelera$/);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByText(reason, { exact: true })).toBeVisible();

  await switchUser(page, "ana");
  await page.goto("/papelera");
  await expect(page).toHaveURL(/\/sin-acceso$/);
  await page.goto(activityPath);
  await expect(page.getByText("Actividad no encontrada.")).toBeVisible();

  await switchUser(page, "admin");
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/papelera");
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  const restoreButton = page.getByRole("button", {
    name: "Restaurar actividad",
  });
  await restoreButton.focus();
  await expect(restoreButton).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Actividad restaurada.")).toBeVisible();
  await expect(page.getByRole("heading", { name: title })).toHaveCount(0);

  await page.goto(activityPath);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
});

test("el Histórico responde en cuatro viewports", async ({ page }) => {
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
    const monthBox = async (name: string) =>
      page
        .getByRole("heading", { name, exact: true })
        .locator("xpath=ancestor::section[1]")
        .boundingBox();
    const january = await monthBox("ENERO");
    const february = await monthBox("FEBRERO");
    const march = await monthBox("MARZO");
    const april = await monthBox("ABRIL");
    const may = await monthBox("MAYO");
    if (!january || !february || !march || !april || !may) {
      throw new Error("No se pudo medir la rejilla del Histórico");
    }
    if (viewport.width < 768) {
      expect(Math.abs(january.x - february.x)).toBeLessThan(3);
      expect(february.y).toBeGreaterThan(january.y);
    } else if (viewport.width < 1280) {
      expect(Math.abs(january.y - february.y)).toBeLessThan(3);
      expect(march.y).toBeGreaterThan(january.y);
    } else {
      expect(Math.abs(january.y - april.y)).toBeLessThan(3);
      expect(may.y).toBeGreaterThan(january.y);
    }
    await page.screenshot({
      fullPage: true,
      path: `.verificacion/current-historico-${viewport.width}.png`,
    });
  }
});

test("el Histórico navega por año y devuelve el foco del detalle móvil", async ({
  page,
}) => {
  await login(page, "admin");
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto("/historico?anio=2025");
  await expect(
    page.getByRole("heading", { name: "Histórico 2026" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Año anterior" }),
  ).toBeDisabled();

  await page.getByRole("link", { name: "Año siguiente" }).click();
  await expect(page).toHaveURL(/\/historico\?anio=2027$/);
  await expect(
    page.getByRole("heading", { name: "Histórico 2027" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Año anterior" }),
  ).toHaveAttribute("href", "/historico?anio=2026");

  await page.goto("/historico?anio=2099");
  await expect(
    page.getByRole("status").filter({
      hasText: "No hay actividades registradas en 2099.",
    }),
  ).toBeVisible();

  await page.goto("/historico?anio=2026");
  const day = page.getByRole("button", {
    name: /4 de enero: Grabación, Cobertura audiovisual Norte/i,
  });
  await day.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", {
    name: "Cobertura audiovisual Norte",
  });
  await expect(dialog).toBeVisible();
  const close = dialog.getByRole("button", { name: "Cerrar detalle" });
  await expect(close).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe(
    "hidden",
  );
  const material = dialog.getByRole("link", { name: "Abrir material ↗" });
  await page.keyboard.press("Tab");
  await expect(material).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(day).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
});
