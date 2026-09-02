import { AnnualCalendar } from "@/components/annual-calendar";
import { MobileShell, requireRole } from "@/components/mobile-shell";
import { resolveDataSource } from "@/lib/data-source";
import { calendarDateInLima, parseHistoricalYear } from "@/lib/historical";
import { listSupabaseHistoricalActivities } from "@/lib/supabase/historical";

export default async function HistoricalPage({
  searchParams,
}: PageProps<"/historico">) {
  const role = await requireRole((item) => item.id === "admin");
  const year = parseHistoricalYear((await searchParams).anio);
  const today = calendarDateInLima();
  const dataSource = resolveDataSource();
  const activities =
    dataSource === "supabase"
      ? await listSupabaseHistoricalActivities(year)
      : [];
  return (
    <MobileShell active="Histórico" role={role}>
      <main className="mx-auto max-w-[1700px] p-3 md:p-5 xl:p-6">
        <AnnualCalendar
          dataSource={dataSource}
          initialActivities={activities}
          key={`${dataSource}-${year}`}
          today={today}
          year={year}
        />
      </main>
    </MobileShell>
  );
}
