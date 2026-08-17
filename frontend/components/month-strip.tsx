export const months = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"] as const;

export function MonthStrip({ counts, activeMonth }: { counts: readonly number[]; activeMonth: (typeof months)[number] }) {
  if (counts.length !== months.length) throw new Error("MonthStrip necesita exactamente doce conteos.");
  return (
    <ol aria-label="Actividades por mes" className="grid grid-cols-12 overflow-hidden rounded-[5px] border border-line bg-panel">
      {months.map((month, index) => {
        const active = month === activeMonth;
        return (
          <li aria-current={active ? "date" : undefined} className={`flex min-w-0 flex-col items-center justify-center border-r border-line px-0.5 py-2 text-center last:border-r-0 sm:min-h-17 sm:px-2 ${active ? "bg-blue text-white" : "text-ink"}`} key={month}>
            <span className="text-[0.5625rem] font-bold sm:text-xs">{month}</span>
            <span className="mt-0.5 text-sm font-bold tabular-nums sm:text-lg">{counts[index]}</span>
          </li>
        );
      })}
    </ol>
  );
}
