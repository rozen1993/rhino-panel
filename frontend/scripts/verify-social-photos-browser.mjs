// Isolated demo UI only, no user database or production account access.
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import sharp from 'sharp';
const base='http://localhost:3130',out=resolve('../docs/implementacion-social-fotos-2026-10-21');
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
 assert.equal(await page.getByRole('button',{name:/Descargar muestra/}).count(),3);
 assert.equal(await page.getByText('Responsable',{exact:true}).count(),0);
 const downloading=page.waitForEvent('download');
 await page.getByRole('button',{name:/Descargar muestra/}).first().click();
 const download=await downloading;assert.match(download.suggestedFilename(),/ejemplo/);
 assert.equal(await download.failure(),null);
 for(const width of [1600,390]){
   await page.setViewportSize({width,height:width===390?844:1050});
   await page.getByRole('heading',{name:'Social',exact:true}).click();
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.screenshot({path:out+`/social-${width}.png`,fullPage:true});
   await page.getByRole('button',{name:'Ver muestra de Charla de seguridad vial'}).click();
   await page.getByRole('dialog').waitFor();await page.evaluate(()=>Promise.all([...document.images].map(img=>img.decode())));
   await page.screenshot({path:out+`/muestra-${width}.png`});
   await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);
 }
 const operatorContext=await browser.newContext(),operator=await operatorContext.newPage();
 operator.on('pageerror',e=>errors.push(e.message));
 await operator.goto(base+'/acceso');
 await operator.getByRole('listitem').filter({hasText:'Ana Torres'}).getByRole('button',{name:'Ingresar'}).click();
 await operator.locator('#usuario').fill('ana');await operator.locator('#clave').fill('ana2026');
 await operator.getByRole('button',{name:'Entrar',exact:true}).click();await operator.waitForURL(url=>url.pathname!=='/acceso');
 await operator.goto(base+'/actividades/nueva?editar=cobertura-norte');
 const input=operator.getByLabel('Foto para redes',{exact:true});await input.waitFor();
 assert.equal(await operator.locator('form form').count(),0);
 await input.setInputFiles({name:'grande.jpg',mimeType:'image/jpeg',buffer:Buffer.alloc(4*1024*1024+1)});
 await operator.getByRole('status').filter({hasText:'supera 4 MB'}).waitFor();
 const small=await sharp({create:{width:400,height:300,channels:3,background:'#123456'}}).png().toBuffer();
 await input.setInputFiles({name:'pequena.png',mimeType:'image/png',buffer:small});
 await operator.getByRole('status').filter({hasText:'resolución es insuficiente'}).waitFor();
 await input.setInputFiles({name:'danada.jpg',mimeType:'image/jpeg',buffer:Buffer.from('not a jpeg')});
 await operator.getByRole('status').filter({hasText:'No se pudo abrir'}).waitFor();
 const valid=await sharp({create:{width:1600,height:1000,channels:3,background:'#124b57'}}).jpeg().toBuffer();
 await input.setInputFiles({name:'foto-sintetica.jpg',mimeType:'image/jpeg',buffer:valid});
 await operator.getByRole('img',{name:'Vista previa de la foto seleccionada'}).waitFor();
 await operator.getByLabel('Descripción breve de la foto').fill('Imagen sintética de prueba aislada');
 assert.equal(await operator.getByRole('button',{name:'Guardar foto en Social'}).isDisabled(),true);
 for(const width of [1600,390]){
  await operator.setViewportSize({width,height:width===390?844:1050});
  assert.equal(await operator.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await operator.screenshot({path:out+`/entrega-${width}.png`,fullPage:true});
 }
 await operatorContext.close();
 assert.deepEqual(errors,[]);
 await writeFile(out+'/verificacion-visual.json',JSON.stringify({environment:'isolated demo, generated sample images',widths:[1600,390],overflow:false,pageErrors:errors,checks:['Social navigation','3 separate examples','no invented folder links','sample download succeeds','no responsible identity','image preview','Escape','operator delivery form, no nested forms','client rejects oversize, low resolution, corrupt images','local preview, demo upload disabled']},null,2));
 console.log('PASS Social desktop/mobile, 3 samples, dialog, no overflow or JS errors');
} finally {await browser.close();}
