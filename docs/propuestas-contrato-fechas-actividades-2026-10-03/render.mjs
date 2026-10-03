import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const root=dirname(fileURLToPath(import.meta.url));
const require=createRequire(resolve(root,'../../frontend/package.json'));
const {chromium}=require('playwright');
const browser=await chromium.launch();
const shots=resolve(root,'png');await mkdir(shots,{recursive:true});
const cases=[...Array.from({length:3},(_,i)=>({name:`fechas-0${i+1}`,query:`vista=fechas&opcion=${i+1}`})),...Array.from({length:4},(_,i)=>({name:`actividades-0${i+1}`,query:`vista=actividades&opcion=${i+1}`})),...['admin','aunor'].map(role=>({name:`contrato-${role}`,query:`vista=contrato&rol=${role}`}))];
try{
 for(const width of [1600,390]){
  const context=await browser.newContext({viewport:{width,height:1050},reducedMotion:'reduce'});
  await context.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const item of cases){
   await page.goto(pathToFileURL(resolve(root,'index.html')).href+'?'+item.query);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,item.name+' overflow '+width);
   await page.screenshot({path:resolve(shots,`${item.name}-${width}.png`),fullPage:false});
   if(item.name==='actividades-01'&&width===390){
    await page.locator('[data-select="2"]').click();
    await page.screenshot({path:resolve(shots,'actividades-01-detalle-390.png'),fullPage:false});
   }
   if(item.name==='actividades-01'&&width===1600){
    await page.getByRole('button',{name:'Cobertura de encuentro de colaboradores',exact:true}).click();
    await page.evaluate(()=>window.scrollTo(0,260));
    const box=await page.locator('.sticky-preview').boundingBox();
    assert.ok(box&&box.y>=78&&box.y<130,'sticky should remain below header');
    await page.screenshot({path:resolve(shots,'actividades-01-desplazamiento-1600.png'),fullPage:false});
   }
   if(item.name==='actividades-02'){
    await page.keyboard.press('Escape');assert.equal(await page.locator('#drawer').count(),0);
    assert.equal(await page.evaluate(()=>document.activeElement.dataset.select),'2');
    await page.getByRole('button',{name:'Registro fotográfico de instalaciones',exact:true}).click();
    assert.equal(await page.getByRole('dialog').count(),1);
    assert.ok(await page.locator('#drawer-content').textContent().then(t=>t.includes('Registro fotográfico')));
   }
   if(item.name==='actividades-03'){
    await page.getByRole('button',{name:'Video de recomendaciones preventivas',exact:true}).click();
    assert.equal(await page.locator('.detail-row').count(),1);
    assert.ok(await page.locator('.inline-summary').textContent().then(t=>t.includes('Video de recomendaciones')));
   }
   if(item.name==='contrato-aunor'){
    assert.equal(await page.getByRole('button',{name:'Periodos y metas',exact:true}).count(),0);
    assert.equal(await page.getByText('Operario de muestra',{exact:false}).count(),0);
    assert.equal(await page.locator('.service').count(),6);
   }
  }
  assert.deepEqual(errors,[]);
  await context.close();
 }
 const context=await browser.newContext({viewport:{width:320,height:900}});
 await context.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());
 const page=await context.newPage();
 for(const item of cases){await page.goto(pathToFileURL(resolve(root,'index.html')).href+'?'+item.query);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,item.name+' overflow 320');}
 await context.close();
 console.log('PASS: 20 PNG; layouts 1600/390/320; sticky panel, drawer Escape and focus, inline selection, readonly contract; no external traffic in captures.');
}finally{await browser.close();}
