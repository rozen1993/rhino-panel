import { Card } from "@/components/card";
import { SystemIcon } from "@/components/system-icon";

export function BackendPhaseNotice({ module }: { module: string }) {
  return (
    <Card className="mx-auto max-w-3xl overflow-hidden shadow-[var(--shadow-2)]">
      <div className="h-1 bg-gradient-to-r from-cyan to-lime" />
      <div className="p-6 text-center md:p-10">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-cyan/12 text-[#08718a]">
          <SystemIcon className="size-6" name="progress" />
        </span>
        <p className="data-label mt-4 text-cyan-ink">Primer corte vertical</p>
        <h1 className="display-title mt-2 text-2xl">{module}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-ink-muted">
          Este módulo permanece fuera del primer corte de staging. No se
          mostrarán datos simulados mientras el entorno use Supabase.
        </p>
      </div>
    </Card>
  );
}
