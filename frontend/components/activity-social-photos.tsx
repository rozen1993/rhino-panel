'use client';
/* eslint-disable @next/next/no-img-element -- Private image routes and local file preview, never public image cache. */
import {useEffect,useState} from 'react';
import {listActivityPhotos,archiveActivityPhoto} from '@/app/actividades/photo-actions';
import {type StoredSocialPhoto,type SocialStorageUsage,socialPhotoUrl} from '@/lib/social-photos';
import {socialFileError,socialDimensionsError} from '@/lib/social-photo-client';
import {SocialFolderControl} from './social-folder-control';
import {SystemIcon} from './system-icon';
import s from './social-photos.module.css';

export function ActivitySocialPhotos({activityId,demo=false,expanded=false}:{activityId:string;demo?:boolean;expanded?:boolean}) {
 const [photos,setPhotos]=useState<StoredSocialPhoto[]>([]),[usage,setUsage]=useState<SocialStorageUsage|null>(null);
 const [loaded,setLoaded]=useState(demo),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const [caption,setCaption]=useState(''),[selection,setSelection]=useState<{file:File;url:string}|null>(null),[inputKey,setInputKey]=useState(0);
 useEffect(()=>()=>{if(selection)URL.revokeObjectURL(selection.url);},[selection]);
 async function refresh(){setBusy(true);try{const result=await listActivityPhotos(activityId);if(result.ok){setPhotos(result.photos);setUsage(result.usage);setLoaded(true);return true;}setMessage(result.error);return false;}catch{setMessage('No se pudo consultar el álbum. Pulsa Actualizar fotos.');return false;}finally{setBusy(false);}}
 async function choose(file:File|null){setSelection(null);setMessage('');if(!file)return;const error=socialFileError(file);if(error){setMessage(error);setInputKey(k=>k+1);return;}setBusy(true);try{const bitmap=await createImageBitmap(file);const dimensionsError=socialDimensionsError(bitmap.width,bitmap.height);bitmap.close();if(dimensionsError)throw Error(dimensionsError);setSelection({file,url:URL.createObjectURL(file)});}catch(error){setMessage(error instanceof Error&&error.name==='Error'?error.message:'No se pudo abrir la foto. Puede estar dañada; selecciona otra imagen.');setInputKey(k=>k+1);}finally{setBusy(false);}}
 async function upload(e:React.FormEvent){
  e.preventDefault();if(!selection||demo||busy)return;setBusy(true);setMessage('Optimizando y guardando la foto…');
  try {const data=new FormData();data.set('file',selection.file);data.set('activityId',activityId);data.set('caption',caption.trim());const response=await fetch('/api/fotos/upload',{method:'POST',body:data});
   const result=await response.json().catch(()=>({ok:false,error:response.status===413?'La foto es demasiado grande. Usa un archivo de hasta 4 MB.':'El servidor no completó la carga. Reintenta con el mismo archivo.'}));
   if(!response.ok||!result.ok)throw Error(result.error??'No se pudo guardar la foto.');
   setSelection(null);setCaption('');setInputKey(k=>k+1);
   const refreshed=await refresh();
   setMessage(`Foto guardada${typeof result.bytes==='number'?` (${Math.ceil(result.bytes/1024)} KB)`:''}. Aunor ya puede descargarla en Social.${refreshed?'':' No se pudo actualizar la lista; pulsa Actualizar fotos.'}`);
  }catch(error){setMessage(error instanceof Error?error.message:'No se pudo guardar. Reintenta con el mismo archivo.');}finally{setBusy(false);}
 }
 async function archive(photo:StoredSocialPhoto,value:boolean){setBusy(true);setMessage('');try{const result=await archiveActivityPhoto(photo.id,photo.version,value);if(!result.ok)setMessage(result.error??'No se pudo actualizar.');else{await refresh();setMessage(value?'Foto retirada de Social. Se conserva y sigue ocupando espacio; puedes restaurarla.':'Foto restaurada en Social.');}}catch{setMessage('No se pudo actualizar la foto.');}finally{setBusy(false);}}
 const active=photos.filter(p=>!p.archived_at),retired=photos.filter(p=>p.archived_at);
 const card=(photo:StoredSocialPhoto)=><article className={s.managedPhoto} key={photo.id}>{photo.state==='ready'?<img src={socialPhotoUrl(photo)} alt={photo.caption} loading="lazy"/>:<div className={s.pending}>Carga pendiente · reintenta el mismo archivo</div>}<p>{photo.caption}<br/><small>{Math.ceil(photo.byte_size/1024)} KB · {photo.width} × {photo.height} px</small></p><button type="button" className={s.secondary} disabled={busy} onClick={()=>void archive(photo,!photo.archived_at)}>{photo.archived_at?'Restaurar':'Retirar del álbum'}</button></article>;
 return <details className={s.manager} open={expanded||undefined} onToggle={e=>{if(e.currentTarget.open&&!loaded&&!busy&&!demo)void refresh();}}>
  <summary>Fotos para Social<span>{loaded?`${active.filter(p=>p.state==='ready').length} de 3 fotos`:'Abrir álbum'}</span></summary>
  <p className={s.managerIntro}>Selecciona hasta 3 fotos para que Aunor las descargue aquí. Se guardan por separado del enlace y del estado de la entrega; los originales permanecen en OneDrive.</p>
  {usage&&<div className={s.storageMeter}><div><strong>Espacio de archivos del proyecto</strong><span>{(usage.used_bytes/1_000_000).toFixed(1)} / {usage.limit_bytes/1_000_000} MB de presupuesto</span></div><progress max={usage.limit_bytes} value={Math.min(usage.used_bytes,usage.limit_bytes)} aria-label="Uso de Storage"/><p>Incluye archivos y cargas reservadas. El margen de seguridad no amplía tu cuota de Supabase.</p>{usage.warning&&<p role="status">Poco espacio disponible. Contacta con Admin; no se eliminarán fotos automáticamente.</p>}</div>}
  {message&&<p role="status" className={s.notice}>{message}</p>}
  {!loaded?<button type="button" className={s.secondary} disabled={busy} onClick={()=>void refresh()}>{busy?'Cargando…':'Cargar fotos'}</button>:<>
   {active.length>0&&<div className={s.managedPhotos}>{active.map(card)}</div>}
   {(active.length<3||active.some(p=>p.state==='pending'))?<form className={s.uploadForm} onSubmit={upload}>
    <label>Foto para redes<input key={inputKey} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>void choose(e.target.files?.[0]??null)}/></label>
    <p>JPG, PNG o WebP · hasta 4 MB y 40 megapíxeles · mínimo 1280 × 720 px (también vertical). No se admiten archivos animados.</p>
    {selection&&<figure className={s.uploadPreview}><img src={selection.url} alt="Vista previa de la foto seleccionada"/><figcaption>Archivo seleccionado: {(selection.file.size/1024/1024).toFixed(2)} MB. Al guardar: JPEG de hasta 600 KB, sin recorte, más miniatura. No sustituye al original.</figcaption></figure>}
    <label>Descripción breve de la foto<input required maxLength={160} value={caption} disabled={busy} onChange={e=>setCaption(e.target.value)} placeholder="Ej. Participantes durante la charla de seguridad"/></label>
    <button className={s.primary} type="submit" disabled={demo||busy||!selection||!caption.trim()||Boolean(usage&&usage.used_bytes>=usage.limit_bytes)}><SystemIcon name="camera" className="size-4"/>{busy?'Procesando…':'Guardar foto en Social'}</button>
    {demo&&<p>Demostración aislada: puedes revisar la selección, pero no se suben archivos reales.</p>}
   </form>:<p className={s.notice}>El álbum tiene sus 3 fotos. Retira una para añadir otra; las retiradas siguen ocupando espacio hasta una eliminación autorizada.</p>}
   {!demo&&<button type="button" className={s.detailLink} disabled={busy} onClick={()=>void refresh()}>Actualizar fotos</button>}
   {retired.length>0&&<details className={s.retired}><summary>Fotos retiradas ({retired.length})</summary><p>No son visibles para Aunor. Permanecen guardadas para poder recuperarlas.</p><div className={s.managedPhotos}>{retired.map(card)}</div></details>}
  </>}
  <div className={s.optionalFolder}><SocialFolderControl activityId={activityId} demo={demo}/></div>
 </details>;
}
