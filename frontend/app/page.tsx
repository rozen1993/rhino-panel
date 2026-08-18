import Link from "next/link";
import { Card } from "@/components/card";

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[390px] flex-col bg-paper md:max-w-[768px] lg:max-w-none">
      <header className="flex min-h-16 items-center border-b border-line bg-panel px-4">
        <span className="text-base font-bold tracking-tight">Rhino Audiovisuales</span>
      </header>
      <main className="flex flex-1 flex-col justify-between gap-8 px-3 py-5 md:px-7 md:py-8 lg:mx-auto lg:w-full lg:max-w-5xl lg:py-16">
        <section className="space-y-5">
          <div className="border-l-[3px] border-blue pl-4">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-blue">Plataforma de producción</p>
            <h1 className="mt-3 max-w-[18rem] text-[2.45rem] font-bold leading-[1.02] tracking-[-0.04em]">El trabajo audiovisual, en orden.</h1>
            <p className="mt-4 max-w-[20rem] text-base leading-6 text-ink-muted">Planifica, entrega y supervisa cada actividad desde un solo lugar.</p>
          </div>

          <Card className="overflow-hidden">
            <div className="grid grid-cols-[4rem_1fr] border-b border-line"><span className="bg-blue px-3 py-4 text-center text-xs font-bold text-white">01</span><span className="px-4 py-4 text-sm font-bold">Planificar el trabajo</span></div>
            <div className="grid grid-cols-[4rem_1fr] border-b border-line"><span className="bg-panel-secondary px-3 py-4 text-center text-xs font-bold tabular-nums">02</span><span className="px-4 py-4 text-sm font-bold">Compartir el material por enlace</span></div>
            <div className="grid grid-cols-[4rem_1fr]"><span className="bg-panel-secondary px-3 py-4 text-center text-xs font-bold tabular-nums">03</span><span className="px-4 py-4 text-sm font-bold">Cerrar cada entrega con claridad</span></div>
          </Card>
        </section>

        <div>
          <Link className="flex min-h-12 w-full items-center justify-center rounded-[5px] border border-amber bg-amber px-5 py-2 text-sm font-bold text-ink" href="/acceso">Entrar a la plataforma</Link>
          <p className="mt-3 text-center text-xs text-ink-muted">Acceso para personas autorizadas.</p>
        </div>
      </main>
    </div>
  );
}
