// Read-only measurement with ephemeral contexts, no user's Chrome profile.
import { chromium } from "playwright";
const browser = await chromium.launch({headless:true});
try {
  for (const port of [3108,3000]) {
    const context = await browser.newContext();
    const page = await context.newPage();
    for (let sample=0;sample<3;sample++) {
      await page.goto("http://127.0.0.1:"+port+"/acceso");
      console.log(JSON.stringify({port,route:"/acceso",sample,...await page.evaluate(()=>{
        const n=performance.getEntriesByType("navigation")[0];
        return {ttfb:Math.round(n.responseStart),dom:Math.round(n.domContentLoadedEventEnd)};
      })}));
    }
    if (port===3108) {
      await page.getByRole("listitem").filter({hasText:"Aunor"}).getByRole("button",{name:"Ingresar"}).click();
      await page.locator("#usuario").fill("aunor"); await page.locator("#clave").fill("aunor2026");
      await page.getByRole("button",{name:"Entrar",exact:true}).click();
      await page.waitForURL("**/aunor");
      for (const route of ["/aunor","/aunor/contrato","/aunor/calendario"]) {
        await page.goto("http://127.0.0.1:3108"+route);
        await page.evaluate(()=>document.fonts.ready);
        console.log(JSON.stringify({port,route,...await page.evaluate(()=>{
          const n=performance.getEntriesByType("navigation")[0];
          return {ttfb:Math.round(n.responseStart),dom:Math.round(n.domContentLoadedEventEnd),bytes:performance.getEntriesByType("resource").reduce((s,r)=>s+r.transferSize,0)};
        })}));
      }
    }
    await context.close();
  }
} finally { await browser.close(); }
