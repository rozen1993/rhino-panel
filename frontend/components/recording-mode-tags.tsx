import type { RecordingMode } from "@/lib/recording-modes";

export function RecordingModeTags({ modes, dark = false }: { modes?: RecordingMode[]; dark?: boolean }) {
  if (!modes?.length) return null;
  return <ul aria-label="Modalidades de grabación" className="mt-3 flex flex-wrap gap-1.5">
    {modes.map(mode => <li key={mode} className={`rounded-md border border-cyan/25 bg-cyan/10 px-2 py-1 text-xs font-semibold ${dark ? "text-[#a2edf3]" : "text-cyan-ink"}`}>{mode}</li>)}
  </ul>;
}
