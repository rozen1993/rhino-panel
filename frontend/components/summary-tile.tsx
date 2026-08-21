import type { ReactNode } from "react";
import { Card } from "@/components/card";

export function SummaryTile({ icon, iconClassName, value, label, detail }: { icon: ReactNode; iconClassName: string; value: number; label: string; detail: string }) {
  return (
    <Card className="flex min-h-20 items-center gap-3 p-3 sm:min-h-24 sm:gap-4 sm:p-4">
      <span className={`flex size-11 shrink-0 items-center justify-center rounded-full sm:size-14 ${iconClassName}`}>{icon}</span>
      <span className="min-w-0"><span className="block text-2xl font-extrabold tabular-nums sm:text-3xl">{value}</span><span className="mt-0.5 block text-[0.6875rem] font-semibold text-ink-muted sm:text-xs">{label}</span><span className="sr-only">{detail}</span></span>
    </Card>
  );
}
