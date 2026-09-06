import { AnnualCalendar } from "@/components/annual-calendar";
import { HistoricalEntry } from "@/components/historical-entry";
import { MobileShell, requireRole } from "@/components/mobile-shell";
import { resolveDataSource } from "@/lib/data-source";
import { calendarDateInLima, parseHistoricalCategory, parseHistoricalYear } from "@/lib/historical";
import { listSupabaseHistoricalActivities } from "@/lib/supabase/historical";

export default async function HistoricalPage({
  searchParams,
}: PageProps<"/historico">) {
  const role = await requireRole((item) => item.id === "admin");
  const params = await searchParams;
  const year = parseHistoricalYear(params.anio);
  const category = parseHistoricalCategory(params.tipo);
  // Old year-only links still open the annual calendar; unknown categories return to the entry.
  const showCalendar = Boolean(category) || params.tipo === "todos" || (params.tipo === undefined && params.anio !== undefined);
  const today = calendarDateInLima();
  const dataSource = resolveDataSource();
  const activities =
    showCalendar && dataSource === "supabase"
      ? await listSupabaseHistoricalActivities(year)
      : [];
  return (
    <MobileShell active="Histórico" role={role}>
      <main className="mx-auto max-w-[1700px] p-3 md:p-5 xl:p-6">
        {showCalendar ? <AnnualCalendar
          category={category}
          dataSource={dataSource}
          initialActivities={activities}
          key={`${dataSource}-${year}-${category ?? "todos"}`}
          today={today}
          year={year}
        /> : <HistoricalEntry year={year} />}
      </main>
    </MobileShell>
  );
}
