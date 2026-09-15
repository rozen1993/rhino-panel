"use client";

import { useEffect, useRef, useState } from "react";
import { IntentLink as Link } from "@/components/intent-link";
import { Card } from "@/components/card";
import { StatusPill } from "@/components/status-pill";
import { SummaryTile } from "@/components/summary-tile";
import { SystemIcon, type IconName } from "@/components/system-icon";
import { MonthStrip, months } from "@/components/month-strip";
import { aunorCode, type AunorWorkspace } from "@/lib/aunor";
import { aunorVisibleUntil, isCurrentAunorActivity } from "@/lib/aunor-visibility";
import { safeMaterialUrl } from "@/lib/external-link";

const input = "min-h-11 min-w-0 rounded-md border border-line bg-panel px-3 text-sm";
const day = (value: string) => new Intl.DateTimeFormat("es-PE", {day:"numeric",month:"short",year:"numeric",timeZone:"UTC"}).format(new Date(value+"T12:00:00Z"));
const href = (id: string) => `/aunor/actividades/${encodeURIComponent(id)}`;

export function AunorDashboard({w, today, initialNow}: {w:AunorWorkspace; today:string; initialNow:number}) {
  const [now,setNow] = useState(initialNow);
  const [query,setQuery] = useState("");
  const [status,setStatus] = useState("");
  const [category,setCategory] = useState("");
  const [year,setYear] = useState(Number(today.slice(0,4)));
  const [month,setMonth] = useState<number | null>(null);
  const [selected,setSelected] = useState("");
  const preview = useRef<HTMLHeadingElement>(null);
  const clock = useRef<{server:number; local:number} | null>(null);
  // Expire without requiring a reload, also after a background tab wakes up.
  useEffect(() => {
    if(!clock.current || clock.current.server!==initialNow) clock.current={server:initialNow,local:performance.now()};
    const anchor=clock.current;
    const serverNow=()=>anchor.server+performance.now()-anchor.local;
    const tick = () => setNow(serverNow());
    const next = Math.min(...w.activities.map(a => aunorVisibleUntil(a) ?? Infinity).filter(until => until > now));
    const timer = window.setTimeout(tick, Math.max(1, Math.min(next-serverNow(),60_000)));
    window.addEventListener("focus",tick);
    document.addEventListener("visibilitychange",tick);
    return () => { clearTimeout(timer); window.removeEventListener("focus",tick); document.removeEventListener("visibilitychange",tick); };
  },[w.activities,now,initialNow]);
  const current = w.activities.filter(a => isCurrentAunorActivity(a,now));
  const journeys = (id:string) => w.journeys.filter(j => j.activity_id === id);
  const overlaps = (id:string,m:number) => {
    const start = `${year}-${String(m+1).padStart(2,"0")}-01`;
    const end = `${year}-${String(m+1).padStart(2,"0")}-${new Date(Date.UTC(year,m+1,0)).getUTCDate()}`;
    return journeys(id).some(j => j.start_date <= end && j.end_date >= start);
  };
  // Default includes ALL active work, even unfinished work from earlier months.
  const period = current.filter(a => month === null || overlaps(a.id,month));
  const visible = period.filter(a => (!status || a.status===status) && (!category || a.type===category) &&
    `${a.title} ${a.summary} ${a.place} ${aunorCode(a.id,a.type)}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const chosen = visible.find(a => a.id===selected) ?? visible[0];
  const stats: {label:string;count:number;icon:IconName;color:string}[] = [
    {label:"actividades",count:period.length,icon:"activities",color:"bg-cyan text-night"},
    {label:"programadas",count:period.filter(a=>a.status==="Programada").length,icon:"calendar",color:"bg-violet text-white"},
    {label:"en proceso",count:period.filter(a=>a.status==="En proceso").length,icon:"progress",color:"bg-[#2563eb] text-white"},
    {label:"entregadas",count:period.filter(a=>a.status==="Entregada").length,icon:"complete",color:"bg-lime text-night"},
  ];
  const years = [...new Set([Number(today.slice(0,4)),...w.journeys.flatMap(j=>[Number(j.start_date.slice(0,4)),Number(j.end_date.slice(0,4))])])].sort((a,b)=>b-a);
  return <div className="space-y-4">
    <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div><p className="data-label text-cyan-ink">Seguimiento de actividades · solo lectura</p><p className="mt-1 text-sm text-ink-muted">Las entregadas permanecen aquí durante 3 días; después puedes consultarlas en Histórico.</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={`${input} font-semibold ${month===null ? "bg-cyan/10 text-cyan-ink" : ""}`} aria-pressed={month===null} onClick={()=>setMonth(null)}>Todas las fechas</button>
        <label><span className="sr-only">Año del filtro mensual</span><select className={input} value={year} onChange={e=>setYear(Number(e.target.value))}>{years.map(y=><option key={y}>{y}</option>)}</select></label>
      </div>
    </Card>
    <MonthStrip key={year} year={year} initialMonth={Number(today.slice(5,7))-1} activeMonth={month===null ? undefined : months[month]} counts={months.map((_,i)=>current.filter(a=>overlaps(a.id,i)).length)} onSelect={setMonth}/>
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{stats.map(stat=><SummaryTile key={stat.label} icon={<SystemIcon name={stat.icon} className="size-5"/>} iconClassName={stat.color} value={stat.count} label={stat.label} detail={month===null ? "Todas las fechas" : `${months[month]} ${year}`}/>)}</div>
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <Card className="min-w-0 overflow-hidden">
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-line p-4">
          <div><h2 className="section-title">Actividad reciente</h2><p className="mt-2 text-xs text-ink-muted" role="status">{visible.length} de {period.length} actividades visibles</p></div>
          <div className="flex w-full flex-wrap gap-2">
            <label className="min-w-0 flex-1"><span className="sr-only">Buscar actividad</span><input className={`${input} w-full`} placeholder="Buscar actividad" value={query} onChange={e=>setQuery(e.target.value)}/></label>
            <label><span className="sr-only">Estado</span><select className={input} value={status} onChange={e=>setStatus(e.target.value)}><option value="">Todos los estados</option>{["Programada","En proceso","Entregada"].map(v=><option key={v}>{v}</option>)}</select></label>
            <label><span className="sr-only">Categoría</span><select className={input} value={category} onChange={e=>setCategory(e.target.value)}><option value="">Todas las categorías</option>{[...new Set(w.activities.map(a=>a.type))].map(v=><option key={v}>{v}</option>)}</select></label>
          </div>
        </header>
        <div className="hidden grid-cols-[1fr_2fr_1fr_1fr_3rem] gap-3 border-b border-line bg-panel-secondary px-4 py-3 text-xs font-bold uppercase text-ink-muted md:grid" aria-hidden="true"><span>Fechas</span><span>Actividad</span><span>Lugar</span><span>Estado</span><span>Ver</span></div>
        <ul className="divide-y divide-line/40">{visible.map(a=><li key={a.id}>
          <button type="button" aria-label={`Ver detalles: ${a.title}`} aria-pressed={chosen?.id===a.id} onClick={()=>{
            setSelected(a.id);
            if(window.matchMedia("(max-width: 1279px)").matches) preview.current?.focus();
          }} className={`grid w-full grid-cols-[1fr_auto] items-center gap-3 px-4 py-4 text-left transition hover:bg-cyan/10 md:grid-cols-[1fr_2fr_1fr_1fr_3rem] ${chosen?.id===a.id ? "bg-cyan/5" : ""}`}>
            <span className="text-xs font-semibold text-cyan-ink">{journeys(a.id).length ? day(journeys(a.id)[0].start_date) : "Fecha por indicar"}</span>
            <span className="order-first col-span-2 min-w-0 md:order-none md:col-span-1"><strong className="block text-sm">{a.title}</strong><span className="mt-1 block text-xs text-ink-muted">{a.type}</span></span>
            <span className="hidden truncate text-xs text-ink-muted md:block">{a.place || journeys(a.id)[0]?.place || "Por indicar"}</span>
            <StatusPill status={a.status}/><SystemIcon name="eye" className="hidden size-5 justify-self-center md:block"/>
          </button>
        </li>)}</ul>
        {!visible.length && <p className="p-6 text-sm text-ink-muted">{current.length ? "No hay actividades que coincidan con estos filtros." : "No hay actividades en seguimiento. Las anteriores siguen disponibles en Histórico."}</p>}
      </Card>
      {chosen && <Card className="overflow-hidden border-t-[3px] border-t-cyan p-5 xl:sticky xl:top-4" aria-label="Vista previa de actividad">
        <div className="flex flex-wrap items-center justify-between gap-2"><p className="data-label text-cyan-ink">{chosen.type}</p><StatusPill status={chosen.status}/></div>
        <h2 ref={preview} tabIndex={-1} className="section-title mt-4 scroll-mt-4 break-words">{chosen.title}</h2>
        <p className="mt-4 line-clamp-4 whitespace-pre-line text-sm leading-6 text-ink-muted">{chosen.summary}</p>
        <div className="my-4 space-y-3 border-y border-line/40 py-4">{journeys(chosen.id).map(j=><p key={j.position} className="text-sm"><strong className="block">{day(j.start_date)}{j.start_date!==j.end_date ? ` – ${day(j.end_date)}` : ""}</strong><span className="text-ink-muted">{j.place || chosen.place || "Lugar por indicar"}</span></p>)}</div>
        <Link href={href(chosen.id)} className="flex min-h-11 items-center justify-center rounded-md bg-lime px-4 text-sm font-bold text-night">Ver actividad completa →</Link>
        {chosen.status==="Entregada" && safeMaterialUrl(chosen.material_link ?? "") && <a className="mt-3 flex min-h-11 items-center justify-center text-sm font-semibold text-cyan-ink" href={safeMaterialUrl(chosen.material_link!)!} target="_blank" rel="noopener noreferrer">Abrir material ↗</a>}
      </Card>}
    </div>
  </div>;
}
