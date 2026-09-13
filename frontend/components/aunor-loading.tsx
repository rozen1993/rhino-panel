import s from "./aunor-space.module.css";

export function AunorLoading() {
  return <main className={s.page} aria-busy="true" aria-label="Cargando espacio Aunor">
    <header className={s.head}>
      <p className="data-label text-cyan-ink">Espacio Aunor</p>
      <p className="section-title" role="status">Cargando información…</p>
      <p>Puedes seguir navegando mientras se prepara esta sección.</p>
    </header>
    <div className={s.grid} aria-hidden="true">
      {[0,1].map(i=><div key={i} className={s.card}>
        <div className="space-y-5 border-t-4 border-cyan p-5 motion-safe:animate-pulse">
          <div className="h-3 w-24 rounded bg-cyan/15" />
          <div className="h-6 w-3/4 rounded bg-line/20" />
          <div className="h-3 w-full rounded bg-line/15" />
          <div className="h-3 w-2/3 rounded bg-line/15" />
          <div className="h-10 w-32 rounded-md bg-line/15" />
        </div>
      </div>)}
    </div>
  </main>;
}
