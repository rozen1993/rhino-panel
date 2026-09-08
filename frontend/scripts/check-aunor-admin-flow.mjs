// Disposable demo process and fresh browser contexts. Does not use preview or user sessions.
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
import { chromium } from "playwright";
const url="http://127.0.0.1:3111";
try { await fetch(url); throw Error("Port 3111 already in use; abort without touching it."); }
catch(e) { if(e.message.includes("already in use"))throw e; }
const server=spawn(process.execPath,["node_modules/next/dist/bin/next","start","-H","127.0.0.1","-p","3111"],{
  windowsHide:true,env:{...process.env,SISTEMA_R_DATA_SOURCE:"demo",SISTEMA_R_ISOLATED_TEST:"aunor"},stdio:["ignore","ignore","pipe"],
});
let serverErrors="";server.stderr.on("data",c=>{serverErrors+=c;});
let browser;
try {
  let ready=false;
  for(let i=0;i<50;i++) {try{if((await fetch(url+"/acceso")).ok){ready=true;break;}}catch{} await new Promise(r=>setTimeout(r,100));}
  assert(ready,"Disposable server did not start: "+serverErrors);
  browser=await chromium.launch({headless:true});
  const adminContext=await browser.newContext({viewport:{width:390,height:844}}),clientContext=await browser.newContext({viewport:{width:390,height:844}});
  const admin=await adminContext.newPage(),client=await clientContext.newPage();
  async function login(page,user,name) {
    await page.goto(url+"/acceso");
    await page.getByRole("listitem").filter({hasText:name}).getByRole("button",{name:"Ingresar"}).click();
    await page.locator("#usuario").fill(user);await page.locator("#clave").fill(user+"2026");
    await page.getByRole("button",{name:"Entrar",exact:true}).click();await page.waitForURL(u=>u.pathname!=="/acceso");
  }
  await login(admin,"admin","Marco Admin");await admin.goto(url+"/actividades/edicion-seguridad");
  const panel=admin.getByRole("region",{name:"Gestión Aunor"});
  await panel.getByLabel(/^Resumen para Aunor/).fill("PUBLICACIÓN AISLADA DESDE FORMULARIO ADMIN");
  await panel.getByRole("button",{name:"Actualizar publicación",exact:true}).click();
  await panel.getByRole("status").waitFor();
  await panel.getByLabel("Fecha del contacto",{exact:true}).fill("2026-09-06T12:00");
  await panel.getByLabel(/^Solicitante declarado/).fill("Ejecutivo declarado en llamada ficticia");
  await panel.getByLabel("Qué se acordó",{exact:true}).fill("ACUERDO AISLADO DESDE FORMULARIO ADMIN");
  await panel.getByLabel("Enlace de evidencia (opcional)",{exact:true}).fill("https://example.invalid/evidencia-llamada");
  await panel.getByRole("button",{name:"Publicar acuerdo registrado",exact:true}).click();
  await panel.locator("p").filter({hasText:/^ACUERDO AISLADO DESDE FORMULARIO ADMIN$/}).waitFor();
  assert.equal(await panel.getByLabel("Enlace de evidencia (opcional)",{exact:true}).inputValue(),"");
  await panel.getByLabel(/^Actividad sustituta/).selectOption("cobertura-norte");
  await panel.getByLabel(/^Acuerdo registrado/).selectOption({label:"Llamada · ACUERDO AISLADO DESDE FORMULARIO ADMIN"});
  await panel.getByLabel("Motivo de la relación",{exact:true}).fill("MOTIVO AISLADO DEL REEMPLAZO");
  await panel.getByLabel(/^Evidencia del acuerdo/).fill("Nota ficticia de la llamada");
  assert.equal(await panel.getByLabel("Enlace de evidencia del reemplazo (opcional)",{exact:true}).inputValue(),"");
  await panel.getByRole("button",{name:"Publicar reemplazo para Aunor",exact:true}).click();
  await panel.getByText("Pendiente de confirmación de Aunor",{exact:true}).waitFor();
  await login(client,"aunor","Aunor");await client.goto(url+"/aunor/actividades/edicion-seguridad");
  await client.getByText("PUBLICACIÓN AISLADA DESDE FORMULARIO ADMIN",{exact:true}).waitFor();
  await client.getByText("ACUERDO AISLADO DESDE FORMULARIO ADMIN",{exact:true}).waitFor();
  await client.getByRole("link",{name:/Ver relación/}).click();
  await client.getByText("MOTIVO AISLADO DEL REEMPLAZO",{exact:true}).waitFor();
  assert.equal(await client.getByRole("link",{name:"Abrir evidencia ↗"}).count(),0,"No silently inherited evidence URL");
  await client.getByRole("checkbox",{name:/He revisado original/}).check();
  await client.getByRole("button",{name:"Confirmar este reemplazo"}).click();
  await client.getByText("Reemplazo confirmado por Aunor",{exact:true}).waitFor();
  console.log("PASS: formularios Admin publican actividad, llamada y reemplazo; Aunor ve y confirma el objeto. Evidencias sin herencia accidental.");
} finally {
  if(browser)await browser.close();
  if(server.exitCode===null){const closed=new Promise(r=>server.once("exit",r));server.kill();await closed;}
  console.log("Cerrado solo el proceso demo creado por esta prueba en 3111.");
}
