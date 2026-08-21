"use client";

import { useState } from "react";

export const months = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"] as const;

type Props = { counts: readonly number[]; activeMonth: (typeof months)[number]; year?: number };

export function MonthStrip({ counts, activeMonth, year = 2026 }: Props) {
  if (counts.length !== months.length) throw new Error("MonthStrip necesita exactamente doce conteos.");
  const activeIndex = months.indexOf(activeMonth);
  const [focusMonth, setFocusMonth] = useState(activeIndex);

  return <nav aria-label="Navegación mensual" className="panel-glow overflow-hidden rounded-[10px] border border-line bg-panel">
    <MonthWindow activeMonth={activeMonth} className="grid md:hidden" counts={counts} focusMonth={focusMonth} onFocus={setFocusMonth} size={3} year={year} />
    <MonthWindow activeMonth={activeMonth} className="hidden md:grid xl:hidden" counts={counts} focusMonth={focusMonth} onFocus={setFocusMonth} size={4} year={year} />
    <MonthWindow activeMonth={activeMonth} className="hidden xl:grid" counts={counts} focusMonth={focusMonth} onFocus={setFocusMonth} size={6} year={year} />
  </nav>;
}

function MonthWindow({ activeMonth, className, counts, focusMonth, onFocus, size, year }: Props & { className: string; focusMonth: number; onFocus: (month: number) => void; size: number }) {
  const start = Math.max(0, Math.min(months.length - size, focusMonth - Math.floor(size / 2)));
  const visible = months.slice(start, start + size);
  const columns = size === 3 ? "grid-cols-[3rem_repeat(3,minmax(0,1fr))_3rem]" : size === 4 ? "grid-cols-[3rem_repeat(4,minmax(0,1fr))_3rem]" : "grid-cols-[3rem_repeat(6,minmax(0,1fr))_3rem]";
  return <ol aria-label="Actividades por mes" className={`${className} ${columns} divide-x divide-line`}>
    <li className="flex"><button aria-label="Meses anteriores" className="min-h-[4.15rem] w-full text-xl text-ink-muted transition hover:bg-panel-secondary hover:text-cyan disabled:cursor-not-allowed disabled:opacity-25" disabled={focusMonth === 0} onClick={() => onFocus(Math.max(0, focusMonth - 1))} type="button">‹</button></li>
    {visible.map((month) => {
      const monthIndex = months.indexOf(month);
      const active = month === activeMonth;
      return <li aria-current={active ? "date" : undefined} className={`flex min-h-[4.15rem] flex-col items-center justify-center px-2 text-center transition-colors ${active ? "action-surface text-[#173000]" : "text-ink hover:bg-panel-secondary"}`} key={month}>
        <span className="data-label">{active ? `${month} ${year}` : month}</span>
        <span className="display-title mt-1 text-xl leading-none tabular-nums">{counts[monthIndex]}</span>
      </li>;
    })}
    <li className="flex"><button aria-label="Meses siguientes" className="min-h-[4.15rem] w-full text-xl text-ink-muted transition hover:bg-panel-secondary hover:text-cyan disabled:cursor-not-allowed disabled:opacity-25" disabled={focusMonth === months.length - 1} onClick={() => onFocus(Math.min(months.length - 1, focusMonth + 1))} type="button">›</button></li>
  </ol>;
}
