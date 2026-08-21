import { ActivityDetail } from "@/components/activity-detail";
import { MobileShell, requireRole } from "@/components/mobile-shell";

export default async function ActivityDetailPage({ params }: PageProps<"/actividades/[id]">) {
  const role = await requireRole();
  const { id } = await params;
  return <MobileShell backHref={role.id === "burson" ? "/burson" : "/actividades"} role={role}>
    <main className="mx-auto max-w-[1450px] space-y-4 px-3 py-4 md:px-5 md:py-5 lg:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="data-label text-cyan-ink">Ficha de producción</p><h1 className="display-title mt-1 text-2xl md:text-3xl">Detalle de actividad</h1></div>
        <span className="text-xs font-bold text-ink-muted">Registro · {id}</span>
      </header>
      <ActivityDetail id={id} role={role} />
    </main>
  </MobileShell>;
}
