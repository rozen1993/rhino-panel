import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const directory=dirname(fileURLToPath(import.meta.url));
const require=createRequire(resolve(directory,'../../frontend/package.json'));
const {chromium}=require('playwright');
const browser=await chromium.launch();
try {
 const context=await browser.newContext({locale:'es-PE',reducedMotion:'reduce'});
 await context.route('**/*',route=>route.request().url().startsWith('file:')?route.continue():route.abort());
 const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
 for(const option of [1,2,3])for(const view of ['contrato','reemplazo'])for(const width of view==='contrato'?[1440,390]:[1440]){
  const url=pathToFileURL(resolve(directory,'index.html'));url.searchParams.set('opcion',String(option));if(view==='reemplazo')url.searchParams.set('panel',view);
  await page.setViewportSize({width,height:1000});await page.goto(url.href);await page.evaluate(()=>document.fonts.ready);await page.locator('body').evaluate(el=>el.classList.add('capture'));
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error(`Overflow ${option}/${view}/${width}`);
  const name=`0${option}-${view==='reemplazo'?'reemplazo':width===390?'movil':'escritorio'}.png`;
  await page.screenshot({path:resolve(directory,name),fullPage:true});console.log(name);
  if(view==='contrato'){
   await page.getByRole('button',{name:'Guardar relación',exact:false}).click();await page.getByRole('status').getByText(/Simulación: relación contractual guardada/).waitFor();
   if(option===2)await page.getByRole('tab',{name:'Reemplazo',exact:true}).click();
   await page.getByRole('button',{name:option===3?'Registrar':'Registrar reemplazo',exact:true}).click();
   await page.getByRole('combobox',{name:/Actividad original/}).waitFor();
  }
 }
 if(errors.length)throw Error(errors.join('\n'));
 console.log('PASS: three layouts, responsive, local-only simulated actions, no JavaScript errors.');
} finally {await browser.close();}
