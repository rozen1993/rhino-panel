import { SystemIcon, type IconName } from "./system-icon";
import s from "./workspace-loading.module.css";

/** No identity, private data, timers or artificial delay. */
export function WorkspaceLoading({ label = "Abriendo tu espacio", description = "Estamos preparando esta sección.", icon = "activities" }: {
  label?: string; description?: string; icon?: IconName;
}) {
  return <section role="status" aria-label={label} aria-busy="true" className={s.panel}>
    <div className={s.sign} aria-hidden="true"><SystemIcon name={icon} className="size-9"/></div>
    <h2 className="display-title">{label}</h2>
    <p>{description}</p>
    <div className={s.track} aria-hidden="true"><span/></div>
    <small>DA VINCI · Control de actividades</small>
  </section>;
}
