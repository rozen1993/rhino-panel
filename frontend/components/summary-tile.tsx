import type { ReactNode } from "react";
import { Card } from "@/components/card";

export function SummaryTile({ icon, iconClassName, value, label, detail }: { icon: ReactNode; iconClassName: string; value: number; label: string; detail: string }) {
  return (
    <Card className="flex min-h-24 items-center gap-3 p-3 sm:min-h-32 sm:gap-4 sm:p-4 lg:min-h-28 lg:gap-3 lg:p-3 xl:gap-4 xl:p-4">
      <span className={`flex size-11 shrink-0 items-center justify-center rounded-[5px] sm:size-16 ${iconClassName}`}>{icon}</span>
      <span className="min-w-0"><span className="block text-2xl font-bold tabular-nums sm:text-3xl">{value}</span><span className="mt-0.5 block text-[0.625rem] font-bold uppercase tracking-wide text-blue sm:mt-1 sm:text-xs">{label}</span><span className="mt-0.5 block text-[0.6875rem] leading-4 text-ink-muted sm:mt-1 sm:text-sm">{detail}</span></span>
    </Card>
  );
}
