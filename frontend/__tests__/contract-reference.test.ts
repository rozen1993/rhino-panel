import {expect,it} from "vitest";
import {contractReferences,demoReferencePeriods,referenceMonthlyPeriod} from "@/lib/contract-reference";

it("aplica las instrucciones y correcciones expresas de Marco",()=>{
  expect(Object.keys(contractReferences)).toHaveLength(12);
  for(const [id,target] of Object.entries({cobertura:10,redes:4,micronews:1,webinars:3,fiesta:2,campanas:12,voluntariado:2,radio:4})) {
    expect(contractReferences[id]).toMatchObject({cadence:"monthly",target});
  }
  expect(contractReferences['seguridad-vial']).toMatchObject({cadence:"monthly",target:24});
  for(const id of ['resumen-anual','social-ambiental','ositran'])expect(contractReferences[id]).toMatchObject({cadence:"annual",target:2});
});
it("prepara meses desde abril, con días reales y sin inventar periodos anuales",()=>{
  expect(referenceMonthlyPeriod('cobertura','2026-04')).toMatchObject({starts_on:'2026-04-01',ends_on:'2026-04-30',target:10});
  expect(referenceMonthlyPeriod('redes','2028-02')?.ends_on).toBe('2028-02-29');
  for(const month of ['2026-03','2026-13','bad'])expect(referenceMonthlyPeriod('cobertura',month)).toBeNull();
  expect(referenceMonthlyPeriod('ositran','2026-04')).toBeNull();
});
it("genera solo configuración de demo, sin actividades ni periodos anteriores a abril",()=>{
  const rows=demoReferencePeriods('2026-09');
  expect(rows).toHaveLength(57);
  expect(new Set(rows.map(p=>p.id)).size).toBe(rows.length);
  expect(rows.filter(p=>p.cadence==='monthly').every(p=>p.starts_on>='2026-04-01' && p.ends_on<='2026-09-30')).toBe(true);
  expect(rows.filter(p=>p.cadence==='annual')).toHaveLength(3);
  expect(rows.filter(p=>p.cadence==='annual').every(p=>p.starts_on==='2026-04-01' && p.ends_on==='2027-03-31' && p.target===2)).toBe(true);
  expect(rows.filter(p=>p.service_id==='seguridad-vial').every(p=>p.target===24)).toBe(true);
  expect(demoReferencePeriods('2026-03')).toEqual([]);
});
