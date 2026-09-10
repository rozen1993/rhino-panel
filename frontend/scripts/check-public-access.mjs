import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch();
try {
  for (const viewport of [{width:1440,height:900},{width:390,height:844}]) {
    const context = await browser.newContext({viewport});
    const page = await context.newPage();
    await page.goto('https://rhino-panel.vercel.app/acceso');
    for (const name of ['Admin','Cesar','Eduardo','Johann','Kiara','Martin','Aunor']) {
      await page.getByRole('button',{name:`Ingresar como ${name}`,exact:true}).click();
      await page.getByRole('dialog').waitFor();
      assert.equal(await page.locator('input[name="usuario"]').isVisible(),true);
      assert.equal(await page.locator('input[name="clave"]').getAttribute('type'),'password');
      await page.keyboard.press('Escape');
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.screenshot({path:`.verificacion/current-access-${viewport.width}.png`,fullPage:true});
    console.log(`PASS ${viewport.width}: siete tarjetas, formulario, Escape, sin desbordamiento`);
    await context.close();
  }
} finally { await browser.close(); }
