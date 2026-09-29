// Render de documentos y comprobación aislada de acceso. No modifica cuentas o datos.
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {dirname,resolve} from 'node:path';
const dir=dirname(fileURLToPath(import.meta.url));
const require=createRequire(resolve(dir,'../../frontend/package.json'));
const {chromium}=require('playwright');
const browser=await chromium.launch();
try{
 const context=await browser.newContext({locale:'es-PE',reducedMotion:'reduce'});
 await context.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const view of ['todas','1','2','3','4','5']){
  for(const width of view==='todas'?[1320]:[1320,390]){
   await page.setViewportSize({width,height:1000});const url=pathToFileURL(resolve(dir,'index.html'));url.searchParams.set('vista',view);await page.goto(url.href);await page.evaluate(()=>document.fonts.ready);await page.locator('body').evaluate(el=>el.classList.add('capture'));
   if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Overflow '+view+' '+width);
   const name=view==='todas'?'00-comparativa.png':`0${view}-${width===390?'movil':'escritorio'}.png`;
   await page.screenshot({path:resolve(dir,name),fullPage:true});console.log(name);
   if(view!=='todas'){await page.getByRole('button',{name:/Estándar/}).click();if(await page.locator('.choice[aria-pressed="true"]').count()!==1)throw Error('Selection failed');}
  }
 }
 if(errors.length)throw Error(errors.join('\n'));
 await context.close();
 const local=await browser.newContext({viewport:{width:1440,height:900}});
 await local.route('**/*',r=>['localhost','127.0.0.1'].includes(new URL(r.request().url()).hostname)?r.continue():r.abort());
 const access=await local.newPage();await access.goto('http://localhost:3000/acceso');
 const aunor=access.getByRole('listitem').filter({hasText:'Aunor'});await aunor.getByRole('button',{name:'Ingresar'}).waitFor();
 console.log('PASS Aunor exists in fresh local browser; card bounds: '+JSON.stringify(await aunor.boundingBox()));
 await access.screenshot({path:resolve(dir,'acceso-local-aunor.png'),fullPage:true});
 await aunor.getByRole('button',{name:'Ingresar'}).click();await access.locator('#usuario').fill('aunor');await access.locator('#clave').fill('aunor2026');await access.getByRole('button',{name:'Entrar',exact:true}).click();await access.waitForURL('**/aunor');
 await access.getByRole('link',{name:'Contrato',exact:true}).first().waitFor();console.log('PASS Aunor demo login and client navigation. No business records changed.');
 await local.close();
}finally{await browser.close();}
