// Renderizador de artefactos PNG: solo archivos locales, sin sesiones reales.
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';
const directory=dirname(fileURLToPath(import.meta.url));
const require=createRequire(resolve(directory,'../../frontend/package.json'));
const {chromium}=require('playwright');
const revision2=process.argv.includes('--revision2');
const scenes=revision2?[['02-acciones-v2','acciones'],['06-historico-c','historico-c'],['07-historico-d','historico-d']]:[['01-modalidades','modalidades'],['02-acciones','acciones'],['03-confirmacion-papelera','confirmacion'],['04-historico-a','historico-a'],['05-historico-b','historico-b']];
const browser=await chromium.launch({headless:true});
const results=[];
try{
 for(const [size,width,height] of [['escritorio',1440,1080],['movil',390,844]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,locale:'es-PE',reducedMotion:'reduce'});
  await context.route('**/*',route=>route.request().url().startsWith('file:')?route.continue():route.abort());
  const page=await context.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  for(const [name,view] of scenes){
   const url=pathToFileURL(resolve(directory,'index.html'));url.searchParams.set('vista',view);
   if(size==='movil'&&view!=='confirmacion')url.searchParams.set('captura','pagina');
   await page.goto(url.href);await page.evaluate(()=>document.fonts.ready);
   await page.locator('img').evaluateAll(images=>Promise.all(images.map(img=>img.decode())));
   const measure=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,images:[...document.images].every(img=>img.naturalWidth>0)}));
   if(measure.scrollWidth>width||!measure.images||errors.length)throw Error(JSON.stringify({view,size,measure,errors}));
   const filename=`${name}-${size}.png`;
   await page.screenshot({path:resolve(directory,filename),fullPage:view!=='confirmacion'});
   if(revision2&&view==='acciones'){
    const alignment=await page.locator('.edit-command,.delete-command').evaluateAll(elements=>elements.map(el=>({align:getComputedStyle(el).justifyContent,height:el.getBoundingClientRect().height,icons:el.querySelectorAll('svg').length})));
    if(alignment.some(item=>item.align!=='center'||item.icons!==1)||Math.abs(alignment[0].height-alignment[1].height)>1)throw Error('Unbalanced management actions');
    if(size==='escritorio')await page.locator('.action-panel').screenshot({path:resolve(directory,'02-acciones-panel-v2.png')});
   }
   results.push({filename,...measure});
   console.log('PNG '+filename+' · '+measure.width+' × '+measure.height);
  }
  // Verify the visual checkbox is operable and reports the selection accurately.
  const modeUrl=pathToFileURL(resolve(directory,'index.html'));modeUrl.searchParams.set('vista','modalidades');
  await page.goto(modeUrl.href);await page.getByRole('checkbox',{name:'Vuelo con dron'}).check();
  if(await page.locator('.selection-count').textContent()!=='3 seleccionadas')throw Error('Selection preview failed');
  await context.close();
 }
 if(revision2){
  const qaContext=await browser.newContext({reducedMotion:'reduce'});
  await qaContext.route('**/*',route=>route.request().url().startsWith('file:')?route.continue():route.abort());
  const page=await qaContext.newPage();
  for(const width of [320,768,1024,1920]){
   await page.setViewportSize({width,height:1000});
   for(const view of ['acciones','historico-c','historico-d']){
    const url=pathToFileURL(resolve(directory,'index.html'));url.searchParams.set('vista',view);
    await page.goto(url.href);await page.evaluate(()=>document.fonts.ready);
    const geometry=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,titles:[...document.querySelectorAll('.film-body h2')].map(el=>({text:el.textContent,overflow:el.scrollWidth>el.clientWidth}))}));
    if(geometry.overflow||geometry.titles.some(title=>title.overflow))throw Error(JSON.stringify({view,width,geometry}));
   }
  }
  await qaContext.close();
  console.log('PASS: actions and historical proposals fit 320, 768, 1024 and 1920 px.');
 }
 await writeFile(resolve(directory,revision2?'verificacion-v2.json':'verificacion.json'),JSON.stringify({kind:'local-design-preview',noNetwork:true,applicationChanged:false,results},null,2)+'\n');
}finally{await browser.close();}
