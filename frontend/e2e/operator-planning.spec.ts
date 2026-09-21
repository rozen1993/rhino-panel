import { expect, test, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto('/acceso');
  await page.getByRole('listitem').filter({hasText:'Ana Torres'}).getByRole('button',{name:'Ingresar'}).click();
  await page.locator('#usuario').fill('ana');
  await page.locator('#clave').fill('ana2026');
  await page.getByRole('button',{name:'Entrar',exact:true}).click();
  await page.waitForURL('**/actividades');
}

for (const viewport of [{width:1440,height:1000},{width:390,height:844}]) {
  test(`plan propio, modalidades e Histórico del equipo (${viewport.width})`,async({page},testInfo)=>{
    await page.setViewportSize(viewport);
    await login(page);
    await page.getByRole('link',{name:'Crear actividad propia'}).click();
    await page.getByLabel('Actividad o proyecto').fill('Cobertura sintética de prueba');
    await page.getByLabel('Descripción',{exact:true}).fill('Fotografía y vuelo para validar el formulario.');
    await page.getByLabel('Lugar o referencia').fill('Sede de prueba');
    await page.getByLabel('Inicio',{exact:true}).fill('2026-09-21');
    await page.getByLabel('Fin',{exact:true}).fill('2026-09-21');
    await page.locator('main button[type=submit]').click();
    await expect(page.getByText('Selecciona al menos una opción: Fotografía, Video o Vuelo con dron.')).toBeVisible();
    await page.getByRole('checkbox',{name:'Fotografía',exact:true}).check();
    await page.getByRole('checkbox',{name:'Vuelo con dron',exact:true}).check();
    await page.screenshot({path:testInfo.outputPath('formulario.png'),fullPage:true});
    await page.locator('main button[type=submit]').click();
    await page.getByRole('link',{name:'Ver actividad',exact:true}).click();
    await expect(page.getByRole('list',{name:'Modalidades de grabación'})).toContainText('Fotografía');
    const originalUrl=page.url();
    await page.getByRole('link',{name:'Editar actividad',exact:true}).click();
    await expect(page.getByRole('checkbox',{name:'Fotografía',exact:true})).toBeChecked();
    await expect(page.getByRole('checkbox',{name:'Vuelo con dron',exact:true})).toBeChecked();
    await page.getByLabel('Actividad o proyecto').fill('Cobertura corregida');
    await page.getByLabel('Inicio',{exact:true}).fill('2026-09-22');
    await page.getByLabel('Fin',{exact:true}).fill('2026-09-22');
    await page.getByRole('checkbox',{name:'Video',exact:true}).check();
    await page.locator('main button[type=submit]').click();
    await expect(page.getByText('Planificación actualizada.')).toBeVisible();
    await page.goto(originalUrl);
    await expect(page.getByRole('heading',{name:'Cobertura corregida',exact:true})).toBeVisible();
    await expect(page.getByRole('list',{name:'Modalidades de grabación'})).toContainText('Video');
    await page.screenshot({path:testInfo.outputPath('ficha.png'),fullPage:true});
    await page.getByRole('button',{name:'Iniciar',exact:true}).click();
    await expect(page.getByRole('link',{name:'Editar actividad',exact:true})).toHaveCount(0);
    await page.goto('/historico?anio=2026&tipo=todos');
    await expect(page.getByRole('heading',{name:'Histórico 2026',exact:true})).toBeVisible();
    await expect(page.getByRole('link',{name:'Cuentas',exact:true})).toHaveCount(0);
    await page.getByRole('button',{name:/22 de septiembre: Grabación, Cobertura corregida/}).click();
    await expect(page.getByRole('list',{name:'Modalidades de grabación'})).toContainText('Vuelo con dron');
    await page.screenshot({path:testInfo.outputPath('historico.png'),fullPage:true});
  });
}
