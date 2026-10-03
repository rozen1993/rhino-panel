import {expect,test,type Page} from "@playwright/test";
import {resolve} from "node:path";
import type {SimulatedActivity} from "../lib/activity-simulation";

const captures=resolve("../docs/implementacion-contrato-actividades-2026-10-03");
async function login(page:Page,user:"admin"|"aunor"){
  await page.goto("/acceso");
  await page.getByRole("listitem").filter({hasText:user==="admin"?"Marco Admin":"Aunor"}).getByRole("button",{name:"Ingresar"}).click();
  await page.locator("#usuario").fill(user);await page.locator("#clave").fill(`${user}2026`);
  await page.getByRole("button",{name:"Entrar",exact:true}).click();await page.waitForURL(url=>url.pathname!=="/acceso");
}
const fixtures:SimulatedActivity[]=Array.from({length:24},(_,i)=>({
  id:`quick-preview-${i}`,title:`Cobertura sintética ${String(i+1).padStart(2,"0")}`,type:"Grabación",status:i%2?"Entregada":"En proceso",
  responsible:"Ana Torres",responsibleAccountId:"account-ana",origin:"operario",classification:i%4===0?"special":"standard",
  spans:[{start:"2026-04-12",end:"2026-04-12",place:"Sede de demostración"}],place:"Sede de demostración",
  description:"Ejemplo ficticio para verificar la consulta rápida sin alterar datos reales. ".repeat(i===23?30:1),materialLink:i%2?"https://example.invalid/material":"",operatorOpinion:"",
  createdByAccountId:"account-admin",createdByRoleId:"admin",createdAt:"2026-04-01T12:00:00Z",updatedAt:"2026-04-01T12:00:00Z",referenceLink:"",version:1,detailHydration:"complete",thread:[],audit:[],
}));
test.beforeEach(async({page})=>{await page.route("**/*",route=>new URL(route.request().url()).hostname==="localhost"?route.continue():route.abort());});
for(const width of [1600,1440,1024,390])test(`consulta rápida conserva contexto, foco y acceso a ficha ${width}`,async({page})=>{
  await page.setViewportSize({width,height:950});await login(page,"admin");
  // Only this fresh browser's synthetic demo storage, never user or remote DB.
  await page.evaluate(data=>localStorage.setItem("rhino:actividades-simuladas:v4",JSON.stringify(data)),fixtures);
  await page.goto("/actividades?periodo=2026-04");
  const title="Cobertura sintética 24";
  if(width>=1440){
    const row=page.getByRole("row").filter({hasText:title});await row.scrollIntoViewIfNeeded();
    const previousScroll=await page.evaluate(()=>scrollY);
    await row.getByText("Sede de demostración",{exact:true}).click();
    const preview=page.getByRole("complementary",{name:"Resumen de actividad"});
    await expect(preview.getByRole("heading",{name:title})).toBeVisible();
    await expect(preview.getByRole("link",{name:"Abrir ficha completa"})).toBeInViewport();
    const box=await preview.boundingBox();expect(box!.y).toBeGreaterThanOrEqual(0);expect(box!.y).toBeLessThan(100);
    expect(Math.abs(await page.evaluate(()=>scrollY)-previousScroll)).toBeLessThan(3);
    await row.getByRole("button",{name:title,exact:true}).focus();await page.keyboard.press("Enter");
    await expect(row.getByRole("button",{name:title,exact:true})).toHaveAttribute("aria-pressed","true");
    await page.screenshot({path:resolve(captures,`actividades-seguimiento-${width}.png`)});
    await preview.getByRole("link",{name:"Abrir ficha completa"}).click();
  }else{
    const trigger=width<768?page.getByRole("button",{name:`Vista rápida de ${title}`,exact:true}):page.getByRole("button",{name:title,exact:true});
    await trigger.scrollIntoViewIfNeeded();await trigger.click();
    const sheet=page.getByRole("dialog",{name:"Vista rápida de actividad"});
    await expect(sheet).toBeVisible();await expect(sheet.getByRole("link",{name:"Abrir ficha completa"})).toBeInViewport();
    await page.keyboard.press("Escape");await expect(sheet).toHaveCount(0);await expect(trigger).toBeFocused();
    const scroll=await page.evaluate(()=>scrollY);await page.keyboard.press("Enter");await expect(sheet).toBeVisible();
    await sheet.getByRole("button",{name:"Cerrar resumen"}).click();await expect(trigger).toBeFocused();expect(await page.evaluate(()=>scrollY)).toBe(scroll);
    await trigger.click();await page.screenshot({path:resolve(captures,`actividades-resumen-${width}.png`)});
    await sheet.getByRole("link",{name:"Abrir ficha completa"}).click();
  }
  await expect(page).toHaveURL(/\/actividades\/quick-preview-23\?volver=/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test("contrato compartido: mismo contenido, navegación cliente segura y controles exclusivos Admin",async({page})=>{
  await page.setViewportSize({width:1600,height:1000});await login(page,"admin");await page.goto("/contrato?mes=2026-04");
  const monthly=await page.getByRole("region",{name:"Servicios mensuales"}).innerText();
  await expect(page.getByRole("button",{name:"Periodos y metas"})).toBeVisible();
  await page.screenshot({path:resolve(captures,"contrato-admin.png"),fullPage:true});
  await page.getByRole("button",{name:"Periodos y metas"}).click();
  await expect(page.getByRole("region",{name:"Configuración de periodos"})).toBeVisible();
  await page.getByRole("button",{name:"Cerrar sesión",exact:true}).click();await login(page,"aunor");
  await page.goto("/aunor/contrato?mes=2026-04");
  await expect(page.getByLabel("Consultar mes")).toHaveValue("2026-04");
  expect(await page.getByRole("region",{name:"Servicios mensuales"}).innerText()).toBe(monthly);
  await expect(page.getByRole("button",{name:/Periodos y metas|Revisar excepciones|Guardar/})).toHaveCount(0);
  await expect(page.getByText("Responsable",{exact:true})).toHaveCount(0);
  await page.screenshot({path:resolve(captures,"contrato-aunor.png"),fullPage:true});
  await page.getByLabel("Consultar mes").fill("2026-05");await page.reload();
  await expect(page.getByLabel("Consultar mes")).toHaveValue("2026-05");
  for(const width of [320,390,768,1024]){await page.setViewportSize({width,height:950});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
});
