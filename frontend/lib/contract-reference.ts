import type { ContractPeriod } from "./contract-progress";

// Operational reference confirmed by Marco on 29/09/2026. Never seeds production.
// April 2026 is the first reporting month, not a claim about the exact signature day.
export const contractStartMonth = "2026-04";
// Reporting convention chosen under Marco's delegation; NOT contract expiry.
export const annualReportingCycle = {starts_on:"2026-04-01",ends_on:"2027-03-31"};
export type ContractReference = {
  cadence: ContractPeriod["cadence"];
  target: number | null;
  source: string;
};
export const contractReferences: Record<string, ContractReference> = {
  cobertura: {cadence:"monthly",target:10,source:"10 coberturas mensuales confirmadas por Marco."},
  redes: {cadence:"monthly",target:4,source:"4 al mes confirmados por Marco; sustituye la contradicción cinco (4)."},
  micronews: {cadence:"monthly",target:1,source:"1 al mes confirmado por Marco; sustituye la cantidad del documento."},
  "resumen-anual": {cadence:"annual",target:2,source:"Dos videos de resumen anual, cláusula 2.2."},
  fiesta: {cadence:"monthly",target:2,source:"Dos videos de fiesta de fin de año. Mensual por instrucción de Marco al no especificarse periodicidad."},
  campanas: {cadence:"monthly",target:12,source:"Doce videos de campañas internas. Mensual por instrucción de Marco."},
  "social-ambiental": {cadence:"annual",target:2,source:"Dos videos anuales de actividades sociales y ambientales."},
  "seguridad-vial": {cadence:"monthly",target:24,source:"24 al mes confirmados por Marco; sustituye la contradicción Veinticuatro (21)."},
  voluntariado: {cadence:"monthly",target:2,source:"Dos videos de voluntariado. Mensual por instrucción de Marco."},
  ositran: {cadence:"annual",target:2,source:"Dos videos resumen anual para OSITRAN (postproducción)."},
  webinars: {cadence:"monthly",target:3,source:"3 al mes confirmados por Marco; sustituye la contradicción tres (2)."},
  radio: {cadence:"monthly",target:4,source:"Cuatro cuñas radiales. Mensual por instrucción de Marco."},
};

export function referenceLabel(serviceId:string) {
  const reference=contractReferences[serviceId];
  if(!reference) return "Referencia por confirmar";
  return `${reference.target===null ? "Meta por confirmar" : `${reference.target} trabajos`} · ${reference.cadence==="annual" ? "anual" : "mensual"}`;
}

export function referenceMonthlyPeriod(serviceId:string, month:string):Omit<ContractPeriod,"id"|"version">|null {
  const ref=contractReferences[serviceId];
  if(!ref || ref.cadence!=="monthly" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || month<contractStartMonth) return null;
  const [year,number]=month.split("-").map(Number);
  const last=new Date(Date.UTC(year,number,0)).getUTCDate();
  return {service_id:serviceId,cadence:"monthly",starts_on:`${month}-01`,ends_on:`${month}-${last}`,target:ref.target};
}

/** Synthetic demo only. No automatic assignment of any activity to a period. */
export function demoReferencePeriods(throughMonth:string):ContractPeriod[] {
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(throughMonth) || throughMonth<contractStartMonth) return [];
  const periods:ContractPeriod[]=[];
  for(let month=contractStartMonth;month<=throughMonth;) {
    for(const service of Object.keys(contractReferences)) {
      const p=referenceMonthlyPeriod(service,month);
      if(p) {
        const suffix=String(periods.length+1).padStart(12,"0");
        periods.push({...p,id:`a0292026-0000-4000-8000-${suffix}`,version:1});
      }
    }
    const [year,number]=month.split("-").map(Number);
    month=new Date(Date.UTC(year,number,1)).toISOString().slice(0,7);
  }
  for(const [service,ref] of Object.entries(contractReferences)) {
    if(ref.cadence==='annual') periods.push({id:`a0292026-0000-4000-8000-${String(periods.length+1).padStart(12,'0')}`,service_id:service,cadence:'annual',target:ref.target,...annualReportingCycle,version:1});
  }
  return periods;
}
