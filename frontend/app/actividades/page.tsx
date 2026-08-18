import Link from "next/link";
import { ActivityCard } from "@/components/activity-card";
import { ActivityTable } from "@/components/activity-table";
import { MobileShell } from "@/components/mobile-shell";
import { MonthStrip } from "@/components/month-strip";
import { SummaryTile } from "@/components/summary-tile";
import { SystemIcon } from "@/components/system-icon";
import { activities, monthCounts } from "@/lib/activities";

export default async function ActivitiesPage({ searchParams }: PageProps<"/actividades">) {
  const coordination = (await searchParams).rol === "coord";

  return (
    <MobileShell coordination={coordination} initials={coordination ? "CH" : "JV"} user={coordination ? "Chiara" : "Johann"}>
      <main className="space-y-4 px-3 py-4 md:px-6 md:py-6 lg:px-7">
        <header className="flex items-end justify-between gap-3">
          <div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-blue">Agosto 2026</p><h1 className="mt-1 text-2xl font-bold tracking-tight">{coordination ? "Actividades" : "Mis actividades"}</h1></div>
          <Link className="text-xs font-bold text-blue underline underline-offset-4" href="/historial">Ver historial</Link>
        </header>

        <MonthStrip activeMonth="AGO" counts={monthCounts} />

        <section aria-label="Resumen mensual" className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-4">
          <SummaryTile detail="Este mes" icon={<SystemIcon className="size-6" name="activities" />} iconClassName="bg-blue text-white" label="Total" value={5} />
          <SummaryTile detail="Por iniciar" icon={<SystemIcon className="size-6" name="calendar" />} iconClassName="bg-red text-white" label="Programadas" value={1} />
          <SummaryTile detail="Trabajo activo" icon={<SystemIcon className="size-6" name="progress" />} iconClassName="bg-turquoise text-white" label="En proceso" value={1} />
          <SummaryTile detail="Entregadas" icon={<SystemIcon className="size-6" name="complete" />} iconClassName="bg-green text-ink" label="Finalizadas" value={1} />
        </section>

        <section aria-labelledby="activity-list-title" className="space-y-2">
          <div className="flex items-center justify-between"><h2 className="text-sm font-bold uppercase tracking-[0.1em]" id="activity-list-title">Trabajo diario</h2><span className="text-xs text-ink-muted">5 actividades</span></div>
          <div className="space-y-2 lg:hidden">{activities.map((activity) => <ActivityCard activity={activity} key={activity.id} showResponsible={coordination} />)}</div>
          <ActivityTable activities={activities} showResponsible={coordination} />
        </section>

        <Link className="sticky bottom-[4.75rem] flex min-h-12 w-full items-center justify-center rounded-[5px] border border-amber bg-amber px-5 py-2 text-sm font-bold text-ink lg:static lg:ml-auto lg:w-fit" href="/actividades/nueva">＋ Nueva actividad</Link>
      </main>
    </MobileShell>
  );
}
