import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/card";
import { MobileShell } from "@/components/mobile-shell";
import { StatusPill } from "@/components/status-pill";
import { SystemIcon } from "@/components/system-icon";
import { activities, getActivity } from "@/lib/activities";

const observedHistory = [
  ["Observada", "Chiara", "12 ago 09:18"],
  ["Por subir", "Johann", "12 ago 08:54"],
  ["En proceso", "Johann", "12 ago 07:58"],
  ["Programada", "Chiara", "10 ago 16:30"],
] as const;

export function generateStaticParams() {
  return [...activities.map(({ id }) => ({ id })), { id: "aprobada" }];
}

export default async function ActivityDetailPage({ params }: PageProps<"/actividades/[id]">) {
  const { id } = await params;
  const base = id === "aprobada" ? getActivity("peaje-chillon") : getActivity(id);
  if (!base) notFound();
  const activity = id === "aprobada" ? { ...base, status: "Aprobada" as const } : base;
  const approved = activity.status === "Aprobada";
  const observed = activity.status === "Observada";

  return (
    <MobileShell backHref="/actividades">
      <main className="space-y-3 px-3 py-4 md:px-6 md:py-6 lg:px-7">
        <header><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-blue">Ficha de producción</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Detalle de actividad</h1></header>

        {observed && <div className="border-l-4 border-observed bg-red/10 p-3 text-sm font-bold text-observed">! Esta actividad espera tu corrección.</div>}
        {approved && <div className="rounded-[5px] bg-ink p-4 text-white"><p className="text-sm font-bold uppercase tracking-[0.14em]">★ Actividad aprobada</p><p className="mt-1 text-xs">Cerrada · sin edición</p></div>}

        <div className="space-y-3 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-5 lg:space-y-0 lg:[&>section:last-of-type]:col-start-2 lg:[&>section:last-of-type]:row-start-1 lg:[&>section:last-of-type]:row-span-4">
        <Card className="p-4">
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-blue">{activity.type}</p><h2 className="mt-1 text-lg font-bold leading-6">{activity.title}</h2></div><StatusPill status={activity.status} /></div>
          <dl className="mt-4 grid grid-cols-[7.25rem_1fr] gap-x-2 gap-y-2 border-t border-line pt-4 text-sm">
            <dt className="font-bold">Fecha</dt><dd>Hoy, 08:30</dd>
            <dt className="font-bold">Responsable</dt><dd>Johann</dd>
            <dt className="font-bold">Creada por</dt><dd>Chiara</dd>
            <dt className="font-bold">Descripción</dt><dd>Cobertura audiovisual del mantenimiento preventivo en la caseta norte.</dd>
            <dt className="font-bold">Entrega prevista</dt><dd>12 ago, 18:00</dd>
            <dt className="font-bold">Ubicación</dt><dd>peaje Chillón<br /><span className="text-ink-muted">caseta norte · Km 25.4<br />Norte → Sur</span></dd>
          </dl>
          <a className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-[5px] border border-line text-sm font-bold text-blue" href="https://onedrive.live.com/" rel="noreferrer" target="_blank"><SystemIcon className="size-5" name="link" /> Abrir enlace al material</a>
        </Card>

        {observed && <section aria-labelledby="conversation-title"><h2 className="mb-2 text-xs font-bold uppercase tracking-[0.12em]" id="conversation-title">Observación y respuesta</h2><div className="space-y-2"><Card className="border-observed bg-red/5 p-3"><p className="text-xs font-bold uppercase text-observed">Chiara · 12 ago 09:18</p><p className="mt-2 text-sm leading-5">«El plano del panel variable termina antes de mostrar el tránsito. Añade 8 segundos y nivela el audio ambiente.»</p></Card><Card className="border-blue bg-blue/5 p-3"><p className="text-xs font-bold uppercase text-blue">Johann · 12 ago 10:42</p><p className="mt-2 text-sm leading-5">«Plano extendido y audio nivelado. Reemplacé el archivo en el mismo enlace.»</p></Card></div></section>}

        <section aria-labelledby="history-title"><h2 className="mb-2 text-xs font-bold uppercase tracking-[0.12em]" id="history-title">Historial de estado</h2><Card className="divide-y divide-line">{observedHistory.map(([status, person, moment]) => <div className="flex items-center justify-between gap-2 p-3 text-xs" key={status}><StatusPill status={status} /><span className="text-right text-ink-muted">{person}<br />{moment}</span></div>)}</Card></section>

        <Card className="p-3 text-xs text-ink-muted">Última modificación: <strong className="text-ink">hoy 10:42 por Johann</strong></Card>

        {!approved && <div className="grid grid-cols-2 gap-2"><Link className="flex min-h-11 items-center justify-center rounded-[5px] border border-line bg-panel text-sm font-bold text-blue" href={`/actividades/nueva?editar=${activity.id}`}>Editar</Link><button className="min-h-11 rounded-[5px] border border-amber bg-amber px-3 text-sm font-bold">Avanzar de estado</button></div>}
        </div>
      </main>
    </MobileShell>
  );
}
