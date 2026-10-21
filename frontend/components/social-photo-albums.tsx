'use client';
/* eslint-disable @next/next/no-img-element -- Private authenticated images bypass public optimizer caches. */
import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import Image from 'next/image';
import {SystemIcon} from './system-icon';
import {firstDate,effectiveSpans} from '@/lib/activities';
import {safeOneDriveFolder,socialPhotoUrl,type SocialAlbum,type SocialPhoto} from '@/lib/social-photos';
import s from './social-photos.module.css';
const dateFormat=new Intl.DateTimeFormat('es-PE',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
function AlbumImage({photo,full=false}:{photo:SocialPhoto;full?:boolean}) {
 const src=socialPhotoUrl(photo,full?'image':'thumb');
 return photo.previewUrl?<Image src={src} alt={photo.caption} width={1200} height={800} sizes={full?'90vw':'(max-width:700px) 100vw, 30vw'} className={full?s.fullPhoto:undefined}/>:<img src={src} alt={photo.caption} loading={full?'eager':'lazy'} className={full?s.fullPhoto:undefined}/>;
}
export function SocialPhotoAlbums({albums,examples=[],today,loadError=''}:{albums:SocialAlbum[];examples?:SocialAlbum[];today:string;loadError?:string}) {
 const [month,setMonth]=useState(today.slice(0,7)),[query,setQuery]=useState(''),[limit,setLimit]=useState(12);
 const [selection,setSelection]=useState<{album:SocialAlbum;index:number}|null>(null),[notice,setNotice]=useState(''),[downloading,setDownloading]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLElement|null>(null),router=useRouter();
 const start=month+'-01',end=month?`${month}-${new Date(Number(month.slice(0,4)),Number(month.slice(5,7)),0).getDate()}`:'';
 const visible=albums.filter(a=>!a.sample&&(!month||effectiveSpans(a).some(j=>j.start<=end&&j.end>=start))&&`${a.title} ${a.place}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
   .sort((a,b)=>firstDate(b).localeCompare(firstDate(a))||a.title.localeCompare(b.title));
 const hasSelection=selection!==null;
 useEffect(()=>{if(!hasSelection)return;const element=dialog.current;element?.showModal();const before=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{element?.close();document.body.style.overflow=before;trigger.current?.focus({preventScroll:true});};},[hasSelection]);
 function open(album:SocialAlbum,index=0){trigger.current=document.activeElement as HTMLElement;setSelection({album,index});}
 async function download(album:SocialAlbum,index?:number){
  if(downloading)return;setDownloading(true);setNotice('Preparando descarga…');
  try {
   const chosen=index===undefined?album.photos:album.photos.slice(index,index+1);if(!chosen.length||chosen.length>3)throw Error('Actualiza el álbum antes de descargar.');
   const name=(album.sample?'ejemplo-':'')+album.title.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9-]/g,'-').slice(0,80);
   const files=[];let total=0;
   for(const [position,photo] of chosen.entries()){
    const response=await fetch(socialPhotoUrl(photo,'download'),{cache:'no-store'});
    if(!response.ok||!response.headers.get('content-type')?.startsWith('image/'))throw Error('No se pudo descargar la foto. Actualiza la página y revisa tu sesión.');
    const bytes=new Uint8Array(await response.arrayBuffer());total+=bytes.length;if(total>12*1024*1024)throw Error('El álbum supera el límite de descarga. Descarga las fotos una por una.');
    files.push({name:`${name}-${(index??position)+1}.${photo.previewUrl?'png':'jpg'}`,bytes,type:response.headers.get('content-type')!});
   }
   const content=files.length===1?files[0].bytes:(await import('@/lib/photo-zip')).createPhotoZip(files);
   const blob=new Blob([new Uint8Array(content)],{type:files.length===1?files[0].type:'application/zip'}),url=URL.createObjectURL(blob),anchor=document.createElement('a');
   anchor.href=url;anchor.download=files.length===1?files[0].name:`${name}.zip`;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),60_000);
   setNotice(album.sample?'Imagen de muestra descargada; no corresponde a una entrega real.':'Descarga preparada. Ya puedes usar la foto en tus redes.');
  }catch(error){setNotice(error instanceof Error?error.message:'No se pudo preparar la descarga.');}finally{setDownloading(false);}
 }
 function card(album:SocialAlbum){
  const date=firstDate(album),cover=album.photos[0],folder=safeOneDriveFolder(album.folderUrl??'');
  return <article className={s.album} key={album.id}>
   {cover?<button className={s.cover} onClick={()=>open(album)} aria-label={`${album.sample?'Ver muestra':'Ver fotos'} de ${album.title}`}><AlbumImage photo={cover}/><span><SystemIcon name="camera" className="size-3.5"/>{album.sample?'Vista de muestra':`${album.photos.length} ${album.photos.length===1?'foto':'fotos'} para redes`}</span></button>:<div className={s.folderCover}><SystemIcon name="camera" className="size-10"/><strong>Fotos pendientes</strong><p>El equipo todavía no ha añadido la selección para redes.</p></div>}
   {album.photos.length>1&&<div className={s.thumbnails}>{album.photos.map((photo,index)=><button key={photo.id} onClick={()=>open(album,index)} aria-label={`Ver foto ${index+1} de ${album.title}`}><AlbumImage photo={photo}/></button>)}</div>}
   <div className={s.albumBody}><div className={s.meta}><span>{album.sample?'Ejemplo de presentación':date?dateFormat.format(new Date(date+'T12:00:00Z')):'Sin fecha'}</span><span>{album.type}</span></div><h3>{album.title}</h3><p className={s.place}><SystemIcon name="location" className="size-4"/>{album.place||'Lugar por indicar'}</p>
    <div className={s.albumActions}><div className={s.downloadActions}><button className={s.primary} disabled={!cover} onClick={()=>open(album)}>{album.sample?'Ver muestra':album.photos.length===1?'Ver foto':'Ver fotos'}<SystemIcon name="arrow-right" className="size-4"/></button><button className={s.secondary} disabled={!cover||downloading} onClick={()=>void download(album)} aria-label={`Descargar ${album.sample?'muestra':album.photos.length===1?'foto':'álbum'} de ${album.title}`}><SystemIcon name="import" className="size-5"/></button></div>
     {folder&&<a className={s.originalLink} href={folder} target="_blank" rel="noopener noreferrer"><SystemIcon name="link" className="size-4"/>Ver originales en OneDrive ↗</a>}
    </div>
   </div>
  </article>;
 }
 const photo=selection?.album.photos[selection.index],selectedFolder=safeOneDriveFolder(selection?.album.folderUrl??'');
 return <div className={s.page}>
  <header className={s.heading}><div><p className="data-label text-cyan-ink">Espacio Aunor / fotografía</p><h1 className="display-title">Social</h1><p className={s.subtitle}>Las mejores tomas de cada actividad, listas para descargar y publicar.</p></div><button className={s.secondary} onClick={()=>router.refresh()}>Actualizar</button></header>
  <aside className={s.downloadBar}><SystemIcon name="import" className="size-6"/><div><strong>Elige una foto. Descárgala. Compártela.</strong><p>Copias optimizadas para redes, directamente desde la plataforma. Los originales permanecen en OneDrive.</p></div></aside>
  <div className={s.filters}><label className={s.search}><SystemIcon name="search" className="size-4"/><input aria-label="Buscar álbum" type="search" placeholder="Buscar actividad" value={query} onChange={e=>{setQuery(e.target.value);setLimit(12);}}/></label><label className={s.month}><span>Consultar mes</span><input aria-label="Mes de las fotos" type="month" min="2026-01" value={month} onChange={e=>{setMonth(e.target.value);setLimit(12);}}/></label><p className={s.count} role="status">{loadError?'Consulta no disponible':`${visible.length} álbumes · ${visible.reduce((n,a)=>n+a.photos.length,0)} fotos`}</p></div>
  {notice&&<p role="status" className={s.notice}>{notice}</p>}
  <section aria-labelledby="social-albums-heading"><div className={s.sectionHead}><h2 id="social-albums-heading" className="section-title">Álbumes por actividad</h2><span>Organizados por fecha de actividad</span></div>
   {loadError?<p role="alert" className={s.notice}>{loadError}</p>:!visible.length?<div className={examples.length?s.emptyCompact:s.empty}><SystemIcon name="camera" className="size-6"/><div><h3>{albums.length?'No hay álbumes para estos filtros':'Todavía no hay fotos publicadas'}</h3><p>{albums.length?'Prueba con otro mes o cambia la búsqueda.':'Las fotos aparecerán cuando el equipo guarde su selección en Social.'}</p></div>{albums.length>0&&<button className={s.secondary} onClick={()=>{setMonth('');setQuery('');}}>Ver todos los álbumes</button>}</div>:<><div className={s.albums}>{visible.slice(0,limit).map(card)}</div>{visible.length>limit&&<button className={s.secondary} onClick={()=>setLimit(n=>n+12)}>Mostrar más álbumes</button>}</>}
  </section>
  {examples.length>0&&<section className={s.sampleSection} aria-labelledby="social-examples-heading"><div className={s.sectionHead}><div><p className="data-label text-cyan-ink">Vista de presentación</p><h2 id="social-examples-heading" className="section-title">Así se verán tus álbumes</h2></div><span className={s.sampleBadge}>{examples.length} ejemplos · no son trabajos reales</span></div><p className={s.sampleIntro}>Imágenes generadas de muestra. Puedes ampliarlas o descargar el ejemplo; no cuentan como actividades ni entregas.</p><div className={s.albums}>{examples.filter(a=>a.sample).map(card)}</div></section>}
  {selection&&photo&&<dialog ref={dialog} className={s.dialog} aria-label={`${selection.album.sample?'Muestra':'Fotos'} de ${selection.album.title}`} onCancel={e=>{e.preventDefault();setSelection(null);}}>
   <header><div><p className="data-label text-cyan-ink">{selection.album.sample?'Imagen de muestra · presentación':`Foto ${selection.index+1} de ${selection.album.photos.length}`}</p><h2 className="display-title">{selection.album.title}</h2></div><button className={s.secondary} onClick={()=>setSelection(null)}>Cerrar</button></header>
   <AlbumImage photo={photo} full/>
   {selection.album.photos.length>1&&<div className={s.viewerStrip}>{selection.album.photos.map((p,index)=><button key={p.id} className={index===selection.index?s.selected:''} aria-pressed={index===selection.index} aria-label={`Seleccionar foto ${index+1}`} onClick={()=>setSelection({...selection,index})}><AlbumImage photo={p}/></button>)}</div>}
   <footer><p>{photo.caption}{selection.album.sample?' No corresponde a una entrega real.':''}</p><div className={s.viewerDownload}><button className={s.primary} disabled={downloading} onClick={()=>void download(selection.album,selection.index)}><SystemIcon name="import" className="size-4"/>{downloading?'Preparando…':selection.album.sample?'Descargar muestra':'Descargar foto'}</button>{selectedFolder&&<a className={s.originalLink} href={selectedFolder} target="_blank" rel="noopener noreferrer">Ver originales en OneDrive ↗</a>}</div>{notice&&<p role="status">{notice}</p>}</footer>
  </dialog>}
 </div>;
}
