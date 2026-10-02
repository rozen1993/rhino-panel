import { AnnualCalendar } from "@/components/annual-calendar";
import { HistoricalEntry } from "@/components/historical-entry";
import { MobileShell, requireRole } from "@/components/mobile-shell";
import { resolveDataSource } from "@/lib/data-source";
import { calendarDateInLima, parseHistoricalCategory, parseHistoricalYear } from "@/lib/historical";
import { listSupabaseTeamHistoricalActivities } from "@/lib/supabase/historical";
import { Suspense } from "react";
import { WorkspaceLoading } from "@/components/workspace-loading";

export default async function HistoricalPage({
  searchParams,
}: PageProps<"/historico">) {
  const role = await requireRole((item) => item.id === "admin" || item.id === "operario");
  return <MobileShell active="Histórico" role={role}>
    <main className="mx-auto max-w-[1700px] p-3 md:p-5 xl:p-6">
      <Suspense fallback={<WorkspaceLoading label="Abriendo tu histórico" description="Estamos consultando las actividades del calendario." section="Histórico"/>}>
        <HistoricalContent searchParams={searchParams}/>
      </Suspense>
    </main>
  </MobileShell>;
}

async function HistoricalContent({searchParams}: Pick<PageProps<"/historico">,"searchParams">) {
  const params = await searchParams;
  const year = parseHistoricalYear(params.anio);
  const category = parseHistoricalCategory(params.tipo);
  // Old year-only links still open the annual calendar; unknown categories return to the entry.
  const showCalendar = Boolean(category) || params.tipo === "todos" || (params.tipo === undefined && params.anio !== undefined);
  const today = calendarDateInLima();
  const dataSource = resolveDataSource();
  const activities =
    showCalendar && dataSource === "supabase"
      ? await listSupabaseTeamHistoricalActivities(year)
      : [];
  return showCalendar ? <AnnualCalendar
          category={category}
          dataSource={dataSource}
          initialActivities={activities}
          key={`${dataSource}-${year}-${category ?? "todos"}`}
          today={today}
          year={year}
        /> : <HistoricalEntry year={year} />;
}
