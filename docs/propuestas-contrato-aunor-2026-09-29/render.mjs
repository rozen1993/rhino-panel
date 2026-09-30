import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const dir=dirname(fileURLToPath(import.meta.url));
const require=createRequire(resolve(dir,'../../frontend/package.json'));
const {chromium}=require('playwright');
const browser=await chromium.launch({headless:true});
const slugs=['panel-ejecutivo','tarjetas-por-servicio','matriz-mensual','expediente-de-contrato','linea-de-seguimiento'];
const failures=[];
const context=await browser.newContext({deviceScaleFactor:1,locale:'es-PE',timezoneId:'America/Lima'});
await context.route('**/*',route=>route.request().url().startsWith('file:')?route.continue():route.abort());
try{
  for(let i=1;i<=5;i++){
    const page=await context.newPage();
    page.on('pageerror',error=>failures.push(`Vista ${i}: ${error.message}`));
    for(const [label,width,height] of [['escritorio',1440,1100],['movil',390,844]]){
      await page.setViewportSize({width,height});
      await page.goto(pathToFileURL(resolve(dir,'index.html')).href+`?vista=${i}`);
      await page.evaluate(()=>document.fonts.ready);
      await page.screenshot({path:resolve(dir,`${String(i).padStart(2,'0')}-${slugs[i-1]}-${label}.png`),fullPage:label==='escritorio'});
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
      if(overflow)failures.push(`Vista ${i}, ${width}px: desbordamiento horizontal`);
    }
    for(const width of [320,768,1024,1920]){
      await page.setViewportSize({width,height:1000});
      if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))failures.push(`Vista ${i}, ${width}px: desbordamiento`);
    }
    await page.setViewportSize({width:1440,height:1100});
    await page.reload();
    const trigger=page.locator('[data-detail]').first();
    await trigger.click();
    if(!await page.locator('dialog[open]').isVisible())failures.push(`Vista ${i}: falta detalle`);
    await page.getByRole('button',{name:'Cerrar detalle',exact:true}).click();
    if(await page.locator('dialog[open]').count())failures.push(`Vista ${i}: no cierra detalle`);
    if(i!==3){
      const select=page.locator('select[data-month]');
      if(await select.count())await select.selectOption('1');
      else await page.locator('button[data-month="1"]').click();
      if(!await page.locator('#content').innerText().then(t=>t.includes('Mayo')||t.includes('MAYO')))failures.push(`Vista ${i}: selector de mes`);
    }
    await page.locator('[data-pending]').click();
    if(!await page.getByRole('heading',{name:'Trabajos por relacionar'}).isVisible())failures.push(`Vista ${i}: por relacionar`);
    await page.keyboard.press('Escape');
    await page.locator('[data-annual="0"]').click();
    if(!await page.getByRole('heading',{name:'Videos de resumen anual'}).isVisible())failures.push(`Vista ${i}: anual`);
    await page.keyboard.press('Escape');
    if(i===1||i===5){
      await page.locator('button[data-service="3"]').click();
      if(!await page.getByRole('heading',{name:'Sin entregas en este periodo'}).isVisible())failures.push(`Vista ${i}: estado vacío`);
    }
    if(i===4){
      const entry=page.locator('.dossier-item').nth(3);
      await entry.locator('summary').click();
      if(!await entry.getByRole('heading',{name:'Sin entregas en este periodo'}).isVisible())failures.push('Vista 4: acordeón sin entregas');
    }
    await page.setViewportSize({width:390,height:844});
    await page.locator('[data-annual="1"]').click();
    if(!await page.locator('dialog[open]').isVisible())failures.push(`Vista ${i}: detalle móvil`);
    await page.keyboard.press('Escape');
    await page.close();
    console.log(`Vista ${i}: PNG escritorio + móvil; responsive y navegación comprobados.`);
  }
  const overview=await context.newPage();
  await overview.setViewportSize({width:1920,height:1440});
  await overview.goto(pathToFileURL(resolve(dir,'comparativa.html')).href);
  await overview.screenshot({path:resolve(dir,'00-comparativa.png'),fullPage:true});
  if(failures.length)throw new Error(failures.join('\n'));
  console.log('OK: 10 PNG individuales + comparativa. Solo file://; ninguna conexión a la plataforma.');
}finally{await browser.close();}
