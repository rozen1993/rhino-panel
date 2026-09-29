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
  const list=page.locator('section').filter({has:page.getByRole('heading',{name:'Qué está previsto',exact:true})});
  for(const [name,ratio] of [
    ['Cobertura fotográfica y audiovisual','0/10'],['Videos para redes sociales','0/4'],['Micronews internos','0/1'],
    ['Videos de resumen anual','0/2'],['Videos de fiesta de fin de año','0/2'],['Videos de campañas internas','0/12'],
    ['Videos sociales y ambientales','0/2'],['Videos de seguridad vial','0/24'],['Videos de voluntariado','0/2'],
    ['Postproducción de resumen OSITRAN','0/2'],['Webinars','0/3'],['Spots radiales','0/4'],
  ]) await expect(list.getByRole('button').filter({hasText:name})).toContainText(ratio);
  await list.getByRole('button').filter({hasText:'Videos de resumen anual'}).click();
  await expect(page.getByText(/Ciclo operativo: abril de 2026 a marzo de 2027/)).toBeVisible();
  await expect(page.getByRole('progressbar')).toHaveAttribute('max','2');
  const dir='../docs/configuracion-contrato-2026-09-29';
  await page.setViewportSize({width:1440,height:1000});
  await page.getByRole('heading',{name:'Contrato',exact:true}).click();
  await page.screenshot({path:resolve(dir,'contrato-escritorio.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('combobox',{name:/Servicio del contrato/}).selectOption('seguridad-vial');
  await page.getByRole('heading',{name:'Contrato',exact:true}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:resolve(dir,'contrato-movil.png'),fullPage:true});
  await page.getByLabel('Consultar mes').fill('2026-03');
  await expect(page.getByText('Periodo por confirmar',{exact:true})).toBeVisible();
});
test('Admin prepara la cuota sin guardar ni duplicar periodos ya existentes',async({page})=>{
  await login(page,'admin');await page.goto('/actividades/cobertura-norte');
  await page.getByText('Configurar periodos y metas del servicio',{exact:true}).click();
  const region=page.getByRole('region',{name:'Periodo contractual'});
  await region.getByLabel('Mes a preparar').fill('2026-04');
  await region.getByRole('button',{name:'Usar referencia confirmada'}).click();
  await expect(region.getByText(/Ese periodo ya existe/)).toBeVisible();
  await expect(region.getByLabel('Meta (opcional)',{exact:true})).toHaveValue('10');
  await expect(region.getByLabel('Inicio',{exact:true})).toHaveValue('2026-04-01');
  await expect(region.getByLabel('Fin',{exact:true})).toHaveValue('2026-04-30');
  await expect(region.getByLabel('Periodo de esta actividad')).toHaveValue('');
  await expect(region.getByRole('button',{name:'Confirmar periodo',exact:true})).toBeDisabled();
});
