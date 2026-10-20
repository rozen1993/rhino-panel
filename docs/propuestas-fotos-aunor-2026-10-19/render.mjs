import {chromium} from '../../frontend/node_modules/playwright/index.mjs';
import {dirname,join,resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFile,writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
const root=dirname(fileURLToPath(import.meta.url));
const files=new Set(['index.html','propuestas.css','propuestas.js','assets/seguridad.png','assets/puente.png','assets/voluntariado.png']);
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png'};
const server=createServer(async(req,res)=>{const requested=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname).replace(/^\//,'')||'index.html';if(!files.has(requested)){res.writeHead(404);res.end();return;}try{res.setHeader('Content-Type',types[extname(requested)]);res.end(await readFile(resolve(root,requested)));}catch{res.writeHead(500);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;
try{
 browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1440,height:1040},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
 const labels=['01-fotos-para-redes','02-galeria-social','03-seleccion-editorial'];const checks=[];
 for(let option=1;option<=3;option++){
  await page.setViewportSize({width:1440,height:1040});await page.goto(`http://127.0.0.1:${server.address().port}/?op=${option}`);await page.evaluate(()=>document.fonts.ready);await page.locator('img[src]').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
  await page.screenshot({path:join(root,`${labels[option-1]}.png`),fullPage:true});
  await page.locator('[data-view]').first().click();if(!await page.locator('#viewer').isVisible())throw Error('La vista previa no abrió');await page.getByRole('button',{name:'Cerrar vista previa',exact:true}).click();
  await page.getByRole('textbox',{name:'Buscar actividad',exact:true}).fill('seguridad');const visible=await page.locator('[data-search]:visible').count();if(visible!== (option===2?2:1))throw Error(`Filtro incorrecto en propuesta ${option}`);await page.getByRole('textbox',{name:'Buscar actividad',exact:true}).fill('');
  if(option===3){await page.locator('[data-collection="1"]').click();if(!await page.locator('.editorial h2').getByText('Recorrido del puente').isVisible())throw Error('Selección incorrecta');await page.locator('[data-collection="0"]').click();}
  for(const width of [390,320]){await page.setViewportSize({width,height:1080});await page.evaluate(()=>scrollTo(0,0));const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);if(overflow)throw Error(`Desbordamiento: propuesta ${option}, ancho ${width}`);if(width===390)await page.screenshot({path:join(root,`${labels[option-1]}-movil.png`),fullPage:false});}
  checks.push({option,desktop:'1440x1040',mobile:[390,320],preview:'OK',search:'OK',overflow:false});
 }
 if(errors.length)throw Error(errors.join('\n'));
 await writeFile(join(root,'verificacion.json'),JSON.stringify({date:new Date().toISOString(),checks,pageErrors:errors},null,2)+'\n');console.log('Tres propuestas PNG de escritorio y móvil, navegación de ejemplo y filtros verificados.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
