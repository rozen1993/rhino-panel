// @vitest-environment node
import {beforeEach,expect,it,vi} from 'vitest';
const m=vi.hoisted(()=>({role:{id:'operario',accountId:'operator',mustChangePassword:false} as Record<string,unknown>|null,activity:{responsible_id:'operator',deleted_at:null},photo:null as Record<string,unknown>|null,invoke:vi.fn(),download:vi.fn(),process:vi.fn()}));
vi.mock('@/lib/supabase/session',()=>({currentSupabaseRole:async()=>m.role}));
vi.mock('@/lib/data-source',()=>({resolveDataSource:()=> 'supabase'}));
vi.mock('@/lib/social-photo-processing',()=>({processSocialPhoto:(bytes:Uint8Array)=>m.process(bytes)}));
vi.mock('@/lib/supabase/server',()=>({createSupabaseServerClient:async()=>({
 from:(table:string)=>{const q={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:table==='activities'?m.activity:m.photo,error:null})};return q;},
 functions:{invoke:m.invoke},storage:{from:()=>({download:m.download})},
})}));
import {POST} from '@/app/api/fotos/upload/route';
import {GET} from '@/app/api/fotos/[id]/route';
const id='00000000-0000-4000-8000-000000000001';
function upload(origin='http://localhost'){
 const body=new FormData();body.set('file',new Blob(['synthetic'],{type:'image/jpeg'}),'sample.jpg');
 body.set('activityId',id);body.set('caption','Ejemplo');
 return new Request('http://localhost/api/fotos/upload',{method:'POST',headers:{origin},body});
}
beforeEach(()=>{
 vi.clearAllMocks();m.role={id:'operario',accountId:'operator',mustChangePassword:false};
 m.activity={responsible_id:'operator',deleted_at:null};m.photo=null;
 m.process.mockResolvedValue({image:new Uint8Array([1]),thumb:new Uint8Array([2])});
 m.invoke.mockResolvedValue({data:{ok:true,id},error:null});
 m.download.mockResolvedValue({data:new Blob(['synthetic']),error:null});
});
it('rechaza otro origen, Aunor y cambio de contraseña antes de procesar archivos',async()=>{
 expect((await POST(upload('https://example.invalid'))).status).toBe(403);
 m.role={id:'aunor'};expect((await POST(upload())).status).toBe(403);
 m.role={id:'admin',mustChangePassword:true};expect((await POST(upload())).status).toBe(403);
 expect(m.process).not.toHaveBeenCalled();expect(m.invoke).not.toHaveBeenCalled();
});
it('un operario no sube fotos a una actividad ajena',async()=>{
 m.activity.responsible_id='other';
 expect((await POST(upload())).status).toBe(403);expect(m.process).not.toHaveBeenCalled();
});
it('autoriza al responsable y envía solo la copia procesada a Edge',async()=>{
 expect((await POST(upload())).status).toBe(200);
 const [name,{body}]=m.invoke.mock.calls[0];expect(name).toBe('social-photo-upload');
 expect(body.get('caption')).toBe('Ejemplo');expect(body.get('image').size).toBe(1);expect(body.has('file')).toBe(false);
});
it('no descarga sin sesión, ni un archivo fuera de la proyección autorizada',async()=>{
 m.role=null;expect((await GET(new Request('http://localhost'),{params:Promise.resolve({id})})).status).toBe(401);
 m.role={id:'aunor'};expect((await GET(new Request('http://localhost'),{params:Promise.resolve({id})})).status).toBe(404);
 expect(m.download).not.toHaveBeenCalled();
});
it('sirve la descarga privada sin caché pública ni nombre del operario',async()=>{
 m.role={id:'aunor'};m.photo={id,activity_id:id,state:'ready'};
 const response=await GET(new Request('http://localhost?variant=download'),{params:Promise.resolve({id})});
 expect(response.status).toBe(200);expect(response.headers.get('cache-control')).toBe('private, no-store');
 expect(response.headers.get('content-disposition')).toBe(`attachment; filename="foto-${id}.jpg"`);
 expect(m.download).toHaveBeenCalledWith(`${id}/${id}/image.jpg`);
});
it('no sirve cargas pendientes ni variantes desconocidas',async()=>{
 m.photo={id,activity_id:id,state:'pending'};
 expect((await GET(new Request('http://localhost'),{params:Promise.resolve({id})})).status).toBe(404);
 m.photo.state='ready';
 expect((await GET(new Request('http://localhost?variant=secret'),{params:Promise.resolve({id})})).status).toBe(400);
 expect(m.download).not.toHaveBeenCalled();
});
