import { expect, test, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/acceso");
  await page.getByRole("listitem").filter({ hasText: "Marco Admin" }).getByRole("button", { name: "Ingresar" }).click();
  await page.locator("#usuario").fill("admin");
  await page.locator("#clave").fill("admin2026");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(url=>url.pathname !== "/acceso");
}
test("Admin reinicia en Programada y conserva la ejecución anterior en papelera",async({page},info)=>{
  await login(page);
  await page.goto("/actividades/cobertura-norte");
  await page.getByText("Restablecer a Programada",{exact:true}).click();
  await page.getByLabel("Motivo del restablecimiento").fill("Corrección de prueba aislada");
  await page.screenshot({path:info.outputPath("restablecer-admin.png"),fullPage:true});
  page.once("dialog",dialog=>dialog.accept());
  await page.getByRole("button",{name:"Confirmar restablecimiento"}).click();
  await page.waitForURL(url=>url.pathname.startsWith("/actividades/")&&url.pathname!=="/actividades/cobertura-norte");
  await expect(page.getByRole("link",{name:/Abrir material/})).toHaveCount(0);
  await page.reload();
  await expect(page.locator("span.inline-flex").filter({hasText:"Programada"}).first()).toBeVisible();
  await expect(page.getByText("Restablecer a Programada",{exact:true})).toHaveCount(0);
  await page.goto("/papelera");
  await expect(page.getByRole("heading",{name:"Cobertura audiovisual Norte",exact:true})).toBeVisible();
});
for (const width of [390,768,1366,1920]) {
  test(`entrada C y calendarios aprobados a ${width}px`, async ({page}, info) => {
    await page.setViewportSize({width,height:900});
    await login(page);
    await page.goto("/historico");
    for (const img of await page.locator("main img").all()) {
      await expect.poll(()=>img.evaluate((el)=> (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({path:info.outputPath(`entrada-C-${width}.png`), fullPage:true});
    await page.getByRole("link",{name:"Ver histórico de grabación"}).click();
    await expect(page).toHaveURL(/tipo=grabacion/);
    await expect(page.getByRole("heading",{name:/Histórico 2026.*Grabación/})).toBeVisible();
    await expect(page.getByRole("heading",{level:3}).filter({hasText:/^(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)$/})).toHaveCount(12);
    await page.screenshot({path:info.outputPath(`grabacion-${width}.png`),fullPage:true});
    await page.getByRole("link",{name:"Año siguiente"}).click();
    await expect(page).toHaveURL(/anio=2027.*tipo=grabacion/);
    await page.getByRole("link",{name:"Año anterior"}).click();
    await page.getByRole("link",{name:"Ver Edición",exact:true}).click();
    await expect(page).toHaveURL(/tipo=edicion/);
    await expect(page.getByRole("heading",{name:/Histórico 2026.*Edición/})).toBeVisible();
    await page.screenshot({path:info.outputPath(`edicion-${width}.png`),fullPage:true});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
test("entrada C usable con texto ampliado y teclado en pantalla estrecha", async ({page},info)=>{
  await page.setViewportSize({width:320,height:900});
  await login(page);
  await page.goto("/historico");
  await page.evaluate(()=>{ document.documentElement.style.fontSize = "200%"; });
  for (const category of ["grabación","edición"]) {
    const link = page.getByRole("link",{name:`Ver histórico de ${category}`});
    await link.focus();
    await expect(link).toBeFocused();
    const action = link.locator("span").filter({hasText:`Ver histórico de ${category}`}).first();
    await expect(action).toBeInViewport();
    expect(await action.evaluate(el=>getComputedStyle(el).outlineStyle)).toBe("solid");
    const cardBox=await link.boundingBox(); const actionBox=await action.boundingBox();
    expect(actionBox!.x).toBeGreaterThanOrEqual(cardBox!.x);
    expect(actionBox!.x+actionBox!.width).toBeLessThanOrEqual(cardBox!.x+cardBox!.width);
  }
  await page.screenshot({path:info.outputPath("entrada-C-texto-ampliado.png"),fullPage:true});
});
test("varias jornadas y lugares, coincidencias y detalle móvil sin duplicar actividades", async ({page},info)=>{
  await login(page);
  await page.goto("/actividades/nueva");
  await page.getByLabel("Actividad o proyecto").fill("Prueba aislada multisede");
  await page.getByLabel("Descripción",{exact:true}).fill("Fixture local, no es un trabajo real.");
  await page.getByLabel("Lugar o referencia").fill("General Lima");
  await page.getByLabel("Inicio",{exact:true}).fill("2026-01-04");
  await page.getByLabel("Fin",{exact:true}).fill("2026-01-04");
  await page.getByLabel("Lugar de la jornada 1 (opcional)").fill("Norte ficticio");
  await page.getByRole("button",{name:/Añadir jornada/}).click();
  await page.getByLabel("Inicio",{exact:true}).nth(1).fill("2026-01-04");
  await page.getByLabel("Fin",{exact:true}).nth(1).fill("2026-01-04");
  await page.getByLabel("Lugar de la jornada 2 (opcional)").fill("Sur ficticio");
  await page.screenshot({path:info.outputPath("formulario-jornadas.png"),fullPage:true});
  await page.getByRole("button",{name:"Planificar y asignar",exact:true}).click();
  await page.getByRole("link",{name:"Ver actividad",exact:true}).click();
  await expect(page.getByText("Norte ficticio",{exact:true})).toBeVisible();
  await expect(page.getByText("Sur ficticio",{exact:true})).toBeVisible();
  await page.goto("/historico?tipo=grabacion&anio=2026");
  const day = page.getByRole("button",{name:/4 de enero: Grabación/});
  await day.click();
  const choices = page.getByRole("region",{name:"Actividades de esta fecha"});
  await expect(choices.getByRole("button")).toHaveCount(2);
  await choices.getByRole("button",{name:/Prueba aislada multisede/}).click();
  await expect(choices).toHaveCount(0);
  await page.getByRole("button",{name:/Volver a las actividades del día/}).click();
  await expect(choices.getByRole("button")).toHaveCount(2);
  await page.screenshot({path:info.outputPath("coincidencias-escritorio.png"),fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await day.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button",{name:/Prueba aislada multisede/}).click();
  await expect(dialog.getByRole("list",{name:"Jornadas y lugares"}).getByRole("listitem")).toHaveCount(2);
  await dialog.getByRole("button",{name:/Volver a las actividades del día/}).click();
  await expect(dialog.getByRole("region",{name:"Actividades de esta fecha"}).getByRole("button")).toHaveCount(2);
  await page.screenshot({path:info.outputPath("coincidencias-movil.png"),fullPage:false});
  await page.keyboard.press("Escape");
  await expect(day).toBeFocused();
});
