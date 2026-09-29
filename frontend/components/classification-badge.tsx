import { classificationLabel, type ActivityClassification } from "@/lib/activity-classification";
import s from "./classification-badge.module.css";
export function ClassificationBadge({ value }: { value?: ActivityClassification | null }) {
  return <span className={`${s.badge} ${value === "special" ? s.special : value === "standard" ? s.standard : s.unknown}`}>
    <span aria-hidden="true">{value === "special" ? "◆" : value === "standard" ? "○" : "—"}</span>{classificationLabel(value)}
  </span>;
}
