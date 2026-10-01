import { useId } from "react";
import type { ActivityClassification } from "@/lib/activity-classification";
import { SpecialActivityMark } from "./special-activity-mark";
import s from "./classification-picker.module.css";

export function ClassificationPicker({ value, onChange }: {
  value: ActivityClassification | null;
  onChange: (value: ActivityClassification | null) => void;
}) {
  const id = useId();
  return <fieldset className={s.field} aria-describedby={`${id}-hint`}>
    <legend>Clasificación del trabajo</legend>
    <label className={s.toggle}>
      <input type="checkbox" checked={value === "special"} aria-describedby={`${id}-hint`}
        onChange={event => onChange(event.target.checked ? "special" : "standard")} />
      <span>Esta actividad es especial</span><SpecialActivityMark value="special"/>
    </label>
    <p className={s.hint} id={`${id}-hint`}>Sin marcar: estándar. Marca solo los trabajos de mayor complejidad; no duplica el conteo contractual.</p>
  </fieldset>;
}
