import { classificationLabel, type ActivityClassification } from "@/lib/activity-classification";
import s from "./classification-badge.module.css";
export function ClassificationBadge({ value }: { value?: ActivityClassification | null }) {
  return <span className={`${s.badge} ${value === "special" ? s.special : value === "standard" ? s.standard : s.unknown}`}>
    <span className={s.mark} aria-hidden="true">
      {value ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" focusable="false">
        {value === "special" ? <><path d="m12 3 8 9-8 9-8-9Z"/><path d="M4 12h16M12 3l3 9-3 9-3-9Z"/></> : <><rect x="5" y="5" width="14" height="14" rx="2"/><path d="M9 12h6"/></>}
      </svg> : "—"}
    </span><span className={s.label}>{classificationLabel(value)}</span>
  </span>;
}
