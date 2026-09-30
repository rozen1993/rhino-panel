// Audit evidence: these assertions reproduce defects, not acceptance criteria.
// Synthetic props only; no DB and no application changes.
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import {ActivityDetail} from '@/components/activity-detail';
import {ActivityDashboard} from '@/components/activity-dashboard';
import {AunorJourneys} from '@/components/aunor-space';
import {parseActivityStore} from '@/lib/activity-simulation';
import {emptyAunorWorkspace} from '@/lib/aunor';
import {roles} from '@/lib/roles';
vi.mock('next/navigation',()=>({useRouter:()=>({push:vi.fn(),refresh:vi.fn(),prefetch:vi.fn()})}));
vi.mock('@/app/actividades/actions',()=>({advanceSupabaseActivityAction:vi.fn(),resetSupabaseActivityAction:vi.fn(),deleteSupabaseActivityMessageAction:vi.fn(),editSupabaseActivityMessageAction:vi.fn(),postSupabaseActivityMessageAction:vi.fn()}));
vi.mock('@/app/papelera/actions',()=>({softDeleteSupabaseActivityAction:vi.fn(),softDeleteOwnSupabaseActivityAction:vi.fn()}));
vi.mock('@/components/admin-aunor-panel',()=>({AdminAunorPanel:()=>null}));
afterEach(()=>{cleanup();vi.useRealTimers();});
it('REPRO: la ficha no incorpora una nueva version recibida por props',()=>{
 const a={...parseActivityStore(null)[0],title:'Titulo anterior',status:'Programada' as const};
 const props={id:a.id,role:{...roles.operario,accountId:a.responsibleAccountId},dataSource:'supabase' as const};
 const {rerender}=render(<ActivityDetail {...props} initialActivity={a}/>);
 rerender(<ActivityDetail {...props} initialActivity={{...a,title:'Titulo nuevo',version:a.version+1}}/>);
 expect(screen.getByRole('heading',{name:'Titulo anterior'})).toBeTruthy();
 expect(screen.queryByRole('heading',{name:'Titulo nuevo'})).toBeNull();
});
it('REPRO: un filtro sin coincidencias deja abierta la ficha previa',()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date('2026-09-30T17:00:00Z'));
 const a={...parseActivityStore(null)[0],title:'Actividad sintetica filtrada',spans:[{start:'2026-09-30',end:'2026-09-30'}]};
 render(<ActivityDashboard role={roles.admin} dataSource="supabase" initialActivities={[a]}/>);
 fireEvent.change(screen.getByRole('searchbox'),{target:{value:'NoCoincideConNinguna'}});
 expect(screen.getByText('No hay actividades que coincidan con la búsqueda.')).toBeTruthy();
 expect(screen.getByRole('link',{name:'Abrir ficha completa'}).getAttribute('href')).toContain(a.id);
});
it('REPRO: remontar el panel reinicia el mes elegido',()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date('2026-09-30T17:00:00Z'));
 const a={...parseActivityStore(null)[0],spans:[{start:'2026-04-10',end:'2026-04-10'}]};
 const props={role:roles.admin,dataSource:'supabase' as const,initialActivities:[a]};
 const first=render(<ActivityDashboard {...props}/>);
 for(let i=0;i<3;i++)fireEvent.click(screen.getAllByRole('button',{name:'Meses anteriores'})[0]);
 fireEvent.click(screen.getAllByRole('button',{name:/Mostrar abr de 2026/})[0]);
 expect(document.querySelector('[aria-current="date"]')?.getAttribute('aria-label')).toContain('abr');
 first.unmount();render(<ActivityDashboard {...props}/>);
 expect(document.querySelector('[aria-current="date"]')?.getAttribute('aria-label')).toContain('sep');
});
it('REPRO: jornadas Aunor usan fecha anterior en una edicion reprogramada',()=>{
 const w=emptyAunorWorkspace();
 w.activities=[{id:'synthetic',type:'Edición',title:'Edicion sintetica',status:'Programada',place:'',summary:'',service_id:null,not_performed_reason:'',publication_version:0,published_at:'',unread_count:0,delivery_due_on:'2026-05-15'}];
 w.journeys=[{activity_id:'synthetic',position:0,start_date:'2026-04-15',end_date:'2026-04-15',place:''}];
 render(<AunorJourneys w={w} id="synthetic"/>);
 expect(screen.getByText(/15 abr/)).toBeTruthy();
 expect(screen.queryByText(/15 may/)).toBeNull();
 expect(screen.getByText('Lugar por indicar')).toBeTruthy();
});
