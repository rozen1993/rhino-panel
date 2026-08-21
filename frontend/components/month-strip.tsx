export const months = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"] as const;

export function MonthStrip({ counts, activeMonth }: { counts: readonly number[]; activeMonth: (typeof months)[number] }) {
  if (counts.length !== months.length) throw new Error("MonthStrip necesita exactamente doce conteos.");
  return <div className="overflow-x-auto rounded-[10px] border border-line bg-panel shadow-[0_8px_24px_rgba(2,19,38,0.05)]"><ol aria-label="Actividades por mes" className="flex min-w-max divide-x divide-line lg:min-w-full">{months.map((month, index) => { const active = month === activeMonth; return <li aria-current={active ? "date" : undefined} className={`flex min-h-16 min-w-[5.25rem] flex-1 flex-col items-center justify-center px-3 text-center transition-colors ${active ? "bg-lime text-night" : "text-ink hover:bg-panel-secondary"}`} key={month}><span className="text-[0.625rem] font-extrabold tracking-[0.12em]">{month}</span><span className="mt-1 text-lg font-extrabold tabular-nums">{counts[index]}</span></li>; })}</ol></div>;
}
