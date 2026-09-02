import { redirect } from "next/navigation";
import { ActivityForm } from "@/components/activity-form";
import { MobileShell, requireRole } from "@/components/mobile-shell";
import { resolveDataSource } from "@/lib/data-source";
import { getSupabaseActivity } from "@/lib/supabase/activities";
import { listAssignableOperators } from "@/lib/supabase/profiles";

export default async function ActivityEditorPage({
  searchParams,
}: PageProps<"/actividades/nueva">) {
  const value = (await searchParams).editar;
  const activityId = Array.isArray(value) ? value[0] : value;
  const dataSource = resolveDataSource();
  const role = await requireRole(
    (item) =>
      item.id === "admin" ||
      (item.id === "operario" &&
        (Boolean(activityId) || item.canCreateOwnActivities)),
  );
  const [initialActivity, operators] = await Promise.all([
    dataSource === "supabase" && activityId
      ? getSupabaseActivity(activityId)
      : null,
    dataSource === "supabase" && role.id === "admin"
      ? listAssignableOperators()
      : [],
  ]);
  if (
    dataSource === "supabase" &&
    activityId &&
    role.id === "operario" &&
    !initialActivity
  )
    redirect("/actividades");
  const executionMode = Boolean(activityId && role.id === "operario");
  const heading = activityId
    ? executionMode
      ? "Actualizar ejecución"
      : "Editar planificación"
    : role.id === "admin"
      ? "Planificar actividad"
      : "Crear actividad propia";

  return (
    <MobileShell
      active="Actividades"
      backHref={activityId ? `/actividades/${activityId}` : "/actividades"}
      role={role}
    >
      <main className="mx-auto max-w-5xl space-y-4 px-3 py-4 md:px-6 md:py-6">
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
          <div>
            <p className="data-label text-cyan-ink">
              {executionMode ? "Ejecución del responsable" : "Planificación"}
            </p>
            <h1 className="display-title mt-1 text-2xl md:text-3xl">
              {heading}
            </h1>
            <p className="mt-2 text-xs text-ink-muted">
              {executionMode
                ? "Solo puedes cambiar el enlace y tu opinión."
                : "Actividad, responsable y jornadas en una sola ficha."}
            </p>
          </div>
          <span className="rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1.5 text-xs font-extrabold text-[#08718a]">
            {role.id === "admin" ? "CONTROL ADMIN" : "PERMISO INDIVIDUAL"}
          </span>
        </header>
        <ActivityForm
          activityId={activityId}
          dataSource={dataSource}
          editing={Boolean(activityId)}
          initialActivity={initialActivity}
          operators={operators}
          role={role}
        />
      </main>
    </MobileShell>
  );
}
