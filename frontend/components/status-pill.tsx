import { SystemIcon } from "./system-icon";
import type { ActivityClassification } from "@/lib/activity-classification";

export const internalStatuses = ["Programada", "En proceso", "Entregada"] as const;
export type InternalStatus = (typeof internalStatuses)[number];
const styles: Record<InternalStatus, string> = {
  Programada: "min-h-6 rounded-[5px] border-blue/40 bg-blue/10 py-1 text-[#08718a]",
  "En proceso": "min-h-6 rounded-[5px] border-process bg-process py-1 text-white",
  Entregada: "cursor-default rounded-md border-delivered bg-delivered text-white",
};
const symbols = { Programada: "○", "En proceso": "◐" };

export function StatusPill({ status, classification, compact = false }: { status: InternalStatus; classification?: ActivityClassification | null; compact?: boolean }) {
  const specialDelivery = status === "Entregada" && classification === "special";
  const compactDelivery = compact && status === "Entregada";
  const style = specialDelivery
    ? "cursor-default rounded-md border-delivered-special bg-delivered-special text-white"
    : styles[status];
  const size = compactDelivery
    ? "min-h-[26px] gap-[5px] px-2 py-[5px] text-[0.65625rem]"
    : `gap-1.5 px-2.5 text-[0.6875rem] ${status === "Entregada" ? "min-h-7 py-1.5" : ""}`;
  return <span data-activity-status={status} data-compact={compactDelivery || undefined} aria-label={specialDelivery ? "Entregada · Actividad especial" : undefined} className={`inline-flex items-center whitespace-nowrap border font-bold leading-none ${style} ${size}`}>
    {status === "Entregada"
      ? <SystemIcon name="check" className={`${compactDelivery ? "size-[14px]" : "size-[15px]"} shrink-0`} />
      : <span aria-hidden="true" className="text-[0.625rem]">{symbols[status]}</span>}
    {status}
  </span>;
}
