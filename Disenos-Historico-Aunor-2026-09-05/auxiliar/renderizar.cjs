/* Generador offline de maquetas. No importa servidor, sesión, Auth ni almacenes. */
const fs=require("node:fs");
const path=require("node:path");
const {pathToFileURL}=require("node:url");
const {createRequire}=require("node:module");
const crypto=require("node:crypto");
const aux=__dirname, outputRoot=path.dirname(aux), repo=path.dirname(outputRoot);
const deps=createRequire(path.join(repo,"frontend/package.json"));
const ts=deps("typescript"), React=deps("react");
const {renderToStaticMarkup}=deps("react-dom/server");
const {chromium}=deps("playwright");
const requested=process.argv[2]||"auxiliar/borrador-01";
const out=path.resolve(outputRoot,requested);
if(!out.startsWith(outputRoot+path.sep)) throw Error("Destino fuera de carpeta de maquetas");
fs.mkdirSync(out,{recursive:true});
function saveNew(file,content){if(fs.existsSync(file))throw Error("No se sobrescribe: "+file);fs.writeFileSync(file,content);}
function replaceOne(source,before,after){if(!source.includes(before))throw Error("Punto de adaptación ausente: "+before.slice(0,90));return source.replace(before,after);}
function moduleLoader(mock){
 const cache=new Map();
 const Link=({href,scroll,children,...props})=>React.createElement("a",{...props,href:"#",onClick:undefined},children);
 function load(spec){
  if(spec==="react"||spec==="react/jsx-runtime")return deps(spec);
  if(spec==="next/link")return {__esModule:true,default:Link};
  if(spec==="next/navigation")return {redirect(){throw Error("Redirección de app prohibida en maqueta");}};
  if(spec==="@/lib/session")return {currentRole(){throw Error("Sesión de app prohibida");}};
  if(spec==="@/app/acceso/actions")return {salir:undefined};
  if(spec==="@/lib/activity-simulation")return {useSimulatedActivities:()=>[],isOverdue:(item,today)=>item.status!=="Entregada"&&item.spans.map(s=>s.end).sort().at(-1)<today};
  let file;
  if(spec==="./maquetas")file=path.join(aux,"maquetas.tsx");
  else if(spec.startsWith("@/components/"))file=path.join(aux,"componentes",spec.slice(13)+".tsx");
  else if(spec.startsWith("@/lib/"))file=path.join(aux,"lib",spec.slice(6)+".ts");
  else throw Error("Import no autorizado: "+spec);
  if(cache.has(file))return cache.get(file).exports;
  if(!fs.existsSync(file))throw Error("Falta copia aislada: "+file);
  let source=fs.readFileSync(file,"utf8");
  if(file.endsWith("mobile-shell.tsx"))source=replaceOne(source,"export async function MobileShell","export function MobileShell");
  if(file.endsWith("top-bar.tsx"))source=replaceOne(source,"action={salir}","");
  if(file.endsWith("annual-calendar.tsx")&&!mock.baseline){
   source=replaceOne(source,"useState(false);","useState(Boolean(__mock.mobileDetail));");
   source=replaceOne(source,"visible[0] ? [visible[0].id] : [],","__mock.coincidences ? visible.map((item) => item.id) : (visible[0] ? [visible[0].id] : []),");
   source=replaceOne(source,"Archivo operativo · {visible.length} registros","Archivo operativo · {visible.length} {visible.length === 1 ? 'registro' : 'registros'} de ejemplo");
   source=replaceOne(source,"Abrir material ↗","Ver material · ejemplo ↗");
   source=replaceOne(source,"Histórico {year}","Histórico {year}<span className=\"mock-category-caption\">{__mock.categoryLabel}</span>");
   source=replaceOne(source,"Todas las actividades del año en una sola vista","{__mock.coincidences ? 'Misma fecha, actividades distintas. Selecciona una para ver sus jornadas.' : 'Todas las jornadas de ' + __mock.categoryLabel.toLowerCase() + ' del año en una sola vista.'}");
   source=replaceOne(source,"Object.entries(colors).map","Object.entries(colors).filter(([type]) => type === __mock.categoryLabel).map");
   source=replaceOne(source,"{choice.type} · {choice.title}","<span className=\"mock-choice-code\">{choice.id} · {choice.type}</span><span className=\"mock-choice-name\">{choice.title}</span><span className=\"mock-choice-meta\">{choice.responsible}<br/>{(choice as any).place}<br/>{formatActivitySpans(choice)}</span>");
   source=replaceOne(source,"<StatusPill status={item.status} />","<StatusPill status={item.status} /><p className=\"mock-record-id\">{item.id} · EJEMPLO FICTICIO</p>");
   source=replaceOne(source,'<dt className="data-label text-ink-muted">Origen</dt>','<dt className="data-label text-ink-muted">Lugar</dt><dd className="font-bold">{(item as any).place}</dd><dt className="data-label text-ink-muted">Origen</dt>');
  }
  const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const m={exports:{}};cache.set(file,m);
  new Function("require","module","exports","__mock",compiled)(load,m,m.exports,mock);
  return m.exports;
 }
 return load;
}
const role={id:"admin",label:"Admin",accountName:"Marco Admin"};
const photos={recording:pathToFileURL(path.join(outputRoot,"fotografias/grabacion-ilustrativa.png")).href,editing:pathToFileURL(path.join(outputRoot,"fotografias/edicion-ilustrativa.png")).href};
const baseCss=fs.readFileSync(path.join(aux,"estilos-aprobados.css"),"utf8");
const newCss=fs.readFileSync(path.join(aux,"maquetas.css"),"utf8");
const specs=[
 ...["A","B","C"].flatMap((variant,i)=>[
  {name:String(i*2+1).padStart(2,"0")+"-"+variant+"-entrada-escritorio",kind:"portal",variant},
  {name:String(i*2+2).padStart(2,"0")+"-"+variant+"-entrada-movil",kind:"portal",variant,mobile:true}
 ]),
 {name:"07-historico-grabacion-escritorio",kind:"history",categoryLabel:"Grabación"},
 {name:"08-historico-grabacion-movil-12-meses",kind:"history",categoryLabel:"Grabación",mobile:true},
 {name:"09-historico-edicion-escritorio",kind:"history",categoryLabel:"Edición"},
 {name:"10-historico-edicion-movil-12-meses",kind:"history",categoryLabel:"Edición",mobile:true},
 {name:"11-coincidencias-escritorio",kind:"history",categoryLabel:"Grabación",coincidences:true},
 {name:"12-coincidencias-movil",kind:"history",categoryLabel:"Grabación",coincidences:true,mobile:true,mobileDetail:true},
 {name:"13-aunor-escritorio",kind:"aunor"},
 {name:"14-aunor-movil",kind:"aunor",mobile:true},
];
function build(spec){
 const load=moduleLoader(spec);
 const {MobileShell}=load("@/components/mobile-shell");
 const {Portal,Aunor,EvidenceBanner,demoActivities,coincidentActivities}=load("./maquetas");
 let content;
 if(spec.kind==="portal")content=React.createElement(Portal,{variant:spec.variant,photos});
 else if(spec.kind==="aunor")content=React.createElement(Aunor);
 else {
  const {AnnualCalendar}=load("@/components/annual-calendar");
  content=React.createElement("main",{className:"mx-auto max-w-[1700px] p-3 md:p-5 xl:p-6"},
   React.createElement(EvidenceBanner,{text:"Datos ficticios · no son registros de la aplicación"}),
   React.createElement("div",{className:"mock-history-tools"},React.createElement("a",{href:"#"},"← Cambiar categoría"),React.createElement("span",null,spec.coincidences?"4 de enero · tres actividades de ejemplo":"Filtro: "+spec.categoryLabel+" · Ver todo el Histórico")),
   React.createElement(AnnualCalendar,{dataSource:"supabase",initialActivities:spec.coincidences?coincidentActivities:demoActivities.filter(a=>a.type===spec.categoryLabel),year:2026,today:"2026-09-05"})
  );
 }
 const body=renderToStaticMarkup(React.createElement(MobileShell,{role,active:spec.kind==="aunor"?"Actividades":"Histórico"},content));
 return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Maqueta Sistema R · '+spec.name+'</title><style>'+baseCss+'\n'+newCss+'</style></head><body>'+body+'<script>document.addEventListener("submit",e=>e.preventDefault());document.addEventListener("click",e=>{if(e.target.closest("a,button"))e.preventDefault()});</script></body></html>';
}
async function main(){
 const browser=await chromium.launch({channel:"chrome",headless:true});
 const results=[];
 for(const spec of specs){
  const htmlFile=path.join(out,spec.name+".html");saveNew(htmlFile,build(spec));
  const ctx=await browser.newContext({viewport:{width:spec.mobile?390:1440,height:spec.mobile?844:spec.coincidences?1440:1050},deviceScaleFactor:spec.mobile?2:1.5,locale:"es-PE",timezoneId:"America/Lima"});
  await ctx.setOffline(true);
  let denied=0;
  await ctx.route("**/*",route=>{if(route.request().url().startsWith("file:"))return route.continue();denied++;return route.abort();});
  const page=await ctx.newPage();const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto(pathToFileURL(htmlFile).href,{waitUntil:"load"});
  await page.evaluate(()=>document.fonts.ready);
  if(spec.mobile&&!spec.mobileDetail)await page.addStyleTag({content:'body{position:relative}nav[aria-label="Navegación móvil"]{position:absolute}'});
  await page.waitForTimeout(100);
  const measurement=await page.evaluate(()=>({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,months:[...document.querySelectorAll("h3")].filter(x=>/^(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)$/.test(x.textContent||"")).map(x=>x.textContent),headings:[...document.querySelectorAll("h1,h2")].map(x=>x.textContent),hasImages:[...document.images].map(x=>({loaded:x.complete&&x.naturalWidth>0,alt:x.alt})),nav:[...document.querySelectorAll('nav[aria-label="Navegación móvil"] a')].map(x=>x.textContent),text:document.body.innerText}));
  const pngFile=path.join(out,spec.name+".png");
  if(fs.existsSync(pngFile))throw Error("PNG existente: "+pngFile);
  await page.screenshot({path:pngFile,fullPage:!spec.mobileDetail,animations:"disabled"});
  const result={file:path.relative(outputRoot,pngFile),html:path.relative(outputRoot,htmlFile),...spec,...measurement,errors,deniedNetworkRequests:denied,sha256:crypto.createHash("sha256").update(fs.readFileSync(pngFile)).digest("hex")};
  results.push(result);console.log("CAPTURADO "+spec.name+" "+measurement.scrollWidth+"x"+measurement.scrollHeight+" meses:"+measurement.months.length);
  await ctx.close();
 }
 await browser.close();saveNew(path.join(out,"verificacion.json"),JSON.stringify(results,null,2));
 console.log("RESULTADO "+JSON.stringify({screens:results.length,overflow:results.filter(x=>x.scrollWidth>x.width).map(x=>x.name),errors:results.filter(x=>x.errors.length).map(x=>x.name),missingImages:results.filter(x=>x.hasImages.some(i=>!i.loaded)).map(x=>x.name)}));
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
