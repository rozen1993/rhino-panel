import { ActivityForm } from "@/components/activity-form";
import { MobileShell, requireRole } from "@/components/mobile-shell";

export default async function NewActivityPage({ searchParams }: PageProps<"/actividades/nueva">) {
  const role = await requireRole((r) => r.createsOrders || r.kind === "trabajo");
  const editParam = (await searchParams).editar;
  const activityId = Array.isArray(editParam) ? editParam[0] : editParam;
  const editing = Boolean(activityId);
  if (!editing && !role.createsOrders) {
    const { redirect } = await import("next/navigation");
    redirect("/sin-acceso");
  }
  return (
    <MobileShell backHref={editing ? `/actividades/${activityId}` : "/actividades"} role={role}>
      <main className="space-y-4 px-3 py-4 md:px-6 md:py-6 lg:px-7">
        <header><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-blue">Trabajo diario</p><h1 className="mt-1 text-2xl font-bold tracking-tight">{editing ? "Editar actividad" : "Nueva actividad"}</h1></header>
        <ActivityForm activityId={activityId} editing={editing} key={activityId ?? "nueva"} role={role} />
      </main>
    </MobileShell>
  );
}
