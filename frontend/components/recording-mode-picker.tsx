import { useId } from "react";
import { recordingModes, type RecordingMode } from "@/lib/recording-modes";
import { SystemIcon, type IconName } from "@/components/system-icon";
import styles from "./recording-mode-picker.module.css";

const icons: Record<RecordingMode, IconName> = { "Fotografía": "camera", Video: "video", "Vuelo con dron": "drone" };

export function RecordingModePicker({ value, onChange }: {
  value: RecordingMode[]; onChange: (value: RecordingMode[]) => void;
}) {
  const hintId = useId();
  return <fieldset className={styles.field} aria-describedby={hintId}>
    <legend>Modalidades de grabación</legend>
    <p id={hintId} className={styles.hint}>Selecciona una o varias opciones.</p>
    <div className={styles.options}>
      {recordingModes.map(mode => <label key={mode} className={styles.option}>
        <input type="checkbox" checked={value.includes(mode)} onChange={event => {
          onChange(event.target.checked ? recordingModes.filter(candidate => candidate === mode || value.includes(candidate)) : value.filter(candidate => candidate !== mode));
        }} />
        <span className={styles.surface}>
          <SystemIcon name={icons[mode]} className={styles.icon} />
          <span>{mode}</span>
          <span className={styles.mark}><SystemIcon name="check" className={styles.check} /></span>
        </span>
      </label>)}
    </div>
  </fieldset>;
}
