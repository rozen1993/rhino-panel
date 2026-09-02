import Link from "next/link";
import { ActivityDashboard } from "@/components/activity-dashboard";
import { MobileShell, requireRole } from "@/components/mobile-shell";
import { resolveDataSource } from "@/lib/data-source";
import { listSupabaseActivities } from "@/lib/supabase/activities";

export default async function ActivitiesPage() {
  const role = await requireRole(
    (item) => item.id === "operario" || item.id === "admin",
  );
  const dataSource = resolveDataSource();
  const activities =
    dataSource === "supabase" ? await listSupabaseActivities() : [];
  return (
    <MobileShell role={role}>
      <main className="mx-auto max-w-[1700px] space-y-4 px-3 py-4 md:px-5 md:py-5 lg:px-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="display-title text-[1.7rem] leading-none md:text-[2rem]">
              {role.id === "admin" ? "Todas las actividades" : "Mis actividades"}
            </h1>
            <p className="mt-2 text-xs text-ink-muted">
              {role.id === "admin"
                ? "Vista integral del trabajo audiovisual"
                : "Consulta y ejecuta únicamente las actividades que te asignaron"}
            </p>
          </div>
          {role.id === "admin" ? (
            <div className="flex flex-wrap gap-2">
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-panel px-4 text-sm font-extrabold text-ink transition hover:border-cyan hover:text-[#08718a]"
                href="/papelera"
              >
                Ver Papelera
              </Link>
              <Link
                className="action-surface inline-flex min-h-11 items-center justify-center rounded-md px-5 text-sm font-extrabold text-[#173000] shadow-[0_8px_20px_rgba(95,170,0,.2)]"
                href="/actividades/nueva"
              >
                Planificar actividad
              </Link>
            </div>
          ) : (
            <span className="hidden items-center gap-2 rounded-full border border-cyan/25 bg-cyan/[.06] px-3 py-2 text-[0.6875rem] font-bold text-[#08718a] md:inline-flex">
              <i className="size-2 animate-pulse rounded-full bg-cyan" />
              Panel operativo activo
            </span>
          )}
        </header>
        <ActivityDashboard
          dataSource={dataSource}
          initialActivities={activities}
          role={role}
        />
      </main>
    </MobileShell>
  );
}
