import {expect,test} from "@playwright/test";
import {resolve} from "node:path";
import type {SimulatedActivity} from "../lib/activity-simulation";

const captures=resolve("../docs/implementacion-vista-rapida-2026-10-06");
const fixtures:SimulatedActivity[]=[true,false].map((special,i)=>({
  id:`preview-design-${i}`,title:"Charla sobre seguridad",type:"Grabación",status:"Entregada",
  responsible:"Operario de ejemplo",responsibleAccountId:"account-ana",origin:"operario",classification:special?"special":"standard",
  spans:[{start:"2026-04-27",end:"2026-04-27",place:"Sede ficticia"}],place:"Sede ficticia",
  description:"Charla de seguridad a trabajadores. Ejemplo sintético.",materialLink:"https://example.invalid/material",operatorOpinion:"",
  createdByAccountId:"account-admin",createdByRoleId:"admin",createdAt:"2026-04-01T12:00:00Z",updatedAt:"2026-04-27T12:00:00Z",referenceLink:"",version:1,detailHydration:"complete",thread:[],audit:[],
}));

for(const width of [1440,390]) for(const special of [true,false])test(`fecha protagonista ${special?"especial":"normal"} a ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:950});
  await page.route("**/*",route=>new URL(route.request().url()).hostname==="localhost"?route.continue():route.abort());
  await page.goto("/acceso");
  await page.getByRole("listitem").filter({hasText:"Marco Admin"}).getByRole("button",{name:"Ingresar"}).click();
  await page.locator("#usuario").fill("admin");await page.locator("#clave").fill("admin2026");
  await page.getByRole("button",{name:"Entrar",exact:true}).click();await page.waitForURL(url=>url.pathname!=="/acceso");
  await page.evaluate(data=>localStorage.setItem("rhino:actividades-simuladas:v4",JSON.stringify(data)),[fixtures[special?0:1]]);
  await page.goto("/actividades?periodo=2026-04");
  if(width<1440) await page.getByRole("button",{name:"Vista rápida de Charla sobre seguridad",exact:true}).click();
  const preview=page.locator("[data-activity-preview]:visible");
  const color=special?"rgb(103, 70, 150)":"rgb(18, 75, 87)";
  await expect(preview.locator("time")).toHaveAttribute("datetime","2026-04-27");
  await expect(preview.getByRole("link",{name:"Abrir ficha completa"})).toHaveCSS("background-color",color);
  await expect(preview.getByText("Entregada",{exact:true})).toHaveCSS("background-color",color);
  await expect(preview.getByText("Entregada",{exact:true})).toHaveCSS("height","29px");
  await expect(preview.getByRole("img",{name:"Actividad especial"})).toHaveCount(special?1:0);
  await expect(preview.getByText("Estándar")).toHaveCount(0);
  await expect(preview.getByRole("link",{name:"Abrir material"})).toHaveAttribute("href","https://example.invalid/material");
  await preview.screenshot({path:resolve(captures,`${special?"especial":"estandar"}-${width}.png`)});
  await expect(preview.getByRole("link",{name:"Abrir ficha completa"})).toBeInViewport();
  expect(await preview.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
  if(width<1440){
    await page.setViewportSize({width:320,height:950});
    await page.evaluate(()=>document.documentElement.style.fontSize="200%");
    expect(await preview.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
    await expect(preview.getByRole("link",{name:"Abrir ficha completa"})).toBeInViewport();
    await page.keyboard.press("Escape");await expect(page.getByRole("dialog")).toHaveCount(0);
  }
});
