import {expect,test,type Page} from '@playwright/test';

async function login(page:Page,user:'admin'|'aunor') {
  await page.goto('/acceso');
  await page.getByRole('listitem').filter({hasText:user==='admin'?'Marco Admin':'Aunor'}).getByRole('button',{name:'Ingresar'}).click();
  await page.locator('#usuario').fill(user);
  await page.locator('#clave').fill(user+'2026');
  await page.getByRole('button',{name:'Entrar',exact:true}).click();
  await page.waitForURL(url=>url.pathname!=='/acceso');
}

test.beforeEach(async({page})=>{
  await page.route('**/*',route=>new URL(route.request().url()).hostname==='localhost'?route.continue():route.abort());
});

test('cursor de acción en acceso, planificación, histórico, cuentas y contrato',async({page})=>{
  await page.goto('/acceso');
  await expect(page.getByRole('button',{name:'Ingresar'}).first()).toHaveCSS('cursor','pointer');
  await login(page,'admin');
  await expect(page.getByRole('button',{name:'Cerrar sesión'})).toHaveCSS('cursor','pointer');
  await expect(page.getByRole('button',{name:'Meses anteriores'})).toHaveCSS('cursor','pointer');
  await page.goto('/actividades/nueva');
  await expect(page.getByLabel('Tipo de servicio')).toHaveCSS('cursor','pointer');
  await expect(page.getByRole('button',{name:'Planificar y asignar',exact:true})).toHaveCSS('cursor','pointer');
  await expect(page.getByRole('button',{name:'Eliminar periodo',exact:true})).toHaveCSS('cursor','not-allowed');
  await expect(page.getByRole('checkbox',{name:/Esta actividad es especial/})).toHaveCSS('cursor','pointer');
  await expect(page.getByRole('checkbox',{name:'Fotografía',exact:true})).toHaveCSS('cursor','pointer');
  await expect(page.getByLabel('Actividad o proyecto')).toHaveCSS('cursor','text');
  await page.goto('/historico?anio=2026&tipo=grabacion');
  await expect(page.getByRole('button',{name:'Año anterior',exact:true})).toHaveCSS('cursor','not-allowed');
  await expect(page.getByRole('button',{name:/4 de enero:/})).toHaveCSS('cursor','pointer');
  await page.goto('/cuentas');
  await expect(page.getByRole('button',{name:'+ Usuarios',exact:true})).toHaveCSS('cursor','pointer');
  await expect(page.getByRole('button',{name:'Editar',exact:true}).first()).toHaveCSS('cursor','pointer');
  await page.getByRole('button',{name:'Cerrar sesión'}).click();
  await login(page,'aunor');
  await page.goto('/aunor/contrato');
  await expect(page.getByRole('button',{name:'Actualizar',exact:true})).toHaveCSS('cursor','pointer');
  await expect(page.locator('button[aria-pressed]').first()).toHaveCSS('cursor','pointer');
});

test('no promete acciones en texto, etiquetas estáticas o controles deshabilitados',async({page})=>{
  await page.goto('/acceso');
  // DOM sintético de prueba; sin escribir almacenamiento ni registros.
  await page.evaluate(()=>{
    const fixture=document.createElement('section');fixture.id='cursor-test';
    fixture.innerHTML=`<button id="enabled">Guardar</button><button id="disabled" disabled>Guardar</button>
      <button id="aria-disabled" aria-disabled="true">Guardar</button><a id="disabled-link" href="#" aria-disabled="true">No disponible</a>
      <label id="check-label"><input type="checkbox">Confirmar</label>
      <label id="disabled-check-label"><input type="checkbox" disabled>Confirmar</label>
      <fieldset disabled><button id="fieldset-disabled">Guardar</button></fieldset>
      <details><summary id="summary">Abrir detalle</summary></details>
      <span id="static-badge">Especial</span><p id="text">Descripción del trabajo</p>
      <input id="text-input" type="text"><textarea id="textarea"></textarea>`;
    document.body.append(fixture);
  });
  for(const id of ['enabled','check-label','summary']) await expect(page.locator('#'+id)).toHaveCSS('cursor','pointer');
  for(const id of ['disabled','aria-disabled','disabled-link','disabled-check-label','fieldset-disabled']) await expect(page.locator('#'+id)).toHaveCSS('cursor','not-allowed');
  for(const id of ['static-badge','text']) await expect(page.locator('#'+id)).not.toHaveCSS('cursor','pointer');
  for(const id of ['text-input','textarea']) await expect(page.locator('#'+id)).toHaveCSS('cursor','text');
});
