import { ActivityForm } from "@/components/activity-form";
import { MobileShell } from "@/components/mobile-shell";

export default async function NewActivityPage({ searchParams }: PageProps<"/actividades/nueva">) {
  const editing = Boolean((await searchParams).editar);
  return (
    <MobileShell backHref={editing ? "/actividades/peaje-chillon" : "/actividades"}>
      <main className="space-y-4 px-3 py-4 md:px-6 md:py-6 lg:px-7">
        <header><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-blue">Trabajo diario</p><h1 className="mt-1 text-2xl font-bold tracking-tight">{editing ? "Editar actividad" : "Nueva actividad"}</h1></header>
        <ActivityForm editing={editing} />
      </main>
    </MobileShell>
  );
}
