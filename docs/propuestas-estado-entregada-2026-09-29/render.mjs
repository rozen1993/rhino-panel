import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {dirname,resolve} from 'node:path';
const directory=dirname(fileURLToPath(import.meta.url));
const require=createRequire(resolve(directory,'../../frontend/package.json'));
const {chromium}=require('playwright');
const browser=await chromium.launch();
try {
 const context=await browser.newContext({locale:'es-PE',reducedMotion:'reduce',deviceScaleFactor:1});
 await context.route('**/*',route=>route.request().url().startsWith('file:')?route.continue():route.abort());
 const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
 for(const option of [0,1,2,3])for(const width of option?[1200,390]:[1440]){
  const url=pathToFileURL(resolve(directory,'index.html'));if(option)url.searchParams.set('opcion',String(option));
  await page.setViewportSize({width,height:900});await page.goto(url.href);await page.evaluate(()=>document.fonts.ready);
  await page.locator('body').evaluate(element=>element.classList.add('capture'));
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error(`Overflow: ${option}/${width}`);
  const file=option?`0${option}-${width===390?'movil':'escritorio'}.png`:'00-comparativa.png';
  await page.screenshot({path:resolve(directory,file),fullPage:true});console.log(file);
 }
 if(errors.length)throw Error(errors.join('\n'));
 console.log('PASS: 3 alternatives, desktop/mobile, no overflow or remote requests.');
} finally {await browser.close();}
