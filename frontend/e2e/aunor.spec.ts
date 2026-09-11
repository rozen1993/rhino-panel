import { expect, test, type Page } from "@playwright/test";

async function login(page: Page, user: "aunor" | "admin" | "carlos") {
  const names={aunor:"Aunor",admin:"Marco Admin",carlos:"Carlos Vega"};
  await page.goto("/acceso");
  await page.getByRole("listitem").filter({hasText:names[user]}).getByRole("button",{name:"Ingresar"}).click();
  await page.locator("#usuario").fill(user);
  await page.locator("#clave").fill(user+"2026");
  await page.getByRole("button",{name:"Entrar",exact:true}).click();
  await page.waitForURL(url=>url.pathname!=="/acceso");
}

test("Aunor solo navega su espacio, incluido Por relacionar",async({page})=>{
  await login(page,"aunor");
  await expect(page).toHaveURL(/\/aunor$/);
  await expect(page.getByRole("link",{name:"Cuentas",exact:true})).toHaveCount(0);
  await expect(page.getByRole("link",{name:"Burson",exact:true})).toHaveCount(0);
  await expect(page.getByText("Por relacionar",{exact:true})).toBeVisible();
  await page.goto("/aunor/actividades/aunor-senalizacion");
  await expect(page.getByRole("heading",{name:/señalización/i})).toBeVisible();
  for(const path of ["/actividades","/actividades/nueva","/actividades/cobertura-norte","/historico","/cuentas","/papelera"]) {
    await page.goto(path);await expect(page).toHaveURL(/\/sin-acceso$/);
  }
  await page.goto("/aunor/actividades/locucion-burson");
  await expect(page.getByRole("heading",{name:"Esta página no existe"})).toBeVisible();
});

test("Operario no accede al espacio externo",async({browser})=>{
  for(const user of ["carlos"] as const) {
    const context=await browser.newContext();const page=await context.newPage();
    await login(page,user);
    for(const path of ["/aunor","/aunor/contrato","/aunor/actividades/cobertura-norte"]) {
      await page.goto(path);await expect(page).toHaveURL(/\/sin-acceso$/);
    }
    await context.close();
  }
});

test("Aunor confirma objetos sin chat y Contrato conserva la observación",async({page,browser},info)=>{
  await login(page,"aunor");await page.goto("/aunor/actividades/cobertura-norte");
  const confirm=page.getByRole("button",{name:"Confirmar esta entrega"});
  await expect(confirm).toBeDisabled();
  await expect(page.getByRole("region",{name:"Conversación externa"})).toHaveCount(0);
  await expect(page.getByLabel("Mensaje para Rhino")).toHaveCount(0);
  await expect(page.getByRole("link",{name:"Mensajes",exact:true})).toHaveCount(0);
  await expect(page.getByText("Opinión del operario",{exact:true})).toHaveCount(0);
  await expect(page.getByText("Trazabilidad completa",{exact:true})).toHaveCount(0);
  const adminContext=await browser.newContext();const admin=await adminContext.newPage();
  await login(admin,"admin");await admin.goto("/actividades/cobertura-norte");
  await expect(admin.getByRole("region",{name:"Conversación externa"})).toHaveCount(0);
  await expect(admin.getByRole("heading",{name:"Contrato y entregas de Aunor"})).toBeVisible();
  await page.goto("/aunor/contrato");
  await expect(page.getByText("Observado: tiene reemplazo",{exact:true}).first()).toBeVisible();
  await page.goto("/aunor/actividades/cobertura-norte");
  await page.getByRole("checkbox",{name:/He revisado la entrega/}).check();
  await page.screenshot({path:info.outputPath("entrega-pendiente-desktop.png"),fullPage:true});
  await confirm.click();
  await expect(page.getByText("Confirmada por Aunor",{exact:true})).toBeVisible();
  await page.reload();await expect(page.getByText("Confirmada por Aunor",{exact:true})).toBeVisible();
  await expect(page.getByRole("button",{name:"Confirmar esta entrega"})).toHaveCount(0);
  await page.goto("/aunor/reemplazos/replacement-demo-1");
  const replace=page.getByRole("button",{name:"Confirmar este reemplazo"});
  await expect(replace).toBeDisabled();
  await page.screenshot({path:info.outputPath("reemplazo-pendiente-desktop.png"),fullPage:true});
  await page.getByRole("checkbox",{name:/He revisado original/}).check();await replace.click();
  await expect(page.getByText("Reemplazo confirmado por Aunor",{exact:true})).toBeVisible();
  await expect(page.getByText("No implica equivalencia económica.",{exact:false}).first()).toBeVisible();
  await page.goto("/aunor/contrato");
  await expect(page.getByText("Observado: tiene reemplazo",{exact:true}).first()).toBeVisible();
  await adminContext.close();
});

test("capturas reales escritorio y móvil, doce meses y coincidencias",async({page},info)=>{
  await login(page,"aunor");
  const paths=[
    ["01-panel","/aunor"],["02-entrega","/aunor/actividades/cobertura-norte"],
    ["03-contrato","/aunor/contrato"],["04-reemplazo","/aunor/reemplazos/replacement-demo-1"],
    ["06-calendario","/aunor/calendario?anio=2026"],
  ];
  for(const width of [1366,390]) {
    await page.setViewportSize({width,height:width===390?844:900});
    for(const [name,path] of paths) {
      await page.goto(path);await page.evaluate(()=>document.fonts.ready);
      await expect(page.getByText("No se pudo cargar Aunor.",{exact:false})).toHaveCount(0);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      if(name==="06-calendario") {
        await expect(page.getByRole("heading",{name:"ENERO",exact:true})).toBeVisible();
        await expect(page.getByRole("heading",{name:"DICIEMBRE",exact:true})).toBeVisible();
        await page.getByRole("button",{name:/4 de enero:/i}).click();
        const detail=width===390?page.getByRole("dialog"):page.locator("aside").filter({hasText:"3 actividades en esta fecha"});
        await expect(detail.getByText("3 actividades en esta fecha")).toBeVisible();
        await expect(detail.getByText("Opinión del operario")).toHaveCount(0);
      }
      await page.screenshot({path:info.outputPath(`${name}-${width}.png`),fullPage:true});
    }
  }
});

test("capturas del Admin con gestión externa dentro de la ficha",async({page},info)=>{
  await login(page,"admin");
  for(const width of [1366,390]) {
    await page.setViewportSize({width,height:900});await page.goto("/actividades/cobertura-norte");
    await expect(page.getByRole("heading",{name:"Contrato y entregas de Aunor"})).toBeVisible();
    await expect(page.getByRole("button",{name:"Actualizar publicación"})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:info.outputPath(`07-admin-${width}.png`),fullPage:true});
    if(width===390) {
      const forms=page.getByRole("region",{name:"Gestión Aunor"}).locator("form");
      for(let i=0;i<await forms.count();i++) await forms.nth(i).screenshot({path:info.outputPath(`08-admin-form-${i+1}-390.png`)});
    }
  }
});

test("rutas retiradas no exponen contenido ni cuentas antiguas",async({page})=>{
  await page.goto("/acceso");
  await expect(page.getByRole("listitem").filter({hasText:"Equipo Burson"})).toHaveCount(0);
  await login(page,"admin");
  await page.goto("/cuentas");
  await expect(page.getByRole("heading",{name:"Equipo Burson",exact:true})).toHaveCount(0);
  await expect(page.getByText("Operario especial",{exact:false})).toHaveCount(0);
  for(const path of ["/burson","/burson/locucion-burson","/aunor/mensajes"]){
    const response=await page.goto(path);
    expect([200,404]).toContain(response?.status());
    await expect(page.getByRole("heading",{name:"Esta página no existe"})).toBeVisible();
    await expect(page.getByRole("region",{name:"Conversación externa"})).toHaveCount(0);
  }
  await page.goto("/aunor/acordado");
  await expect(page).toHaveURL(/\/sin-acceso$/);
  await login(page,"aunor");
  await page.goto("/aunor/acordado");
  await expect(page).toHaveURL(/\/aunor\/contrato$/);
});
