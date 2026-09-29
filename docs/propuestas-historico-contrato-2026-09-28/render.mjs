// Artefactos de diseno: exclusivamente file:// y datos sinteticos.
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {dirname,resolve} from 'node:path';
import {writeFile} from 'node:fs/promises';
const directory=dirname(fileURLToPath(import.meta.url));
const require=createRequire(resolve(directory,'../../frontend/package.json'));
const {chromium}=require('playwright');
const browser=await chromium.launch();const results=[];
const views=[['01-historico','historico'],['02-edicion','edicion'],['03-contrato-mensual','contrato'],['04-contrato-anual','anual'],['05-regularizacion','regularizar'],['08-ficha','ficha']];
try{
 const context=await browser.newContext({locale:'es-PE',reducedMotion:'reduce'});
 await context.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const [size,width,height] of [['escritorio',1600,1120],['movil',390,844]]){
  await page.setViewportSize({width,height});
  for(const [name,view] of views){
   const url=pathToFileURL(resolve(directory,'index.html'));url.searchParams.set('vista',view);await page.goto(url.href);await page.evaluate(()=>document.fonts.ready);
   const geometry=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight}));
   if(geometry.scrollWidth>width||errors.length)throw Error(JSON.stringify({view,geometry,errors}));
   await page.evaluate(()=>document.body.classList.add('capture'));
   const filename=`${name}-${size}.png`;await page.screenshot({path:resolve(directory,filename),fullPage:true});results.push({filename,...geometry});console.log(filename);
   if(view==='historico'){
    await page.getByRole('button',{name:'◆ Especial',exact:true}).click();if(await page.locator('.activity:visible').count()!==1)throw Error('Filter failed');
    if(size==='escritorio')await page.locator('.specialcard').screenshot({path:resolve(directory,'06-marcaje-detalle.png')});
   }
   if(view==='contrato'){
    await page.locator('[data-period="mayo"]').click();if(!(await page.locator('#score').innerText()).includes('15'))throw Error('Monthly example failed');
    if(size==='escritorio')await page.locator('.contractlayout > section').last().screenshot({path:resolve(directory,'07-contrato-excedente.png')});
   }
   if(view==='regularizar'){
    if(!await page.locator('#regularize').isDisabled())throw Error('Confirmation gate missing');await page.locator('#confirm').check();if(await page.locator('#regularize').isDisabled())throw Error('Confirmation not enabled');
   }
  }
 }
 for(const width of [320,768,1024,1920]){
  await page.setViewportSize({width,height:1000});for(const [,view] of views){const url=pathToFileURL(resolve(directory,'index.html'));url.searchParams.set('vista',view);await page.goto(url.href);if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Overflow '+view+' '+width);}
 }
 await writeFile(resolve(directory,'verificacion.json'),JSON.stringify({kind:'design-proposal-only',applicationChanged:false,remoteWrites:false,networkBlocked:true,additionalWidths:[320,768,1024,1920],results},null,2)+'\n');
 console.log('PASS: renders, responsive geometry and prototype interactions.');
}finally{await browser.close();}
