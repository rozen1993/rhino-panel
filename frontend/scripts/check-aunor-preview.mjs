// Read-only smoke on our isolated localhost preview. No persistent browser profile.
import { chromium } from "playwright";
const browser=await chromium.launch({headless:true});
try {
  for(const [user,path] of [["aunor","/aunor"],["admin","/actividades"]]) {
    const context=await browser.newContext();const page=await context.newPage();
    const faults=[];page.on("pageerror",e=>faults.push(e.message));
    await page.goto("http://127.0.0.1:3108/acceso");
    await page.getByRole("listitem").filter({hasText:user==="aunor"?"Aunor":"Marco Admin"}).getByRole("button",{name:"Ingresar"}).click();
    await page.locator("#usuario").fill(user);await page.locator("#clave").fill(user+"2026");
    await page.getByRole("button",{name:"Entrar",exact:true}).click();
    await page.waitForURL("http://127.0.0.1:3108"+path);
    if(user==="aunor") {
      for(const route of ["/aunor/acordado","/aunor/calendario","/aunor/mensajes"]) {
        await page.goto("http://127.0.0.1:3108"+route);
        if(await page.getByRole("alert").filter({hasText:/No se pudo|Error inesperado/}).count())throw Error("Preview failed at "+route);
      }
    }
    if(faults.length)throw Error(faults.join("\n"));
    console.log("PASS preview aislado: "+user+" sin errores de navegador.");await context.close();
  }
} finally {await browser.close();}
