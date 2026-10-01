// Local documents only: network denied, no application sessions or real records.
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
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const group of ['calendario','actividades','carga'])for(const option of [1,2,3])for(const width of [1440,390]){
  await page.setViewportSize({width,height:1000});
  const url=pathToFileURL(resolve(dir,'index.html'));url.searchParams.set('grupo',group);url.searchParams.set('opcion',String(option));
  await page.goto(url.href);await page.evaluate(()=>document.fonts.ready);await page.locator('body').evaluate(el=>el.classList.add('capture'));
  if(errors.length)throw Error(errors.join('\n'));
  await page.locator('.workspace').waitFor();
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error(`Horizontal overflow ${group} ${option} ${width}`);
  const file=`${group}-0${option}${width===390?'-movil':''}.png`;
  await page.screenshot({path:resolve(dir,file),fullPage:true});console.log(file);
  if(width===1440){
   const detail=group==='calendario'?'.month[data-month="3"]':group==='actividades'?'table':'.loader-area';
   await page.locator(detail).screenshot({path:resolve(dir,`${group}-0${option}-detalle.png`)});
  }
  if(group==='calendario'){
   const month=page.locator('.month[data-month="3"]');
   const style=()=>month.evaluate(el=>{const s=getComputedStyle(el);return [s.transform,s.borderColor,s.boxShadow].join('|')});
   const before=await style();await month.locator('h2').hover();if(before!==await style())throw Error('Month hover changed');
   if(await page.locator('.day .specialmark,.day .historytag').count())throw Error('Classification on date');
   await page.getByRole('button',{name:'29 de Abril, 1 actividad',exact:true}).click();
   if(await page.locator('#chosen-day').textContent()!=='29 de abril')throw Error('Date selection failed');
  }
  if(group==='actividades'){
   if(await page.locator('tbody .specialmark').count()!==2)throw Error('Special-only markers failed');
   if(await page.locator('tbody').textContent().then(t=>/Estándar|variado/i.test(t)))throw Error('Panel contains redundant labels or wrong location');
  }
 }
 await page.setViewportSize({width:1440,height:1000});await page.goto(pathToFileURL(resolve(dir,'index.html')).href);await page.evaluate(()=>document.fonts.ready);
 await page.evaluate(()=>Promise.all([...document.images].map(img=>img.decode())));
 await page.screenshot({path:resolve(dir,'00-comparativa.png'),fullPage:true});
 if(errors.length)throw Error(errors.join('\n'));
 console.log('PASS 9 desktop + 9 mobile PNGs; static months, date selection, special-only markers, no horizontal overflow, no external requests');
}finally{await browser.close();}
