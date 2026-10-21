'use client';
import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import Image from 'next/image';
import {SystemIcon} from './system-icon';
import {firstDate,effectiveSpans} from '@/lib/activities';
import {safeOneDriveFolder,type SocialAlbum} from '@/lib/social-photos';
import s from './social-photos.module.css';

const dateFormat=new Intl.DateTimeFormat('es-PE',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
export function SocialPhotoAlbums({albums,examples=[],today,loadError=''}:{albums:SocialAlbum[];examples?:SocialAlbum[];today:string;loadError?:string}) {
  const [month,setMonth]=useState(today.slice(0,7)),[query,setQuery]=useState(''),[limit,setLimit]=useState(12);
  const [selection,setSelection]=useState<SocialAlbum|null>(null);
  const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLElement|null>(null),router=useRouter();
  const start=month+'-01',end=month?`${month}-${new Date(Number(month.slice(0,4)),Number(month.slice(5,7)),0).getDate()}`:'';
  const visible=albums.filter(a=>!a.sample&&(!month||effectiveSpans(a).some(j=>j.start<=end&&j.end>=start))&&`${a.title} ${a.place}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
    .sort((a,b)=>firstDate(b).localeCompare(firstDate(a))||a.title.localeCompare(b.title));
  const hasSelection=selection!==null;
  useEffect(()=>{if(!hasSelection)return;const element=dialog.current;element?.showModal();const before=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{element?.close();document.body.style.overflow=before;trigger.current?.focus({preventScroll:true});};},[hasSelection]);
  function open(album:SocialAlbum){trigger.current=document.activeElement as HTMLElement;setSelection(album);}
  function card(album:SocialAlbum) {
    const date=firstDate(album),cover=album.photos[0],folder=safeOneDriveFolder(album.folderUrl??'');
    return <article className={s.album} key={album.id}>
      {album.sample&&cover?<button className={s.cover} onClick={()=>open(album)} aria-label={`Ver muestra de ${album.title}`}>
        <Image src={cover.previewUrl} alt={cover.caption} fill sizes="(max-width:700px) 100vw, (max-width:1250px) 45vw, 30vw"/>
        <span><SystemIcon name="camera" className="size-3.5"/>Vista de muestra</span>
      </button>:<div className={s.folderCover}><SystemIcon name="camera" className="size-10"/><strong>Fotos en OneDrive</strong><p>La selección del equipo, en su carpeta original.</p></div>}
      <div className={s.albumBody}><div className={s.meta}><span>{album.sample?'Ejemplo de presentación':date?dateFormat.format(new Date(date+'T12:00:00Z')):'Sin fecha'}</span><span>{album.type}</span></div>
        <h3>{album.title}</h3><p className={s.place}><SystemIcon name="location" className="size-4"/>{album.place||'Lugar por indicar'}</p>
        <div className={s.albumActions}>
          {folder?<a className={s.primary} href={folder} target="_blank" rel="noopener noreferrer" aria-label={`Abrir carpeta en OneDrive: ${album.title}`}><SystemIcon name="link" className="size-4"/>Abrir carpeta en OneDrive<SystemIcon name="arrow-right" className="size-4"/></a>:<button className={s.secondary} disabled><SystemIcon name="link" className="size-4"/>Carpeta pendiente</button>}
          {album.sample&&cover&&<button className={s.detailLink} onClick={()=>open(album)}>Ampliar imagen de muestra <span aria-hidden="true">↗</span></button>}
        </div>
      </div>
    </article>;
  }
  return <div className={s.page}>
    <header className={s.heading}><div><p className="data-label text-cyan-ink">Espacio Aunor / fotografía</p><h1 className="display-title">Social</h1><p className={s.subtitle}>Las mejores tomas de cada actividad, organizadas para tus publicaciones.</p></div><button className={s.secondary} onClick={()=>router.refresh()}>Actualizar</button></header>
    <aside className={s.downloadBar}><SystemIcon name="link" className="size-6"/><div><strong>Una actividad. Una carpeta compartida.</strong><p>Abre la carpeta de OneDrive para consultar las fotos originales. Su acceso depende de los permisos de la empresa.</p></div></aside>
    <div className={s.filters}><label className={s.search}><SystemIcon name="search" className="size-4"/><input aria-label="Buscar álbum" type="search" placeholder="Buscar actividad" value={query} onChange={e=>{setQuery(e.target.value);setLimit(12);}}/></label><label className={s.month}><span>Consultar mes</span><input aria-label="Mes de las fotos" type="month" min="2026-01" value={month} onChange={e=>{setMonth(e.target.value);setLimit(12);}}/></label><p className={s.count} role="status">{visible.length} {visible.length===1?'carpeta vinculada':'carpetas vinculadas'}</p></div>
    <section aria-labelledby="social-albums-heading"><div className={s.sectionHead}><h2 id="social-albums-heading" className="section-title">Álbumes por actividad</h2><span>Organizados por fecha de actividad</span></div>
      {loadError?<p role="alert" className={s.notice}>{loadError}</p>:!visible.length?<div className={examples.length?s.emptyCompact:s.empty}><SystemIcon name="camera" className="size-6"/><div><h3>{albums.length?'No hay álbumes para estos filtros':'Todavía no hay carpetas vinculadas'}</h3><p>{albums.length?'Prueba con otro mes o cambia la búsqueda.':'El equipo puede añadir el vínculo de OneDrive desde la ficha de cada actividad.'}</p></div>{albums.length>0&&<button className={s.secondary} onClick={()=>{setMonth('');setQuery('');}}>Ver todos los álbumes</button>}</div>:<><div className={s.albums}>{visible.slice(0,limit).map(card)}</div>{visible.length>limit&&<button className={s.secondary} onClick={()=>setLimit(n=>n+12)}>Mostrar más álbumes</button>}</>}
    </section>
    {examples.length>0&&<section className={s.sampleSection} aria-labelledby="social-examples-heading"><div className={s.sectionHead}><div><p className="data-label text-cyan-ink">Vista de presentación</p><h2 id="social-examples-heading" className="section-title">Así se verán tus álbumes</h2></div><span className={s.sampleBadge}>3 ejemplos · no son trabajos reales</span></div><p className={s.sampleIntro}>Imágenes generadas de muestra. No cuentan como actividades ni entregas. Los vínculos de las carpetas de la empresa se añadirán después.</p><div className={s.albums}>{examples.filter(a=>a.sample).map(card)}</div></section>}
    {selection?.photos[0]&&<dialog ref={dialog} className={s.dialog} aria-label={`Muestra de ${selection.title}`} onCancel={e=>{e.preventDefault();setSelection(null);}}>
      <header><div><p className="data-label text-cyan-ink">Imagen de muestra · presentación</p><h2 className="display-title">{selection.title}</h2></div><button className={s.secondary} onClick={()=>setSelection(null)}>Cerrar</button></header>
      <Image className={s.fullPhoto} src={selection.photos[0].previewUrl} alt={selection.photos[0].caption} width={1200} height={800} sizes="90vw"/>
      <footer><p>{selection.photos[0].caption} No corresponde a una entrega real.</p></footer>
    </dialog>}
  </div>;
}
