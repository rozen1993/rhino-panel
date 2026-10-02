import s from "./workspace-loading.module.css";

/** No identity, private data, timers or artificial delay. */
export function WorkspaceLoading({ label = "Abriendo tu espacio", description = "Estamos preparando esta sección.", section = "Control de actividades" }: {
  label?: string; description?: string; section?: string;
}) {
  return <section role="status" aria-label={label} aria-busy="true" className={s.panel}>
    <div className={s.brand} aria-hidden="true">
      <div className={`display-title ${s.wordmark}`}>DA VINCI</div>
      <p className={s.brandCaption}>Control de actividades</p>
      <div className={s.signature}><span/><span/><span/><span/></div>
    </div>
    <div className={s.content}>
      <div className={s.rule} aria-hidden="true"/>
      <p className={s.status}><span className={s.spinner} aria-hidden="true"/>{label}</p>
      <h2 className="display-title">Tu trabajo,<br/>{" "}en un solo lugar.</h2>
      <p className={s.description}>{description}</p>
      <div className={s.track} aria-hidden="true"><span/></div>
      <small className={s.sectionName}>{section} · DA VINCI</small>
    </div>
  </section>;
}
