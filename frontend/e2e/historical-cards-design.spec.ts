import { expect, test, type Page } from "@playwright/test";
import { resolve } from "node:path";
import type { SimulatedActivity } from "../lib/activity-simulation";

const captures = resolve("../docs/implementacion-tarjetas-historico-2026-10-05");
// Only fresh demo contexts on an isolated local build. Never user data or Supabase.
const fixtures: SimulatedActivity[] = [true, false].map((special, i) => ({
  id: `card-design-${i}`, title: special ? "Charla sobre seguridad · ejemplo" : "Registro de instalaciones · ejemplo",
  type: "Grabación", responsible: "Ana Torres", responsibleAccountId: "account-ana",
  status: "Entregada", classification: special ? "special" : "standard", recordingModes: ["Fotografía", "Video"],
  origin: "operario", spans: [{start:"2026-04-27",end:"2026-04-27",place:"Sede ficticia, Lima"}],
  place: "Sede ficticia, Lima", description: "Descripción de prueba: se conserva completa al abrir el detalle.",
  materialLink: "https://example.invalid/material", operatorOpinion: "Opinión sintética.",
  createdByAccountId:"account-admin",createdByRoleId:"admin",createdAt:"2026-04-01T12:00:00Z",
  updatedAt:"2026-04-27T12:00:00Z",referenceLink:"",version:1,detailHydration:"complete",thread:[],audit:[],
}));
async function login(page: Page, user: "admin" | "ana" | "aunor") {
  await page.goto("/acceso");
  const name = {admin:"Marco Admin",ana:"Ana Torres",aunor:"Aunor"}[user];
  await page.getByRole("listitem").filter({hasText:name}).getByRole("button",{name:"Ingresar"}).click();
  await page.locator("#usuario").fill(user); await page.locator("#clave").fill(`${user}2026`);
  await page.getByRole("button",{name:"Entrar",exact:true}).click();
  await page.waitForURL(url=>url.pathname!=="/acceso");
}
for (const user of ["admin","ana"] as const) for (const width of [1440,390]) {
  test(`tarjetas petróleo/lavanda: ${user} a ${width}px`, async({page})=>{
    await page.setViewportSize({width,height:1100});
    await page.route("**/*",r=>new URL(r.request().url()).hostname==="localhost"?r.continue():r.abort());
    await login(page,user);
    await page.evaluate(data=>localStorage.setItem("rhino:actividades-simuladas:v4",JSON.stringify(data)),fixtures);
    await page.goto("/historico?tipo=grabacion&anio=2026");
    await page.getByRole("button",{name:/^27 de abril:/}).click();
    const panel=width<768?page.getByRole("dialog").getByRole("complementary"):page.locator('aside[aria-labelledby="activity-detail-title-desktop"]');
    const cards=panel.getByRole("region",{name:"Actividades de esta fecha"});
    await expect(cards.getByRole("article")).toHaveCount(2);
    await expect(cards).not.toContainText(fixtures[0].description);
    const special=cards.getByRole("article").filter({hasText:fixtures[0].title});
    const normal=cards.getByRole("article").filter({hasText:fixtures[1].title});
    await expect(special.getByText("Entregada",{exact:true})).toHaveCSS("background-color","rgb(103, 70, 150)");
    await expect(special.getByRole("button",{name:/Ver detalles:/})).toHaveCSS("background-color","rgb(103, 70, 150)");
    await expect(normal.getByText("Entregada",{exact:true})).toHaveCSS("background-color","rgb(18, 75, 87)");
    await expect(normal.getByRole("button",{name:/Ver detalles:/})).toHaveCSS("background-color","rgb(18, 75, 87)");
    for (const card of [special, normal]) {
      const badge = card.getByText("Entregada", {exact:true});
      await expect(badge).toHaveCSS("height", "26px");
      await expect(badge).toHaveCSS("font-size", "10.5px");
    }
    const attributes=special.getByRole("list",{name:"Características de la actividad"});
    expect(await attributes.getByRole("listitem").evaluateAll(items=>new Set(items.map(li=>Math.round(li.getBoundingClientRect().top))).size)).toBe(1);
    await panel.screenshot({path:resolve(captures,`${user}-${width}-tarjetas.png`)});
    const action=special.getByRole("button",{name:/Ver detalles:/});
    await action.focus(); await page.keyboard.press("Enter");
    await expect(panel.getByText(fixtures[0].description,{exact:true})).toBeVisible();
    const back=panel.getByRole("button",{name:"Volver a las actividades del día"});
    await expect(back).toBeFocused(); await back.click(); await expect(action).toBeFocused();
    expect(await panel.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    if(width<768){await page.setViewportSize({width:320,height:1000});await page.evaluate(()=>document.documentElement.style.fontSize="200%");expect(await panel.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);}
  });
}
for(const width of [1440,390]) test(`Aunor: tarjetas y etiqueta compartida a ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:1100}); await login(page,"aunor");
  await page.goto("/aunor/historico?anio=2026&tipo=grabacion");
  await page.getByRole("button",{name:/^4 de enero:/}).click();
  const panel=width<768?page.getByRole("dialog").getByRole("complementary"):page.locator('aside[aria-labelledby]');
  const cards=panel.getByRole("region",{name:"Actividades de esta fecha"});
  await expect(cards.getByRole("article")).not.toHaveCount(0);
  await expect(cards).not.toContainText("Ana Torres");
  await expect(cards.getByText("Entregada",{exact:true}).first()).toHaveCSS("background-color","rgb(18, 75, 87)");
  await panel.screenshot({path:resolve(captures,`aunor-${width}-tarjetas.png`)});
  await page.goto("/aunor/actividades/cobertura-norte");
  await expect(page.locator('[data-activity-status="Entregada"]').first()).toHaveCSS("background-color","rgb(18, 75, 87)");
  await expect(page.locator('[data-activity-status="Entregada"]').first()).not.toHaveAttribute("data-compact", "true");
});
