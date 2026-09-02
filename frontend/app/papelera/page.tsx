import Link from "next/link";
import { MobileShell, requireRole } from "@/components/mobile-shell";
import { TrashDashboard } from "@/components/trash-dashboard";
import { resolveDataSource } from "@/lib/data-source";
import { listSupabaseTrashedActivities } from "@/lib/supabase/activities";
import { listAssignableOperators } from "@/lib/supabase/profiles";

export default async function TrashPage() {
  const role = await requireRole((candidate) => candidate.id === "admin");
  const dataSource = resolveDataSource();
  const [activities, operators] =
    dataSource === "supabase"
      ? await Promise.all([
          listSupabaseTrashedActivities(),
          listAssignableOperators(),
        ])
      : [[], []];

  return (
    <MobileShell active="Papelera" role={role}>
      <main className="mx-auto max-w-[1450px] space-y-4 px-3 py-4 md:px-5 md:py-5 lg:px-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="data-label text-[#8a5200]">ADMINISTRACIÓN REVERSIBLE</p>
            <h1 className="display-title mt-1 text-[1.7rem] leading-none md:text-[2rem]">
              Papelera de actividades
            </h1>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-ink-muted">
              Aquí viven exclusivamente las actividades dadas de baja. Restaurar
              recupera su visibilidad ordinaria sin borrar historial ni mensajes.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-panel px-4 text-sm font-extrabold text-ink transition hover:border-cyan hover:text-[#08718a]"
            href="/actividades"
          >
            Volver a actividades
          </Link>
        </header>
        <TrashDashboard
          dataSource={dataSource}
          initialActivities={activities}
          initialOperators={operators}
          role={role}
        />
      </main>
    </MobileShell>
  );
}
