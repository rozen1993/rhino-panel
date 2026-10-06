import { test, expect, type Page } from "@playwright/test";
import { resolve } from "node:path";
import type { SimulatedActivity } from "../lib/activity-simulation";

const captures = resolve("../docs/implementacion-calendario-panel-carga-2026-10-01");
async function login(page: Page) {
  await page.goto("/acceso");
  await page.getByRole("listitem").filter({hasText:"Marco Admin"}).getByRole("button",{name:"Ingresar"}).click();
  await page.locator("#usuario").fill("admin");
  await page.locator("#clave").fill("admin2026");
  await page.getByRole("button",{name:"Entrar",exact:true}).click();
  await page.waitForURL(url=>url.pathname!=="/acceso");
}
const fixtures: SimulatedActivity[] = ["Cobertura de jornada institucional", "Entrevistas y tomas de apoyo", "Registro de instalaciones"].map((title,i)=>({
  id:`approved-visual-${i}`, title, type:"Grabación", responsible:"Ana Torres", responsibleAccountId:"account-ana",
  status:"En proceso", origin:"operario", classification:i===0?"special":i===1?"standard":null,
  spans:[{start:i===2?"2026-04-21":"2026-04-12",end:i===2?"2026-04-21":"2026-04-12",place:"Sede de demostración"}],
  place:"Sede de demostración",description:"Registro audiovisual de la jornada. Información sintética para verificar el diseño.",
  materialLink:"",operatorOpinion:"",createdByAccountId:"account-admin",createdByRoleId:"admin",createdAt:"2026-04-01T12:00:00Z",
  updatedAt:"2026-04-01T12:00:00Z",referenceLink:"",version:1,detailHydration:"complete",thread:[],audit:[],
}));

for (const width of [1440,390]) test(`diseños aprobados, teclado y meses estáticos ${width}`, async ({page,browser})=>{
  await page.setViewportSize({width,height:1000});
  await page.route("**/*",r=>new URL(r.request().url()).hostname==="localhost"?r.continue():r.abort());
  const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
  await login(page);
  // Fresh isolated demo browser only; no user database or live API.
  await page.evaluate(data=>localStorage.setItem("rhino:actividades-simuladas:v4",JSON.stringify(data)),fixtures);
  await page.goto("/historico?anio=2026&tipo=grabacion");
  const month=page.getByRole("region",{name:"ABRIL",exact:true});
  await expect(month).toContainText("3 trabajos");
  const style=()=>month.evaluate(el=>{const s=getComputedStyle(el);return [s.borderColor,s.boxShadow,s.transform];});
  const before=await style();await month.hover();expect(await style()).toEqual(before);
  expect(await page.getByRole("region",{name:"DICIEMBRE",exact:true}).count()).toBe(1);
  const day=month.getByRole("button",{name:/12 de abril/});
  await expect(day).toContainText("×2");
  await expect(day).not.toContainText("◆");
  await day.focus();await page.keyboard.press("Enter");
  await expect(day).toHaveAttribute("aria-pressed","true");
  await page.screenshot({path:resolve(captures,`calendario-01-${width}.png`),fullPage:false});
  if(width<768) {
    await page.keyboard.press("Escape");
    await month.screenshot({path:resolve(captures,`calendario-01-mes-${width}.png`)});
  }
  await page.getByRole("combobox",{name:"Clasificación",exact:true}).selectOption("standard");
  await expect(month).toContainText("2 trabajos"); // includes the legacy unmarked activity
  await expect(month.getByRole("button",{name:/12 de abril/})).not.toContainText("×2");
  await expect(month.getByRole("button",{name:/12 de abril/})).toContainText("×1");
  await page.goto("/actividades?periodo=2026-04");
  await expect(page.getByRole("button",{name:"Mostrar abr de 2026: 3 actividades"}).filter({visible:true})).toBeVisible();
  await expect(page.getByRole("img",{name:"Actividad especial"}).first()).toBeVisible();
  await expect(page.getByText("Estándar",{exact:true})).toHaveCount(0);
  await expect(page.getByRole("heading",{name:/Cobertura de jornada institucional/}).first()).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:resolve(captures,`actividades-01-${width}.png`),fullPage:true});
  // Disable script completion only in this test context to hold the REAL streamed
  // fallback for a screenshot. Production never has artificial loading delays.
  const context=await browser.newContext({storageState:await page.context().storageState(),javaScriptEnabled:false,viewport:{width,height:1000},reducedMotion:"reduce"});
  try {
    const loading=await context.newPage();
    await loading.route("**/*",r=>new URL(r.request().url()).hostname==="localhost"?r.continue():r.abort());
    await loading.goto("http://localhost:3100/contrato");
    const indicator=loading.getByRole("status",{name:"Abriendo tu contrato"}).first();
    await expect(indicator).toBeVisible();
    await expect(indicator).not.toContainText("%");
    await expect(indicator.getByRole("heading")).toHaveCount(0);
    await expect(indicator).toContainText("Puedes seguir usando el menú.");
    const skeleton=indicator.locator('[data-loading-skeleton="cards"]');
    await expect(skeleton).toHaveAttribute("aria-hidden","true");
    expect(await skeleton.locator(':scope > div').count()).toBe(6);
    expect(await skeleton.evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(" ").length)).toBe(width<600?1:3);
    expect(await indicator.evaluate(el=>Boolean(el.closest('#contenido-principal main')))).toBe(true);
    expect(await indicator.locator('[aria-hidden="true"], [aria-hidden="true"] span').evaluateAll(elements=>elements.every(el=>getComputedStyle(el).animationName==="none"))).toBe(true);
    expect(await loading.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await loading.screenshot({path:resolve("../docs/implementacion-carga-01-2026-10-03",`carga-01-${width}.png`),fullPage:false});
    await loading.setViewportSize({width:320,height:900});
    expect(await loading.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  } finally { await context.close(); }
  expect(errors).toEqual([]);
});
