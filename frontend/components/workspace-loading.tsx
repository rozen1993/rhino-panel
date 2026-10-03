import s from "./workspace-loading.module.css";

/** Content-only skeleton: no identity, private data or artificial delay. */
export function WorkspaceLoading({ label = "Abriendo tu espacio", description = "Estamos preparando esta sección.", section = "Control de actividades" }: {
  label?: string; description?: string; section?: string;
}) {
  return <section role="status" aria-label={label} aria-busy="true" className={s.panel}>
    <p className={s.status}><span className={s.spinner} aria-hidden="true"/>{label}…</p>
    <span className={s.srOnly}>{section}. {description}</span>
    <div className={s.toolbar} aria-hidden="true"><span/><span/><span/></div>
    <div className={s.cards} aria-hidden="true" data-loading-skeleton="cards">
      {Array.from({ length: 6 }, (_, index) => <div className={s.card} key={index}>
        <span className={s.caption}/><span className={s.title}/><span className={s.metric}/>
        <div className={s.divider}/><span className={s.line}/>
      </div>)}
    </div>
    <p className={s.hint}>
      <svg aria-hidden="true" width="16" height="18" viewBox="0 0 16 18" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="3" y="1.5" width="10" height="15" rx="1.5"/><path d="M5.5 5h5M5.5 8.5h5M5.5 12h3"/></svg>
      Los datos aparecerán aquí. Puedes seguir usando el menú.
    </p>
  </section>;
}
