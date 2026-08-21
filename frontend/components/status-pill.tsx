export const internalStatuses = ["Programada", "En proceso", "Entregada"] as const;
export type InternalStatus = (typeof internalStatuses)[number];
const styles: Record<InternalStatus, string> = { Programada: "border-blue/40 bg-blue/10 text-[#08718a]", "En proceso": "border-orange/50 bg-orange/10 text-[#9a6100]", Entregada: "border-green/40 bg-green/10 text-[#2d760d]" };
export function StatusPill({ status }: { status: InternalStatus }) { return <span className={`inline-flex min-h-7 items-center rounded-[5px] border px-2.5 py-1 text-xs font-bold ${styles[status]}`}>{status}</span>; }
