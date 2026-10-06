import { SystemIcon } from "./system-icon";
import type { ActivityClassification } from "@/lib/activity-classification";

export const internalStatuses = ["Programada", "En proceso", "Entregada"] as const;
export type InternalStatus = (typeof internalStatuses)[number];
const styles: Record<InternalStatus, string> = {
  Programada: "min-h-6 rounded-[5px] border-blue/40 bg-blue/10 py-1 text-[#08718a]",
  "En proceso": "min-h-6 rounded-[5px] border-process bg-process py-1 text-white",
  Entregada: "min-h-7 cursor-default rounded-md border-delivered bg-delivered py-1.5 text-white",
};
const symbols = { Programada: "○", "En proceso": "◐" };

export function StatusPill({ status, classification }: { status: InternalStatus; classification?: ActivityClassification | null }) {
  const specialDelivery = status === "Entregada" && classification === "special";
  const style = specialDelivery
    ? "min-h-7 cursor-default rounded-md border-delivered-special bg-delivered-special py-1.5 text-white"
    : styles[status];
  return <span data-activity-status={status} aria-label={specialDelivery ? "Entregada · Actividad especial" : undefined} className={`inline-flex items-center gap-1.5 whitespace-nowrap border px-2.5 text-[0.6875rem] font-bold leading-none ${style}`}>
    {status === "Entregada"
      ? <SystemIcon name="check" className="size-[15px] shrink-0" />
      : <span aria-hidden="true" className="text-[0.625rem]">{symbols[status]}</span>}
    {status}
  </span>;
}
