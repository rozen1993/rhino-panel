// Isolated demo UI only, no user database or production account access.
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const base='http://localhost:3130',out=resolve('../docs/implementacion-social-onedrive-2026-10-20');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true}),errors=[];
try {
 const context=await browser.newContext({viewport:{width:1600,height:1050}}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/acceso');
 await page.getByRole('listitem').filter({hasText:'Aunor'}).getByRole('button',{name:'Ingresar'}).click();
 await page.locator('#usuario').fill('aunor');await page.locator('#clave').fill('aunor2026');
 await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.waitForURL(url=>url.pathname==='/aunor');
 await page.getByRole('link',{name:'Social',exact:true}).click();
 await page.getByRole('heading',{name:'Social',exact:true}).waitFor();
 await page.getByRole('button',{name:'Ver muestra de Charla de seguridad vial'}).waitFor();
 await page.evaluate(()=>Promise.all([...document.images].map(img=>img.decode())));
 assert.equal(await page.getByRole('article').count(),3);
 assert.equal(await page.getByRole('button',{name:'Carpeta pendiente'}).count(),3);
 assert.equal(await page.getByText('Responsable',{exact:true}).count(),0);
 assert.equal(await page.getByRole('link',{name:/Descargar/}).count(),0);
 for(const width of [1600,390]){
   await page.setViewportSize({width,height:width===390?844:1050});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.screenshot({path:out+`/social-${width}.png`,fullPage:true});
   await page.getByRole('button',{name:'Ver muestra de Charla de seguridad vial'}).click();
   await page.getByRole('dialog').waitFor();await page.evaluate(()=>Promise.all([...document.images].map(img=>img.decode())));
   await page.screenshot({path:out+`/muestra-${width}.png`});
   await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);
 }
 assert.deepEqual(errors,[]);
 await writeFile(out+'/verificacion-visual.json',JSON.stringify({environment:'isolated demo, generated sample images',widths:[1600,390],overflow:false,pageErrors:errors,checks:['Social navigation','3 separate examples','no invented folder links','no download','no responsible identity','image preview','Escape']},null,2));
 console.log('PASS Social desktop/mobile, 3 samples, dialog, no overflow or JS errors');
} finally {await browser.close();}
