import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const dir=dirname(fileURLToPath(import.meta.url));
const require=createRequire(resolve(dir,'../../frontend/package.json'));
const {chromium}=require('playwright');
const browser=await chromium.launch();
try {
 const context=await browser.newContext({locale:'es-PE',reducedMotion:'reduce'});
 await context.route('**/*',route=>route.request().url().startsWith('file:')?route.continue():route.abort());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const revisionOnly=process.argv.includes('--revision-fechas');
 const cases=[{vista:1,tipo:'grabacion',prefix:'01'},{vista:1,tipo:'edicion',prefix:'01-edicion'},{vista:2,prefix:'02'},
   ...(revisionOnly?[]:[3,4,5].map(vista=>({vista,prefix:`0${vista}`})))];
 function urlFor(vista,tipo){
  const url=pathToFileURL(resolve(dir,'index.html'));url.searchParams.set('vista',String(vista));
  if(tipo)url.searchParams.set('tipo',tipo);return url.href;
 }
 for(const item of cases)for(const width of [1440,390]){
  await page.setViewportSize({width,height:1000});await page.goto(urlFor(item.vista,item.tipo));await page.evaluate(()=>document.fonts.ready);
  if(item.vista===1){
   assert.equal(await page.locator('input[type=date]').count(),1,'Solo una fecha por actividad');
   const dateLabel=item.tipo==='edicion'?'Fecha de entrega del proyecto':'Fecha de realización';
   assert.equal(await page.getByLabel(dateLabel,{exact:true}).inputValue(),'2026-04-17');
   assert.equal(await page.getByLabel('Fecha real de entrega',{exact:true}).count(),0);
   assert.equal(await page.locator('.choiceRow').count(),item.tipo==='grabacion'?1:0);
  }
  await page.locator('body').evaluate(el=>el.classList.add('capture'));
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error(`Overflow ${item.prefix}/${width}`);
  const filename=`${item.prefix}-${width===1440?'escritorio':'movil'}.png`;
  await page.screenshot({path:resolve(dir,filename),fullPage:true});console.log(filename);
 }
 // Verify the local selector for every service, including those without PNG variants.
 await page.goto(urlFor(1,'grabacion'));
 for(const tipo of ['edicion','locucion','creatividad','grabacion']){
  await Promise.all([
   page.waitForURL(url=>url.searchParams.get('tipo')===tipo),
   page.getByLabel('Tipo de servicio',{exact:true}).selectOption(tipo),
  ]);
  assert.equal(await page.locator('input[type=date]').count(),1);
  assert.equal(await page.getByLabel(tipo==='edicion'?'Fecha de entrega del proyecto':'Fecha de realización',{exact:true}).count(),1);
  assert.equal(await page.getByLabel('Fecha real de entrega',{exact:true}).count(),0);
  if(tipo!=='edicion')assert.equal(await page.getByText('Fecha de entrega del proyecto',{exact:true}).count(),0);
 }
 if(errors.length)throw Error(errors.join('\n'));
 console.log(`PASS: ${cases.length*2} PNG; una fecha en los cuatro servicios; sin red ni desbordamientos.`);
} finally {await browser.close();}
