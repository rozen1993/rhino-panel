const fs=require("node:fs"),path=require("node:path"),{pathToFileURL}=require("node:url"),{createRequire}=require("node:module");
const root=path.dirname(__dirname),repo=path.dirname(root),dep=createRequire(path.join(repo,"frontend/package.json")),{chromium}=dep("playwright");
const png=path.resolve(root,process.argv[2]||"png");
if(!png.startsWith(root+path.sep))throw Error("Destino fuera de carpeta de maquetas");
function save(file,data){if(fs.existsSync(file))throw Error("No se sobrescribe "+file);fs.writeFileSync(file,data);}
async function main(){
 const browser=await chromium.launch({channel:"chrome",headless:true});
 const results=[];
 async function capture(source,name,viewport,action){
  const ctx=await browser.newContext({viewport,deviceScaleFactor:viewport.width===390?2:1.5});
  await ctx.setOffline(true);await ctx.route("**/*",r=>r.request().url().startsWith("file:")?r.continue():r.abort());
  const page=await ctx.newPage();await page.goto(pathToFileURL(path.join(png,source+".html")).href);
  await page.evaluate(()=>document.fonts.ready);if(action)await action(page);
  const dest=path.join(png,name+".png");if(fs.existsSync(dest))throw Error("No overwrite");
  await page.screenshot({path:dest,fullPage:false,animations:"disabled"});
  results.push({file:name+".png",source:source+".html",viewport});await ctx.close();
 }
 await capture("12-coincidencias-movil","15-coincidencias-movil-detalle",{width:390,height:844},async page=>{
  await page.evaluate(()=>{const scroll=document.querySelector('[role="dialog"] > div');const target=document.querySelector("#activity-detail-title-mobile");scroll.scrollTop=target.offsetTop-95;});
  await page.addStyleTag({content:'[role="dialog"]:after{content:"DETALLE DESPLAZADO · EJEMPLO FICTICIO";position:fixed;top:calc(18vh + 12px);right:12px;background:#fff;padding:4px 8px;border:1px solid #8295a5;border-radius:4px;font:8px Consolas,monospace;color:#006f83;pointer-events:none}'});
 });
 await capture("07-historico-grabacion-escritorio","16-grabacion-movil-vista-inicial",{width:390,height:844});
 await capture("09-historico-edicion-escritorio","17-edicion-movil-vista-mayo",{width:390,height:844},async page=>{
  await page.evaluate(()=>{const may=[...document.querySelectorAll("h3")].find(x=>x.textContent==="MAYO");window.scrollTo(0,may.closest("section").getBoundingClientRect().top+window.scrollY-85);});
  await page.addStyleTag({content:'body:after{content:"VISTA DESPLAZADA A MAYO · MAQUETA";position:fixed;top:12px;left:12px;background:#fff;padding:8px 10px;border:1px dashed #8295a5;border-radius:4px;font:9px Consolas,monospace;color:#006f83}'});
 });
 const thumbs=[["A","Tarjetas enfrentadas","01-A-entrada-escritorio.png","02-A-entrada-movil.png"],["B","Díptico cinematográfico","03-B-entrada-escritorio.png","04-B-entrada-movil.png"],["C","Diagonal Rhino","05-C-entrada-escritorio.png","06-C-entrada-movil.png"]];
 const html='<!doctype html><html lang="es"><meta charset="utf-8"><title>Comparativa A/B/C · maquetas</title><style>*{box-sizing:border-box}body{margin:0;padding:42px;background:#f4f7f8;color:#10233f;font-family:"Segoe UI",Arial,sans-serif}header{display:flex;align-items:end;justify-content:space-between;border-bottom:1px solid #8295a5;padding-bottom:22px;margin-bottom:28px}h1{font-family:"Bahnschrift Condensed","Arial Narrow",sans-serif;font-size:38px;margin:5px 0}p{font-size:14px;color:#607389;margin:6px 0}.label{font:11px Consolas,monospace;letter-spacing:.1em;color:#006f83}main{display:grid;grid-template-columns:repeat(3,1fr);gap:26px}article{min-width:0}h2{font-family:"Bahnschrift SemiCondensed","Arial Narrow",sans-serif;font-size:24px;margin:0 0 16px}img{display:block;border:1px solid #8295a5;border-radius:6px;box-shadow:0 8px 20px #031d3612}.desktop{width:100%}.mobile{height:555px;width:auto;margin:22px auto 0}footer{margin-top:26px;padding-top:16px;border-top:1px solid #8295a5;font-size:12px;color:#607389}</style><header><div><div class="label">SISTEMA R · PROPUESTAS PARA APROBACIÓN</div><h1>Una interfaz. Tres entradas fotográficas.</h1><p>Grabación / Edición · mismos colores, navegación y calendarios de destino.</p></div><p>Fotografías ilustrativas<br>Sin cambios en la plataforma</p></header><main>'+thumbs.map(([v,t,d,m])=>'<article><h2>'+v+' · '+t+'</h2><img class="desktop" src="'+pathToFileURL(path.join(png,d)).href+'"><img class="mobile" src="'+pathToFileURL(path.join(png,m)).href+'"></article>').join("")+'</main><footer>Comparativa de composición. Abre los PNG individuales para leer textos y calendarios a resolución completa. En móvil, A conserva tarjetas, B usa un corte horizontal y C mantiene una costura diagonal.</footer></html>';
 save(path.join(png,"00-comparativa-entradas.html"),html);
 const ctx=await browser.newContext({viewport:{width:1920,height:1280},deviceScaleFactor:1});await ctx.setOffline(true);
 const page=await ctx.newPage();await page.goto(pathToFileURL(path.join(png,"00-comparativa-entradas.html")).href);await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:path.join(png,"00-comparativa-entradas.png"),fullPage:true});
 await ctx.close();await browser.close();save(path.join(png,"complementos-verificacion.json"),JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
