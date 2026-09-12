"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { executeErasureAction, previewErasureAction } from "@/app/papelera/erasure-actions";
import { erasureConfirmation, type ErasureKind, type ErasurePreview } from "@/lib/erasure";
import type { DataSource } from "@/lib/data-source";

export function ErasureControl({kind,target=null,label,dataSource,onDeleted}: {
  kind:ErasureKind;target?:string|null;label?:string;dataSource:DataSource;onDeleted?:()=>void;
}) {
  const router=useRouter();
  const dialog=useRef<HTMLDialogElement>(null);
  const [open,setOpen]=useState(false),[preview,setPreview]=useState<ErasurePreview|null>(null);
  const [password,setPassword]=useState(""),[confirmation,setConfirmation]=useState("");
  const [pending,setPending]=useState(false),[error,setError]=useState("");
  const title=kind==="trash"?"Vaciar papelera":"Eliminar cuenta";
  useEffect(()=>{
    if(!open)return;
    dialog.current?.showModal();
    let cancelled=false;
    if(dataSource!=="supabase")return;
    void previewErasureAction(kind,target).then(result=>{
      if(cancelled)return;
      if(result.ok)setPreview(result.preview);else setError(result.error);
    }).catch(()=>{if(!cancelled)setError("No se pudo cargar la vista previa. No se ha eliminado nada.");});
    return ()=>{cancelled=true;};
  },[open,kind,target,dataSource]);
  function close(){if(pending)return;setOpen(false);setPassword("");setConfirmation("");setPreview(null);setError("");}
  async function remove(){
    if(!preview || pending)return;
    setPending(true);setError("");
    const secret=password;setPassword("");
    try{
      const result=await executeErasureAction(kind,target,preview.fingerprint,secret,confirmation);
      if(!result.ok){setError(result.error);return;}
      setOpen(false);setConfirmation("");setPreview(null);onDeleted?.();router.refresh();
    }catch{setError("No se pudo confirmar el resultado. Cierra y actualiza la página antes de reintentar.");}
    finally{setPending(false);}
  }
  return <>
    <button type="button" className="min-h-11 rounded-md border border-red/40 bg-panel px-3 py-2 text-sm font-bold text-red hover:bg-red/5" onClick={()=>setOpen(true)}>{kind==="trash"?"Vaciar papelera":"Eliminar"}</button>
    {open && <dialog ref={dialog} aria-label={title} onCancel={event=>{event.preventDefault();close();}}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-[10px] border border-line bg-panel p-5 text-ink shadow-[var(--shadow-3)] backdrop:bg-night/65">
      <div className="flex items-start justify-between gap-3"><div><p className="data-label text-red">Eliminación irreversible</p><h2 className="section-title mt-1 text-2xl">{title}</h2>{label&&<p className="mt-2 break-words text-sm font-bold">{label}</p>}</div><button type="button" aria-label="Cancelar eliminación" disabled={pending} onClick={close} className="min-h-11 min-w-11 rounded-full border border-line">×</button></div>
      <p className="mt-4 text-sm leading-6">Se borrarán los registros indicados, sus mensajes, entregas e historial de la plataforma. No podrán restaurarse desde la papelera.</p>
      <p className="mt-2 text-xs leading-5 text-ink-muted">No elimina archivos enlazados en OneDrive ni copias de respaldo externas.</p>
      {dataSource!=="supabase"?<p className="mt-4 text-sm">Esta operación requiere la conexión segura a Supabase; no está habilitada en la demostración.</p>:<>
        {!preview&&!error&&<p role="status" className="mt-4 text-sm">Calculando los datos afectados…</p>}
        {preview&&<>
          <div className="mt-4 rounded-md border border-red/25 bg-red/5 p-3 text-sm"><strong>{preview.activities.length} actividades · {preview.total} registros asociados</strong><p className="mt-1">Incluye las relaciones con trabajos de otras personas que aparecen abajo.</p></div>
          {preview.activities.length>0&&<ul aria-label="Actividades que se eliminarán" className="mt-3 max-h-48 space-y-2 overflow-y-auto rounded-md border border-line/40 p-3">{preview.activities.map(item=><li key={item.id} className="border-b border-line/20 pb-2 text-sm"><strong className="block break-words">{item.title}</strong><span className="text-xs text-ink-muted">{item.responsible} · {item.trashed?"En papelera":"Actividad fuera de la papelera"}</span></li>)}</ul>}
          <details className="mt-3 text-xs"><summary className="min-h-11 cursor-pointer py-3 font-bold">Ver desglose de registros</summary><ul>{Object.entries(preview.counts).map(([name,count])=><li key={name} className="break-all py-1">{name}: {count}</li>)}</ul></details>
          {preview.total>0&&<form className="mt-4 space-y-3" onSubmit={event=>{event.preventDefault();void remove();}}>
            <label className="block text-sm font-bold">Contraseña del Admin<input type="password" autoComplete="current-password" required maxLength={256} disabled={pending} value={password} onChange={event=>setPassword(event.target.value)} className="mt-1 min-h-11 w-full rounded-md border border-line bg-panel px-3" /></label>
            <label className="block text-sm font-bold">Escribe {erasureConfirmation}<input required autoComplete="off" disabled={pending} value={confirmation} onChange={event=>setConfirmation(event.target.value)} className="mt-1 min-h-11 w-full rounded-md border border-line bg-panel px-3" /></label>
            <button type="submit" disabled={pending||!password||confirmation!==erasureConfirmation} className="min-h-12 w-full rounded-md bg-red px-4 font-bold text-white disabled:opacity-50">{pending?"Procesando eliminación…":"Eliminar definitivamente"}</button>
          </form>}
        </>}
      </>}
      {error&&<p role="alert" className="mt-3 text-sm font-bold text-red">{error}</p>}
      <button type="button" disabled={pending} onClick={close} className="mt-3 min-h-11 w-full rounded-md border border-line font-bold">Cancelar</button>
    </dialog>}
  </>;
}
