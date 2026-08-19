import Link from "next/link";
import { ActivityDashboard } from "@/components/activity-dashboard";
import { MobileShell, requireRole } from "@/components/mobile-shell";

export default async function ActivitiesPage() {
  const role = await requireRole((r) => r.kind === "trabajo");
  return (
    <MobileShell role={role}>
      <main className="space-y-4 px-3 py-4 md:px-6 md:py-6 lg:px-7">
        <header className="flex items-end justify-between gap-3">
          <div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-blue">Agosto 2026</p><h1 className="mt-1 text-2xl font-bold tracking-tight">{role.seesAllActivities ? "Actividades" : "Mis actividades"}</h1></div>
          <Link className="text-xs font-bold text-blue underline underline-offset-4" href="/historico">Ver histórico</Link>
        </header>
        <ActivityDashboard role={role} />
      </main>
    </MobileShell>
  );
}
