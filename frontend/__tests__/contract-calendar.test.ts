import {expect,it} from 'vitest';
import {emptyAunorWorkspace,type AunorActivityRow} from '@/lib/aunor';
import {activityContractPeriod,contractPeriodForMonth} from '@/lib/contract-calendar';
import {contractProgress} from '@/lib/contract-progress';
import {previewContractRelation} from '@/lib/admin-activity-management';
const activity=(patch:Partial<AunorActivityRow>={}):AunorActivityRow=>({id:'synthetic',type:'Grabación',title:'Trabajo de abril',status:'Entregada',place:'',summary:'',service_id:'cobertura',not_performed_reason:'',publication_version:1,published_at:'2026-09-30T12:00:00Z',unread_count:0,historical_regularized_at:'2026-09-30T12:00:00Z',...patch});
const fixture=()=>({...emptyAunorWorkspace(),activities:[activity()],journeys:[{activity_id:'synthetic',position:0,start_date:'2026-04-10',end_date:'2026-04-10',place:''}]});
it('cuenta abril desde su fecha registrada, no desde publicación/regularización, sin escribir',()=>{
 const w=fixture(),before=JSON.stringify(w);const p=contractPeriodForMonth(w,'cobertura','2026-04')!;
 expect(contractProgress(w,'cobertura',p)).toMatchObject({ratio:'1/10',count:1});
 expect(contractProgress(w,'cobertura',contractPeriodForMonth(w,'cobertura','2026-09')).count).toBe(0);
 expect(JSON.stringify(w)).toBe(before);
 expect(previewContractRelation(w,'synthetic','cobertura','','')).toMatchObject({before:1,after:1,target:10,delta:0});
});
it('respeta periodo explícito y meta nula/cero; no los sustituye con referencias',()=>{
 const w=fixture();w.contractPeriods=[{id:'explicit',service_id:'cobertura',cadence:'monthly',starts_on:'2026-05-01',ends_on:'2026-05-31',target:null,version:1}];w.activities[0].contract_period_id='explicit';
 expect(activityContractPeriod(w,w.activities[0])?.id).toBe('explicit');
 expect(contractProgress(w,'cobertura',w.contractPeriods[0])).toMatchObject({count:1,target:null});
 w.contractPeriods[0].target=0;expect(contractPeriodForMonth(w,'cobertura','2026-05')?.target).toBe(0);
 w.activities[0].contract_period_id='missing';expect(activityContractPeriod(w,w.activities[0])).toBeUndefined();
});
it('no duplica trabajos de varias jornadas o meses ni inventa fechas',()=>{
 const w=fixture();w.journeys[0].end_date='2026-05-01';expect(activityContractPeriod(w,w.activities[0])).toBeUndefined();
 w.journeys=[];expect(activityContractPeriod(w,w.activities[0])).toBeUndefined();
 w.activities[0].delivery_due_on='2026-02-31';expect(activityContractPeriod(w,w.activities[0])).toBeUndefined();
});
it('edición toma su entrega prevista, y fiesta es anual incluso con jornadas en meses distintos',()=>{
 const w=fixture();w.activities[0]={...w.activities[0],type:'Edición',service_id:'redes',delivery_due_on:'2026-05-15'};
 expect(activityContractPeriod(w,w.activities[0])?.starts_on).toBe('2026-05-01');
 w.activities[0]={...w.activities[0],service_id:'fiesta',delivery_due_on:null};w.journeys[0].end_date='2026-12-10';
 expect(activityContractPeriod(w,w.activities[0])).toMatchObject({cadence:'annual',target:2});
 expect(contractPeriodForMonth(w,'fiesta','2027-04')).toBeUndefined();
 expect(contractPeriodForMonth(w,'cobertura','2026-03')).toBeUndefined();
});
it('excluye sustituidas/no realizadas y no duplica Especial',()=>{
 const w=fixture();w.activities[0].classification='special';w.activities.push({...w.activities[0]});
 const p=contractPeriodForMonth(w,'cobertura','2026-04');expect(contractProgress(w,'cobertura',p).count).toBe(1);
 w.replacements=[{is_current:true,original_activity_id:'synthetic'} as never];expect(contractProgress(w,'cobertura',p).count).toBe(0);
});
it('conserva periodos anteriores explícitamente registrados, sin generar nuevas referencias anteriores a abril',()=>{
 const w=fixture();const legacy={id:'legacy',service_id:'cobertura',cadence:'monthly' as const,starts_on:'2026-01-01',ends_on:'2026-01-31',target:10,version:1};
 w.contractPeriods=[legacy];w.activities[0].contract_period_id=legacy.id;
 expect(contractProgress(w,'cobertura',contractPeriodForMonth(w,'cobertura','2026-01')).count).toBe(1);
 expect(contractPeriodForMonth(w,'cobertura','2026-02')).toBeUndefined();
});
