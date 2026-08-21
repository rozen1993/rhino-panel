import type { ReactNode } from "react";
import { Card } from "@/components/card";

export function SummaryTile({ icon, iconClassName, value, label, detail }: { icon: ReactNode; iconClassName: string; value: number; label: string; detail: string }) {
  return (
    <Card className="group relative flex min-h-20 items-center gap-3 overflow-hidden p-3 transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-2)] sm:min-h-[5.5rem] sm:gap-4 sm:p-4 first:border-b-[3px] first:border-b-cyan">
      <span className={`flex size-11 shrink-0 items-center justify-center rounded-full shadow-[inset_0_0_0_1px_rgba(255,255,255,.28)] transition group-hover:scale-105 sm:size-12 ${iconClassName}`}>{icon}</span>
      <span className="min-w-0"><span className="display-title block text-[1.65rem] leading-none tabular-nums sm:text-[1.9rem]">{value}</span><span className="mt-1 block text-[0.6875rem] font-medium text-ink-muted sm:text-xs">{label.toLowerCase()}</span><span className="sr-only">{detail}</span></span>
    </Card>
  );
}
