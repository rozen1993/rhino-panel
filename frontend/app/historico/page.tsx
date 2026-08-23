import { AnnualCalendar } from "@/components/annual-calendar";
import { BackendPhaseNotice } from "@/components/backend-phase-notice";
import { MobileShell, requireRole } from "@/components/mobile-shell";
import { resolveDataSource } from "@/lib/data-source";

export default async function HistoricalPage() {
  const role = await requireRole((item) => item.id === "admin");
  const dataSource = resolveDataSource();
  return <MobileShell active="Histórico" role={role}>
    <main className="mx-auto max-w-[1700px] p-3 md:p-5 xl:p-6">
      {dataSource === "supabase" ? (
        <BackendPhaseNotice module="Histórico con datos reales" />
      ) : (
        <AnnualCalendar />
      )}
    </main>
  </MobileShell>;
}
