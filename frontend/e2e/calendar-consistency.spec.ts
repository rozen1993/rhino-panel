import { test, expect, type Page } from "@playwright/test";
import { resolve } from "node:path";
import type { SimulatedActivity } from "../lib/activity-simulation";

const captures = resolve("../docs/implementacion-calendarios-2026-10-05");
// Synthetic fixtures in each fresh demo browser only. No real database writes.
const fixtures: SimulatedActivity[] = (["Grabación", "Edición"] as const).flatMap(type =>
  [7, 10, 10, 27, 28, 28].map((day, index) => {
    const date = `2026-04-${String(day).padStart(2, "0")}`;
    return {
      id: `calendar-${type}-${index}`, title: `${type} de demostración ${index + 1}`, type,
      responsible: "Ana Torres", responsibleAccountId: "account-ana", status: "Entregada", origin: "operario",
      classification: index === 3 || index === 5 ? "special" : "standard",
      spans: [{ start: date, end: date, place: "Lima" }], deliveryDueOn: type === "Edición" ? date : null,
      place: "Lima", description: "Datos sintéticos para verificar el calendario y sus tarjetas.",
      materialLink: "https://example.invalid/material", operatorOpinion: "Ejemplo ficticio.",
      createdByAccountId: "account-admin", createdByRoleId: "admin", createdAt: "2026-04-01T12:00:00Z",
      updatedAt: "2026-04-01T12:00:00Z", referenceLink: "", version: 1, detailHydration: "complete", thread: [], audit: [],
    };
  }),
);

async function login(page: Page, user: "admin" | "ana") {
  await page.goto("/acceso");
  await page.getByRole("listitem").filter({hasText:user === "admin" ? "Marco Admin" : "Ana Torres"})
    .getByRole("button",{name:"Ingresar"}).click();
  await page.locator("#usuario").fill(user);
  await page.locator("#clave").fill(`${user}2026`);
  await page.getByRole("button",{name:"Entrar",exact:true}).click();
  await page.waitForURL(url => url.pathname !== "/acceso");
}

for (const user of ["admin", "ana"] as const) for (const width of [1440, 390]) {
  test(`calendarios uniformes y tarjetas de una actividad: ${user}, ${width}px`, async ({page}) => {
    await page.setViewportSize({width,height:1000});
    await page.route("**/*", route => new URL(route.request().url()).hostname === "localhost" ? route.continue() : route.abort());
    const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
    await login(page,user);
    await page.evaluate(data => localStorage.setItem("rhino:actividades-simuladas:v4", JSON.stringify(data)),fixtures);
    for (const category of ["grabacion", "edicion"]) {
      await page.goto(`/historico?anio=2026&tipo=${category}`);
      const month = page.getByRole("region",{name:"ABRIL",exact:true});
      await expect(month).toContainText("6 trabajos");
      const plain = month.getByRole("button",{name:/^7 de abril:/});
      const pair = month.getByRole("button",{name:/^10 de abril:/});
      const special = month.getByRole("button",{name:/^27 de abril:/});
      const mixed = month.getByRole("button",{name:/^28 de abril:/});
      await expect(plain).toContainText("×1");
      await expect(pair).toContainText("×2");
      await expect(special).toContainText("×1");
      await expect(mixed).toContainText("×2");
      await expect(plain).toHaveCSS("background-color","rgb(207, 242, 246)");
      await expect(pair).toHaveCSS("background-color","rgb(207, 242, 246)");
      await expect(special).toHaveCSS("background-color","rgb(233, 222, 250)");
      await expect(mixed).toHaveCSS("background-color","rgb(233, 222, 250)");
      const border = await month.evaluate(el => getComputedStyle(el).borderColor);
      await month.hover(); await expect(month).toHaveCSS("border-color",border);
      await plain.focus(); await page.keyboard.press("Enter");
      await expect(plain).toHaveAttribute("aria-pressed","true");
      await expect(plain).toHaveCSS("background-color","rgb(207, 242, 246)");
      const panel = width < 768 ? page.getByRole("dialog").getByRole("complementary") : page.locator('aside[aria-labelledby="activity-detail-title-desktop"]');
      const cards = panel.getByRole("region",{name:"Actividades de esta fecha"});
      await expect(cards.getByRole("article")).toHaveCount(1);
      await expect(cards).toContainText("1 actividad en esta fecha");
      await expect(panel.getByText("Estándar",{exact:true})).toHaveCount(0);
      const action = cards.getByRole("button",{name:/Ver detalles:/});
      await panel.screenshot({path:resolve(captures,`${category}-${user}-${width}-tarjeta.png`)});
      await action.click();
      const back = panel.getByRole("button",{name:"Volver a las actividades del día"});
      await expect(back).toBeFocused();
      await expect(panel.getByRole("link",{name:/Abrir material/})).toBeVisible();
      await expect(panel.getByText("Estándar",{exact:true})).toHaveCount(0);
      await back.click(); await expect(action).toBeFocused();
      await expect(cards.getByRole("article")).toHaveCount(1);
      if (width < 768) { await page.keyboard.press("Escape"); await expect(plain).toBeFocused(); }
      await mixed.click();
      await expect(cards.getByRole("article")).toHaveCount(2);
      await expect(cards.getByText("Especial",{exact:true})).toHaveCount(1);
      await expect(cards.getByText("Estándar",{exact:true})).toHaveCount(0);
      await expect(mixed).toHaveCSS("background-color","rgb(233, 222, 250)");
      await panel.screenshot({path:resolve(captures,`${category}-${user}-${width}-mixta.png`)});
      if (width < 768) await page.keyboard.press("Escape");
      await month.screenshot({path:resolve(captures,`${category}-${user}-${width}-mes.png`)});
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    expect(errors).toEqual([]);
  });
}
