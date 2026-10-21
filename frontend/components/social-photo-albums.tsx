"use client";
/* eslint-disable @next/next/no-img-element -- Authenticated image endpoint; no public optimizer cache. */
import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {SystemIcon} from './system-icon';
import {firstDate,effectiveSpans} from '@/lib/activities';
import {socialPhotoUrl,type SocialAlbum} from '@/lib/social-photos';
import s from './social-photos.module.css';

const dateFormat=new Intl.DateTimeFormat('es-PE',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
export function SocialPhotoAlbums({albums,today}:{albums:SocialAlbum[];today:string}) {
 const [month,setMonth]=useState(today.slice(0,7));const [query,setQuery]=useState('');const [limit,setLimit]=useState(12);
 const [selection,setSelection]=useState<{album:SocialAlbum;index:number}|null>(null);
 const [notice,setNotice]=useState('');const [downloading,setDownloading]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLElement|null>(null);const router=useRouter();
 const start=month+'-01',end=month?`${month}-${new Date(Number(month.slice(0,4)),Number(month.slice(5,7)),0).getDate()}`:'';
 const visible=albums.filter(a=>(!month||effectiveSpans(a).some(j=>j.start<=end&&j.end>=start))&&`${a.title} ${a.place}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
   .sort((a,b)=>firstDate(b).localeCompare(firstDate(a))||a.title.localeCompare(b.title));
 const total=visible.reduce((n,a)=>n+a.photos.length,0);
 const hasSelection=selection!==null;
 useEffect(()=>{if(!hasSelection)return;const element=dialog.current;element?.showModal();const before=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{element?.close();document.body.style.overflow=before;trigger.current?.focus({preventScroll:true});};},[hasSelection]);
 function open(album:SocialAlbum,index=0){trigger.current=document.activeElement as HTMLElement;setSelection({album,index});}
 async function downloadAlbums(items:SocialAlbum[]){
   const photos=items.flatMap(a=>a.photos.map((photo,i)=>({photo,name:`${a.title.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9-]/g,'-').slice(0,70)}-${a.id.slice(0,8)}/${i+1}.jpg`})));
   if(photos.reduce((n,p)=>n+p.photo.byte_size,0)>32*1024*1024){setNotice('La selección supera 32 MB. Descarga los álbumes por separado.');return;}
   setDownloading(true);setNotice('Preparando descarga…');
   try{
     const files=[];let downloaded=0;
     for(const item of photos){const response=await fetch(socialPhotoUrl(item.photo,'download'),{cache:'no-store'});if(!response.ok||!response.headers.get('content-type')?.includes('image/jpeg'))throw Error('No se pudieron descargar todas las fotos. Actualiza e inténtalo de nuevo.');const bytes=new Uint8Array(await response.arrayBuffer());downloaded+=bytes.length;if(downloaded>32*1024*1024)throw Error('Descarga los álbumes por separado para reducir el tamaño.');files.push({name:item.name,bytes});}
     const {createPhotoZip}=await import('@/lib/photo-zip');const blob=new Blob([new Uint8Array(createPhotoZip(files))],{type:'application/zip'});const url=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=url;anchor.download=`fotos-aunor-${month||'seleccion'}.zip`;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),60_000);setNotice('Descarga preparada.');
   }catch(error){setNotice(error instanceof Error?error.message:'No se pudo preparar la descarga.');}finally{setDownloading(false);}
 }
 const photo=selection?.album.photos[selection.index];
 return <div className={s.page}>
   <header className={s.heading}><div><p className="data-label text-cyan-ink">Espacio Aunor / fotografía</p><h1 className="display-title">Fotos para redes</h1><p className={s.subtitle}>Las mejores tomas de cada actividad, listas para tus publicaciones.</p></div><button className={s.secondary} onClick={()=>router.refresh()}>Actualizar</button></header>
   <div className={s.filters}><label className={s.search}><SystemIcon name="search" className="size-4"/><input aria-label="Buscar álbum" type="search" placeholder="Buscar actividad" value={query} onChange={e=>{setQuery(e.target.value);setLimit(12);}}/></label><label className={s.month}><span>Consultar mes</span><input aria-label="Mes de las fotos" type="month" min="2026-01" value={month} onChange={e=>{setMonth(e.target.value);setLimit(12);}}/></label><p className={s.count} role="status">{visible.length} {visible.length===1?'actividad':'actividades'} · {total} {total===1?'foto':'fotos'}</p></div>
   {notice&&<p role="status" className={s.notice}>{notice}</p>}
   <div className={s.sectionHead}><h2 className="section-title">Álbumes por actividad</h2><span>Organizados por fecha de actividad</span></div>
   {!visible.length?<div className={s.empty}><SystemIcon name="camera" className="size-9"/><h2>{albums.length?'No hay álbumes para estos filtros':'Todavía no hay fotos para redes'}</h2><p>{albums.length?'Prueba con otro mes o cambia la búsqueda.':'Las fotos aparecerán aquí cuando el equipo las añada a cada actividad.'}</p>{albums.length>0&&<button className={s.secondary} onClick={()=>{setMonth('');setQuery('');}}>Ver todos los álbumes</button>}</div>:<>
     <div className={s.albums}>{visible.slice(0,limit).map(album=>{const date=firstDate(album),cover=album.photos[0];return <article className={s.album} key={album.id}>
       <button className={s.cover} onClick={()=>open(album)} aria-label={`Ver fotos de ${album.title}`}><img src={socialPhotoUrl(cover)} alt={cover.caption} loading="lazy"/><span><SystemIcon name="camera" className="size-3.5"/>{album.photos.length} {album.photos.length===1?'foto disponible':'fotos disponibles'}</span></button>
       <div className={s.thumbnails}>{album.photos.map((p,i)=><button key={p.id} onClick={()=>open(album,i)} aria-label={`Ver foto ${i+1} de ${album.title}`}><img src={socialPhotoUrl(p)} alt="" loading="lazy"/></button>)}</div>
       <div className={s.albumBody}><div className={s.meta}><span>{date?dateFormat.format(new Date(date+'T12:00:00Z')):'Sin fecha'}</span><span>{album.type}</span></div><h3>{album.title}</h3><p className={s.place}><SystemIcon name="location" className="size-4"/>{album.place||'Lugar por indicar'}</p><div className={s.albumActions}><button className={s.primary} onClick={()=>open(album)}>Ver {album.photos.length===1?'la foto':`las ${album.photos.length} fotos`}<SystemIcon name="arrow-right" className="size-4"/></button><button className={s.secondary} disabled={downloading} onClick={()=>void downloadAlbums([album])} aria-label={`Descargar álbum de ${album.title}`}><SystemIcon name="import" className="size-5"/></button></div></div>
     </article>;})}</div>
     {visible.length>limit&&<button className={s.secondary} onClick={()=>setLimit(n=>n+12)}>Mostrar más álbumes</button>}
     <aside className={s.downloadBar}><SystemIcon name="import" className="size-6"/><div><strong>Una actividad. Sus fotos, juntas.</strong><p>Elige una toma o descarga la selección completa.</p></div><button className={s.secondary} disabled={downloading||!total} onClick={()=>void downloadAlbums(visible)}>{downloading?'Preparando…':month?'Descargar el mes':'Descargar selección'}</button></aside>
   </>}
   {selection&&photo&&<dialog ref={dialog} className={s.dialog} aria-label={`Fotos de ${selection.album.title}`} onCancel={e=>{e.preventDefault();setSelection(null);}}>
     <header><div><p className="data-label text-cyan-ink">Foto {selection.index+1} de {selection.album.photos.length}</p><h2 className="display-title">{selection.album.title}</h2></div><button className={s.secondary} onClick={()=>setSelection(null)}>Cerrar</button></header>
     <img className={s.fullPhoto} src={socialPhotoUrl(photo,'image')} alt={photo.caption}/>
     <div className={s.viewerStrip}>{selection.album.photos.map((p,i)=><button key={p.id} className={i===selection.index?s.selected:''} aria-label={`Seleccionar foto ${i+1}`} aria-pressed={i===selection.index} onClick={()=>setSelection({...selection,index:i})}><img src={socialPhotoUrl(p)} alt=""/></button>)}</div>
     <footer><p>{photo.caption}</p><a className={s.primary} href={socialPhotoUrl(photo,'download')} download><SystemIcon name="import" className="size-4"/>Descargar foto</a><Link className={s.detailLink} href={`/aunor/actividades/${encodeURIComponent(selection.album.id)}`}>Ver actividad</Link></footer>
   </dialog>}
 </div>;
}
