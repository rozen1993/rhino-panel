"use client";
/* eslint-disable @next/next/no-img-element -- Authenticated photographs must not enter the public optimizer cache. */
import {useState} from 'react';
import {listActivityPhotos,archiveActivityPhoto} from '@/app/actividades/photo-actions';
import {type SocialPhoto,socialPhotoUrl} from '@/lib/social-photos';
import s from './social-photos.module.css';
export function ActivitySocialPhotos({activityId,demo=false}:{activityId:string;demo?:boolean}) {
 const [photos,setPhotos]=useState<SocialPhoto[]>([]),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const [caption,setCaption]=useState('');const [file,setFile]=useState<File|null>(null);const [inputKey,setInputKey]=useState(0);
 async function refresh(){setBusy(true);try{const result=await listActivityPhotos(activityId);if(result.ok){setPhotos(result.photos);setLoaded(true);}else setMessage(result.error);}catch{setMessage('No se pudieron cargar las fotos. Vuelve a intentarlo.');}finally{setBusy(false);}}
 async function upload(e:React.FormEvent){e.preventDefault();if(!file)return;setBusy(true);setMessage('Preparando la foto…');try{const data=new FormData();data.set('file',file);data.set('activityId',activityId);data.set('caption',caption.trim());const response=await fetch('/api/fotos/upload',{method:'POST',body:data});const result=await response.json();if(!result.ok)throw Error(result.error??'No se pudo guardar la foto.');setFile(null);setCaption('');setInputKey(k=>k+1);setMessage('Foto guardada. Aunor ya puede consultarla en Fotos para redes.');await refresh();}catch(error){setMessage(error instanceof Error?error.message:'No se pudo guardar. Inténtalo nuevamente.');}finally{setBusy(false);}}
 async function archive(photo:SocialPhoto,value:boolean){setBusy(true);setMessage('');try{const result=await archiveActivityPhoto(photo.id,photo.version,value);if(!result.ok)setMessage(result.error??'No se pudo actualizar.');else{setMessage(value?'Foto retirada del álbum. Puedes restaurarla más abajo.':'Foto restaurada.');await refresh();}}catch{setMessage('No se pudo actualizar la foto.');}finally{setBusy(false);}}
 const active=photos.filter(p=>!p.archived_at),retired=photos.filter(p=>p.archived_at);
 const card=(photo:SocialPhoto)=><article className={s.managedPhoto} key={photo.id}>{photo.state==='ready'?<img src={socialPhotoUrl(photo)} alt={photo.caption} loading="lazy"/>:<div className={s.pending}>Carga pendiente</div>}<p>{photo.caption}</p><button className={s.secondary} disabled={busy} onClick={()=>void archive(photo,!photo.archived_at)}>{photo.archived_at?'Restaurar':'Retirar del álbum'}</button></article>;
 return <details className={s.manager} onToggle={e=>{if(e.currentTarget.open&&!loaded&&!busy&&!demo)void refresh();}}>
   <summary>Fotos para redes<span>{loaded?`${active.filter(p=>p.state==='ready').length} de 3 fotos`:'Abrir álbum'}</span></summary>
   <p className={s.managerIntro}>Añade 2–3 fotos seleccionadas de esta actividad para las redes de Aunor.</p>
   {demo?<p className={s.notice}>Demostración: la carga real se habilita al conectar el almacenamiento privado.</p>:<>
    {message&&<p className={s.notice} role="status">{message}</p>}
    {!loaded?<button className={s.secondary} disabled={busy} onClick={()=>void refresh()}>{busy?'Cargando…':'Cargar fotos'}</button>:<>
      {!!active.length&&<div className={s.managedPhotos}>{active.map(card)}</div>}
      {active.some(p=>p.state==='pending')&&<p className={s.notice}>Una carga quedó pendiente. Selecciona el mismo archivo para reintentar o retírala del álbum.</p>}
      {(active.length<3||active.some(p=>p.state==='pending'))&&<form className={s.uploadForm} onSubmit={upload}>
        <label>Fotografía<input key={inputKey} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} required onChange={e=>{const selected=e.target.files?.[0]??null;if(selected&&selected.size>4*1024*1024){setMessage('Usa una foto de hasta 4 MB.');setFile(null);e.target.value='';return;}setFile(selected);}}/></label>
        <label>Descripción breve de la foto<input required maxLength={160} value={caption} disabled={busy} onChange={e=>setCaption(e.target.value)} placeholder="Ej. Participantes durante la charla de seguridad"/></label>
        <p>JPG, PNG o WebP · hasta 4 MB. Guardamos una copia optimizada para redes, sin datos de cámara ni ubicación GPS. Conserva tu archivo original.</p>
        <button className={s.primary} disabled={busy||!file||!caption.trim()}>{busy?'Guardando…':'Añadir foto al álbum'}</button>
      </form>}
      {active.length>=3&&!active.some(p=>p.state==='pending')&&<p className={s.managerIntro}>La selección está completa. Para cambiar una foto, retírala y añade la nueva.</p>}
      {!!retired.length&&<details className={s.retired}><summary>Fotos retiradas ({retired.length})</summary><p>Se conservan para poder restaurarlas. No son visibles para Aunor.</p><div className={s.managedPhotos}>{retired.map(card)}</div></details>}
    </>}
   </>}
 </details>;
}
