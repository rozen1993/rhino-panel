import { SystemIcon } from "./system-icon";

export const internalStatuses = ["Programada", "En proceso", "Entregada"] as const;
export type InternalStatus = (typeof internalStatuses)[number];
const styles: Record<InternalStatus, string> = {
  Programada: "min-h-6 border-blue/40 bg-blue/10 text-[#08718a]",
  "En proceso": "min-h-6 border-process bg-process text-white",
  Entregada: "min-h-7 cursor-default border-[#216337] bg-[#216337] text-white",
};
const symbols = { Programada: "○", "En proceso": "◐" };

export function StatusPill({ status }: { status: InternalStatus }) {
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-[5px] border px-2.5 py-1 text-[0.6875rem] font-bold leading-none ${styles[status]}`}>
    {status === "Entregada"
      ? <SystemIcon name="check" className="size-[15px] shrink-0" />
      : <span aria-hidden="true" className="text-[0.625rem]">{symbols[status]}</span>}
    {status}
  </span>;
}
