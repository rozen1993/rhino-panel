import {expect,test,type Page} from '@playwright/test';
import {resolve} from 'node:path';
async function login(page:Page,user:'admin'|'aunor') {
  await page.goto('/acceso');
  await page.getByRole('listitem').filter({hasText:user==='admin'?'Marco Admin':'Aunor'}).getByRole('button',{name:'Ingresar'}).click();
  await page.locator('#usuario').fill(user);await page.locator('#clave').fill(user+'2026');
  await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.waitForURL(url=>url.pathname!=='/acceso');
}
test.beforeEach(async({page})=>{
  await page.route('**/*',route=>new URL(route.request().url()).hostname==='localhost'?route.continue():route.abort());
});
test('Aunor consulta las doce metas desde abril y el ciclo anual sin asignaciones inventadas',async({page})=>{
  await login(page,'aunor');await page.goto('/aunor/contrato');
  await page.getByLabel('Consultar mes').fill('2026-04');
  const list=page.locator('main');
  for(const [name,ratio] of [
    ['Cobertura fotográfica y audiovisual','0/10'],['Videos para redes sociales','0/4'],['Micronews internos','0/1'],
    ['Videos de resumen anual','0/2'],['Videos de fiesta de fin de año','0/2'],['Videos de campañas internas','0/12'],
    ['Videos sociales y ambientales','0/2'],['Videos de seguridad vial','0/24'],['Videos de voluntariado','0/2'],
    ['Postproducción de resumen OSITRAN','0/2'],['Webinars','0/3'],['Spots radiales','0/4'],
  ]) await expect(list.getByRole('button',{name:new RegExp('^'+name+':')})).toContainText(ratio);
  await expect(page.getByRole('region',{name:'Servicios del mes'}).getByRole('button')).toHaveCount(8);
  const annual=page.getByRole('region',{name:'Compromisos del ciclo'});
  await expect(annual.getByRole('button')).toHaveCount(4);
  await annual.getByRole('button',{name:/^Videos de fiesta de fin de año:/}).click();
  await expect(page.getByRole('dialog').getByText(/Control anual · 2026-04-01 — 2027-03-31/)).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('progressbar')).toHaveAttribute('max','2');
  await page.getByRole('button',{name:'Cerrar detalle'}).click();
  await list.getByRole('button').filter({hasText:'Videos de resumen anual'}).click();
  const dialog=page.getByRole('dialog');
  await expect(dialog.getByText(/Control anual · 2026-04-01 — 2027-03-31/)).toBeVisible();
  await expect(dialog.getByRole('progressbar')).toHaveAttribute('max','2');
  await expect(dialog.getByRole('button',{name:'Cerrar detalle'})).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  expect(await page.evaluate(()=>Boolean(document.activeElement?.closest('dialog')))).toBe(true);
  await page.getByRole('button',{name:'Cerrar detalle'}).click();
  await expect(list.getByRole('button',{name:/^Videos de resumen anual:/})).toBeFocused();
  const dir=process.env.SISTEMA_R_CAPTURE_DIR ?? '../docs/implementacion-contrato-tarjetas-2026-09-29';
  await page.setViewportSize({width:1440,height:1000});
  await page.getByRole('heading',{name:'Contrato',exact:true}).click();
  await page.screenshot({path:resolve(dir,'contrato-escritorio.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:/^Videos de seguridad vial:/}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.screenshot({path:resolve(dir,'contrato-detalle-movil.png'),fullPage:false});
  await page.keyboard.press('Escape');
  await page.getByRole('heading',{name:'Contrato',exact:true}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:resolve(dir,'contrato-movil.png'),fullPage:false});
  for(const width of [320,768,1024,1920]){
    await page.setViewportSize({width,height:1000});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await page.getByLabel('Consultar mes').fill('2026-03');
  await expect(page.getByText('Periodo por confirmar',{exact:true}).first()).toBeVisible();
});
test('Admin prepara la cuota sin guardar ni duplicar periodos ya existentes',async({page})=>{
  await login(page,'admin');await page.goto('/actividades/cobertura-norte');
  await page.getByText('Configurar periodos y metas del servicio',{exact:true}).click();
  const region=page.getByRole('region',{name:'Configuración de periodos'});
  await region.getByLabel('Mes a preparar').fill('2026-04');
  await region.getByRole('button',{name:'Usar referencia confirmada'}).click();
  await expect(region.getByText(/Ese periodo ya existe/)).toBeVisible();
  await expect(region.getByLabel('Meta (opcional)',{exact:true})).toHaveValue('10');
  await expect(region.getByLabel('Inicio',{exact:true})).toHaveValue('2026-04-01');
  await expect(region.getByLabel('Fin',{exact:true})).toHaveValue('2026-04-30');
  await expect(page.getByRole('combobox',{name:'Periodo contractual',exact:true})).toHaveValue('');
  await expect(page.getByText('Periodo pendiente de confirmar',{exact:true})).toBeVisible();
});
