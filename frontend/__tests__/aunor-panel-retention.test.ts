import {expect,it} from 'vitest';
import {scopeAunorWorkspace} from '@/lib/aunor-read-scope';
import {createAunorExamples} from '@/lib/aunor-examples';
import {safeAunorReturn,dashboardHref,activityDetailHref} from '@/lib/dashboard-navigation';
it('conserva todas las actividades en la proyección, sin depender de delivered_at',()=>{
 const w=createAunorExamples();for(const a of w.activities){a.status='Entregada';a.delivered_at=null;}
 const snapshot=structuredClone(w);const panel=scopeAunorWorkspace(w,{scene:'panel'});
 expect(panel.activities).toHaveLength(4);expect(panel.journeys).toHaveLength(w.journeys.length);expect(panel.agreements).toEqual([]);expect(panel.messages).toEqual([]);expect(w).toEqual(snapshot);
});
it('mantiene periodo y búsqueda al volver de la ficha de Aunor sin permitir URLs externas',()=>{
 const target=dashboardHref({year:2026,month:3,query:'Charla',status:'Entregada'},'/aunor');
 expect(safeAunorReturn(target)).toBe(target);expect(activityDetailHref('id',target)).toContain('/aunor/actividades/id?volver=');
 for(const unsafe of ['https://example.com','//example.com','/aunor/../cuentas','/actividades?periodo=2026-04'])expect(safeAunorReturn(unsafe)).toBe('/aunor');
});
