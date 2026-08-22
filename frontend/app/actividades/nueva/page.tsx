import { ActivityForm } from "@/components/activity-form";
import { MobileShell, requireRole } from "@/components/mobile-shell";

export default async function NewActivityPage({ searchParams }: PageProps<"/actividades/nueva">) {
  const value = (await searchParams).editar;
  const activityId = Array.isArray(value) ? value[0] : value;
  const role = await requireRole((item) => item.id === "operario" || Boolean(activityId && item.id === "burson"));
  return <MobileShell active={role.id === "operario" ? "Nueva" : "Burson"} backHref={activityId ? `/actividades/${activityId}` : "/actividades"} role={role}>
    <main className="mx-auto max-w-5xl space-y-4 px-3 py-4 md:px-6 md:py-6">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
        <div><p className="data-label text-cyan-ink">Trabajo diario</p><h1 className="display-title mt-1 text-2xl md:text-3xl">{activityId ? "Editar actividad" : "Nueva actividad"}</h1><p className="mt-2 text-xs text-ink-muted">Datos de producción, jornadas y entrega en una ficha.</p></div>
        <span className="rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1.5 text-xs font-extrabold text-[#08718a]">{role.id === "burson" ? "CANAL BURSON" : "FLUJO OPERARIO"}</span>
      </header>
      <ActivityForm activityId={activityId} editing={Boolean(activityId)} role={role} />
    </main>
  </MobileShell>;
}
