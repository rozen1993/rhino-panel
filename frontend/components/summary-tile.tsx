import type { ReactNode } from "react";
import { Card } from "@/components/card";

export function SummaryTile({ icon, iconClassName, value, label, detail }: { icon: ReactNode; iconClassName: string; value: number; label: string; detail: string }) {
  return (
    <Card className="flex min-h-32 items-center gap-4 p-4">
      <span className={`flex size-16 shrink-0 items-center justify-center rounded-[5px] ${iconClassName}`}>{icon}</span>
      <span className="min-w-0"><span className="block text-3xl font-bold tabular-nums">{value}</span><span className="mt-1 block text-xs font-bold uppercase tracking-wide text-blue">{label}</span><span className="mt-1 block text-sm text-ink-muted">{detail}</span></span>
    </Card>
  );
}
