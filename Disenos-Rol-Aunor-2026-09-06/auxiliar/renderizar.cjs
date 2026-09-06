/* Maquetas offline. No importa aplicación, Auth, sesiones, datos o servicios. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {pathToFileURL} = require('node:url');
const {createRequire} = require('node:module');
const root = path.dirname(__dirname);
const repo = path.dirname(root);
const deps = createRequire(path.join(repo, 'frontend/package.json'));
const {chromium} = deps('playwright');
const {scenes, build} = require('./maquetas.cjs');
const requested = process.argv[2] || 'borrador-01';
if (!/^borrador-\d{2}$/.test(requested)) throw Error('Usa un borrador nuevo numerado.');
const out = path.join(__dirname, requested);
if (fs.existsSync(out)) throw Error('No se sobrescribe un borrador anterior: '+out);
fs.mkdirSync(out);
const base = fs.readFileSync(path.join(__dirname, 'estilos-aprobados.css'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, 'maquetas.css'), 'utf8');
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const save = (p, data) => fs.writeFileSync(p, data, {flag:'wx'});
async function run() {
 const browser = await chromium.launch({channel:'chrome', headless:true});
 const results=[];
 try {
  for (const [i,scene] of scenes.entries()) {
   for (const mobile of [false,true]) {
    const name=String(i+1).padStart(2,'0')+'-'+scene.id+'-'+(mobile?'movil':'escritorio');
    const html='<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src data:; font-src \'none\'; script-src \'none\'; connect-src \'none\'; form-action \'none\'"><title>Maqueta · '+scene.title+'</title><style>'+base+'\n'+css+'</style></head><body>'+build(scene,mobile)+'</body></html>';
    const htmlPath=path.join(out,name+'.html');save(htmlPath,html);
    const ctx=await browser.newContext({viewport:{width:mobile?390:1366,height:mobile?844:1000},deviceScaleFactor:mobile?2:1.5,locale:'es-PE',timezoneId:'America/Lima'});
    await ctx.setOffline(true);
    let blocked=0;await ctx.route('**/*',r=>{if(r.request().url().startsWith('file:'))return r.continue();blocked++;return r.abort();});
    const page=await ctx.newPage(), errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(pathToFileURL(htmlPath).href,{waitUntil:'load'});
    await page.evaluate(()=>document.fonts.ready);
    const stats=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,months:document.querySelectorAll('[data-month]').length,services:document.querySelectorAll('[data-service]').length,text:document.body.innerText,clientNav:[...document.querySelectorAll('[data-client-nav] a')].map(x=>x.innerText),header:document.querySelector('.mock-header').getBoundingClientRect().height,brokenImages:[...document.images].filter(x=>!x.complete||!x.naturalWidth).length,overflowing:[...document.querySelectorAll('main *')].filter(x=>x.getBoundingClientRect().right>innerWidth+1).slice(0,8).map(x=>x.className)}));
    if(stats.scrollWidth>stats.width)throw Error(name+' tiene desborde horizontal: '+JSON.stringify(stats.overflowing));
    if(scene.id==='calendario'&&stats.months!==12)throw Error('Faltan meses');
    if(scene.id==='lo-acordado'&&stats.services!==12)throw Error('Faltan servicios');
    if(!scene.admin&&/Burson|Papelera|Auditoría|Opinión del operario|Conversación interna|Cuentas/.test(stats.text))throw Error('Contenido interno en cliente '+name);
    if(/Pedir (un )?trabajo|Aprobar pago|Reabrir actividad/.test(stats.text))throw Error('Acción fuera de alcance');
    if(!stats.text.includes('EJEMPLOS FICTICIOS'))throw Error('Falta aviso de maqueta');
    if(stats.header!==72||errors.length||stats.brokenImages)throw Error('Fallo visual '+name);
    const pngPath=path.join(out,name+'.png');await page.screenshot({path:pngPath,fullPage:true,animations:'disabled'});
    results.push({name,scene:scene.id,mobile,title:scene.title,hash:sha(fs.readFileSync(pngPath)),...stats,errors,blocked});
    console.log(name+' OK '+stats.width+'x'+stats.height);
    await ctx.close();
   }
  }
  save(path.join(out,'verificacion.json'),JSON.stringify({note:'Comprobaciones estáticas de maquetas; no validan permisos ni funcionamiento de la aplicación.',generatedAt:new Date().toISOString(),cssHash:sha(base),results},null,2));
 } finally {await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
