'use client';
import {useState} from 'react';
import {readSocialFolder,saveSocialFolder} from '@/app/actividades/photo-actions';
import {safeOneDriveFolder} from '@/lib/social-photos';
import {SystemIcon} from './system-icon';
import s from './social-photos.module.css';

export function SocialFolderControl({activityId,demo=false}:{activityId:string;demo?:boolean}) {
  const [url,setUrl]=useState(''),[version,setVersion]=useState(0),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  async function load() {
    if(demo){setLoaded(true);return;}
    setBusy(true);
    try {const result=await readSocialFolder(activityId);if(!result.ok){setMessage(result.error);return;}setUrl(result.folder?.folder_url??'');setVersion(result.folder?.version??0);setLoaded(true);}
    catch {setMessage('No se pudo consultar la carpeta. Vuelve a abrir esta sección para reintentar.');}
    finally {setBusy(false);}
  }
  const safeUrl=safeOneDriveFolder(url);
  return <details className={s.manager} onToggle={e=>{if(e.currentTarget.open&&!loaded&&!busy)void load();}}>
    <summary>Originales en OneDrive<span>Opcional</span></summary>
    <p className={s.managerIntro}>Puedes añadir un vínculo opcional a los originales. Descargar fotos de Social no requiere abrir OneDrive.</p>
    <form className={s.uploadForm} onSubmit={async e=>{e.preventDefault();if(demo||!loaded||busy)return;setBusy(true);setMessage('');try{const result=await saveSocialFolder(activityId,url,version);if(!result.ok){setMessage(result.error??'No se pudo guardar.');if(result.error?.includes('Actualiza')){setLoaded(false);}return;}await load();setMessage('Carpeta vinculada. Ya se puede consultar desde Social.');}catch{setMessage('No se pudo guardar el vínculo. Inténtalo de nuevo.');}finally{setBusy(false);}}}>
      <label>Vínculo de la carpeta<input type="url" required maxLength={3000} value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://empresa-my.sharepoint.com/…" disabled={demo||busy||!loaded}/></label>
      <p>El vínculo no cambia los permisos de OneDrive. Comparte la carpeta con Aunor desde Microsoft antes de publicarla aquí.</p>
      <button type="submit" className={s.primary} disabled={demo||busy||!loaded}>{busy?'Cargando…':'Guardar vínculo'}</button>
      {safeUrl&&<a href={safeUrl} target="_blank" rel="noopener noreferrer" className={s.secondary}><SystemIcon name="link" className="size-4"/>Abrir carpeta en OneDrive</a>}
      {!loaded&&!busy&&<button type="button" className={s.secondary} onClick={()=>void load()}>Actualizar carpeta</button>}
      {demo&&<p>Demostración aislada: no se modifican vínculos reales.</p>}
      {message&&<p role="status">{message}</p>}
    </form>
  </details>;
}
