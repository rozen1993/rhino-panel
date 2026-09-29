import { useId } from "react";
import type { ActivityClassification } from "@/lib/activity-classification";
import { ClassificationBadge } from "./classification-badge";
import s from "./classification-picker.module.css";

export function ClassificationPicker({ value, onChange }: {
  value: ActivityClassification | null;
  onChange: (value: ActivityClassification | null) => void;
}) {
  const id = useId();
  return <fieldset className={s.field} aria-describedby={`${id}-hint`}>
    <legend>Clasificación del trabajo</legend>
    <p className={s.hint} id={`${id}-hint`}>Selecciona el marcaje de esta actividad. No cambia el estado ni duplica el conteo contractual.</p>
    <div className={s.choices}>
      {(["standard", "special"] as const).map(kind => <label key={kind} className={`${s.choice} ${kind === "special" ? s.special : ""}`}>
        <input type="radio" name={`${id}-classification`} value={kind} checked={value === kind}
          aria-labelledby={`${id}-${kind}-name`} aria-describedby={`${id}-${kind}-description`} onChange={() => onChange(kind)} />
        <span className={s.surface}>
          <span className={s.indicator} aria-hidden="true"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 8 3 3 7-7"/></svg></span>
          <span id={`${id}-${kind}-name`}><ClassificationBadge value={kind}/></span>
          <span className={s.description} id={`${id}-${kind}-description`}>{kind === "special" ? "Trabajo de mayor complejidad." : "Trabajo de complejidad habitual."}</span>
        </span>
      </label>)}
    </div>
    <label className={s.unknown}>
      <input type="radio" name={`${id}-classification`} value="" checked={value === null}
        aria-labelledby={`${id}-unknown-name`} aria-describedby={`${id}-unknown-description`} onChange={() => onChange(null)} />
      <span id={`${id}-unknown-name`}><ClassificationBadge value={null}/></span>
      <span id={`${id}-unknown-description`}>Disponible si falta evaluar el trabajo.</span>
    </label>
  </fieldset>;
}
