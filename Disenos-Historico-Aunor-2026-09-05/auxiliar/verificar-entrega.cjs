const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto"),{pathToFileURL,fileURLToPath}=require("node:url"),{createRequire}=require("node:module");
const root=path.dirname(__dirname),repo=path.dirname(root),deps=createRequire(path.join(repo,"frontend/package.json"));
const {chromium}=deps("playwright"),finalDir=path.join(root,process.argv[2]||"png-final"),hash=f=>crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
async function main(){
 const files=fs.readdirSync(finalDir).filter(x=>x.endsWith(".png")).sort().map(name=>{
  const file=path.join(finalDir,name),buf=fs.readFileSync(file);
  return {name,bytes:buf.length,width:buf.readUInt32BE(16),height:buf.readUInt32BE(20),validPNG:buf.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),sha256:hash(file)};
 });
 const metrics=JSON.parse(fs.readFileSync(path.join(finalDir,"verificacion.json"),"utf8"));
 const copies=[];
 for(const [local,original] of [["componentes","components"],["lib","lib"]])for(const name of fs.readdirSync(path.join(__dirname,local))){
  const copied=path.join(__dirname,local,name),source=path.join(repo,"frontend",original,name);
  copies.push({source:path.relative(repo,source),copy:path.relative(root,copied),sameBytes:fs.existsSync(source)&&hash(source)===hash(copied)});
 }
 const cssSource=path.join(repo,"frontend/.next/static/chunks/1hkd14dy8gdti.css");
 copies.push({source:path.relative(repo,cssSource),copy:"auxiliar/estilos-aprobados.css",sameBytes:fs.existsSync(cssSource)&&hash(cssSource)===hash(path.join(__dirname,"estilos-aprobados.css"))});
 const browser=await chromium.launch({channel:"chrome",headless:true}),context=await browser.newContext({viewport:{width:1440,height:1050}});
 await context.setOffline(true);let network=0;await context.route("**/*",r=>{if(r.request().url().startsWith("file:"))return r.continue();network++;return r.abort();});
 const page=await context.newPage();const pageErrors=[];page.on("pageerror",e=>pageErrors.push(e.message));
 await page.goto(pathToFileURL(path.join(root,"ABRIR-DISENOS.html")).href);
 await page.evaluate(async()=>{for(const img of document.images)img.loading="eager";await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});
 const gallery=await page.evaluate(()=>({links:[...document.querySelectorAll("a.card")].map(a=>a.href),imageCount:document.images.length,missingImages:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src),width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
 gallery.brokenLinks=gallery.links.filter(url=>!url.startsWith("file:")||!fs.existsSync(fileURLToPath(url)));
 const capture=path.join(__dirname,path.basename(finalDir)+"-galeria-verificada.png");if(fs.existsSync(capture))throw Error("No sobrescribir evidencia");await page.screenshot({path:capture,fullPage:false});
 await context.close();await browser.close();
 const result={folder:"Disenos-Historico-Aunor-2026-09-05",finalVersion:path.basename(finalDir),count:files.length,files,checks:{pngSignatures:files.every(x=>x.validPNG),fourDestinationsTwelveMonths:metrics.filter(x=>x.kind==="history"&&!x.coincidences).every(x=>x.months.length===12),allSixHistoryDOMsTwelveMonths:metrics.filter(x=>x.kind==="history").every(x=>x.months.length===12),noHorizontalOverflow:metrics.every(x=>x.width===x.scrollWidth),noRenderErrors:metrics.every(x=>!x.errors.length),noMissingPhotos:metrics.every(x=>x.hasImages.every(i=>i.loaded)),offlineRendering:metrics.every(x=>x.deniedNetworkRequests===0),approvedCopiesUnchanged:copies.every(x=>x.sameBytes),gallery18Links:gallery.links.length===18,galleryAllImagesLoaded:gallery.missingImages.length===0,galleryAllLinksExist:gallery.brokenLinks.length===0,galleryNoOverflow:gallery.width===gallery.scrollWidth,galleryNoNetwork:network===0,galleryNoPageErrors:pageErrors.length===0},copies,gallery,pageErrors};
 console.log(JSON.stringify(result,null,2));if(Object.values(result.checks).some(v=>!v))process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
