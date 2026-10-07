import Link from "next/link";
import { Card } from "@/components/card";
import { formatActivitySpans } from "@/components/activity-card";
import { ActivityTitle } from "@/components/special-activity-mark";
import { StatusPill } from "@/components/status-pill";
import { SystemIcon, type IconName } from "@/components/system-icon";
import { firstDate, lastDate, type Activity } from "@/lib/activities";
import { activityDetailHref } from "@/lib/dashboard-navigation";
import { safeMaterialUrl } from "@/lib/external-link";
import s from "./activity-preview.module.css";

const dateFormat = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const monthFormat = new Intl.DateTimeFormat("es-PE", { month: "short", timeZone: "UTC" });
const typeIcons: Record<Activity["type"], IconName> = {
  "Grabación": "camera", "Edición": "video", "Creatividad": "activities", "Locución": "messages",
};

/** The editorial preview is read-only; selection, sticky layout and mobile focus stay in the dashboard. */
export function ActivityPreview({ item, returnTo }: { item: Activity | undefined; returnTo: string }) {
  if (!item) return <Card className="p-5 text-sm text-ink-muted">Selecciona una actividad para ver su detalle.</Card>;
  const url = safeMaterialUrl(item.materialLink);
  const first = firstDate(item);
  const date = first ? new Date(`${first}T12:00:00Z`) : null;
  const validDate = date && Number.isFinite(date.getTime()) ? date : null;
  const multipleDates = !item.deliveryDueOn && (item.spans.length > 1 || first !== lastDate(item));

  return <div className={`${s.preview} ${item.classification === "special" ? s.special : ""}`} data-activity-preview>
    <div className={s.toolbar}><span>Vista rápida</span><span className={s.dot} aria-hidden="true" /></div>
    <div className={s.body}>
      <div className={s.top}>
        <p className={s.category}><SystemIcon name={typeIcons[item.type]} className={s.icon}/>{item.type}</p>
        <StatusPill status={item.status} classification={item.classification}/>
      </div>
      {item.deliveryDueOn && <p className={s.dateLabel}>Entrega prevista</p>}
      {multipleDates && <p className={s.dateLabel}>Primera jornada</p>}
      <div className={s.dateTitle}>
        {validDate ? <time className={s.dateBlock} dateTime={first} aria-label={dateFormat.format(validDate)}>
          <strong>{validDate.getUTCDate()}</strong>
          <span>{monthFormat.format(validDate).replace(".", "")} {validDate.getUTCFullYear()}</span>
        </time> : <span className={s.noDate}>Sin fecha</span>}
        <h2 className={`display-title ${s.title}`}><ActivityTitle title={item.title} value={item.classification}/></h2>
      </div>
      {multipleDates && <p className={s.dateRange}>{formatActivitySpans(item)}</p>}
      <dl className={s.facts}>
        <div><dt>Responsable</dt><dd><SystemIcon name="profile" className={s.icon}/><span>{item.responsible || "Sin asignar"}</span></dd></div>
        <div><dt>Origen</dt><dd>{item.origin === "burson" ? "Burson" : "Ordinaria"}</dd></div>
      </dl>
      {item.description && <section className={s.summary}><h3>Descripción</h3><p>{item.description}</p></section>}
      {item.operatorOpinion && <section className={s.summary}><h3>Opinión del operario</h3><p>{item.operatorOpinion}</p></section>}
    </div>
    <div className={s.actions}>
      <Link className={s.primary} href={activityDetailHref(item.id, returnTo)}>
        <span>Abrir ficha completa</span><SystemIcon name="arrow-right" className={s.icon}/>
      </Link>
      {url && <a className={s.material} href={url} rel="noreferrer" target="_blank">
        <SystemIcon name="link" className={s.icon}/><span>Abrir material</span><span aria-hidden="true">↗</span>
      </a>}
    </div>
  </div>;
}
