import { MobileShell, requireRole } from "@/components/mobile-shell";
import { HistoricalRegistrationForm } from "@/components/historical-registration-form";
import { getAunorWorkspaceAction } from "@/app/aunor/actions";
import { resolveDataSource } from "@/lib/data-source";
import { listAssignableOperators } from "@/lib/supabase/profiles";

export default async function HistoricalRegistrationPage() {
  const role = await requireRole((r) => r.id === "admin");
  const dataSource = resolveDataSource();
  const [workspace, operators] = await Promise.all([
    getAunorWorkspaceAction({ scene: "acordado" }),
    dataSource === "supabase" ? listAssignableOperators() : Promise.resolve([]),
  ]);
  if (!workspace.ok)
    throw Error("No se pudo cargar el contrato para el registro histórico.");
  return (
    <MobileShell role={role} active="Actividades" backHref="/actividades">
      <main className="mx-auto max-w-[1500px] px-3 py-5 md:px-6">
        <header className="mb-5">
          <p className="data-label text-cyan-ink">
            Archivo de producción · Admin
          </p>
          <h1 className="display-title mt-1 text-3xl">
            Registro histórico terminado
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            Cargar trabajos anteriores, sin recrear el proceso de ejecución.
          </p>
        </header>
        <HistoricalRegistrationForm
          role={role}
          dataSource={dataSource}
          operators={operators}
          workspace={workspace.data}
        />
      </main>
    </MobileShell>
  );
}
