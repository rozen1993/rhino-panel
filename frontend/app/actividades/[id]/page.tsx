import { ActivityDetail } from "@/components/activity-detail";
import { MobileShell, requireRole } from "@/components/mobile-shell";
import { resolveDataSource } from "@/lib/data-source";
import { getSupabaseActivity } from "@/lib/supabase/activities";
import { safeActivityReturn } from "@/lib/dashboard-navigation";

export default async function ActivityDetailPage({ params, searchParams }: PageProps<"/actividades/[id]">) {
  const role = await requireRole(
    (item) => item.id === "admin" || item.id === "operario",
  );
  const { id } = await params;
  const dataSource = resolveDataSource();
  const activity =
    dataSource === "supabase" ? await getSupabaseActivity(id) : null;
  return <MobileShell backHref={safeActivityReturn((await searchParams).volver,role.id==='admin')} role={role}>
    <main className="mx-auto max-w-[1450px] space-y-4 px-3 py-4 md:px-5 md:py-5 lg:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="data-label text-cyan-ink">Ficha de producción</p><h1 className="display-title mt-1 text-2xl md:text-3xl">Detalle de actividad</h1></div>
        <span className="text-xs font-bold text-ink-muted">Registro · {id}</span>
      </header>
      <ActivityDetail
        dataSource={dataSource}
        id={id}
        initialActivity={activity}
        role={role}
      />
    </main>
  </MobileShell>;
}
