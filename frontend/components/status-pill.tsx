export const internalStatuses = ["Programada", "En proceso", "Entregada"] as const;
export type InternalStatus = (typeof internalStatuses)[number];
const styles: Record<InternalStatus, string> = { Programada: "border-amber bg-amber/15 text-ink", "En proceso": "border-turquoise bg-turquoise/15 text-ink", Entregada: "border-blue bg-blue text-white" };
export function StatusPill({ status }: { status: InternalStatus }) { return <span className={`inline-flex min-h-7 items-center rounded-[5px] border px-2.5 py-1 text-xs font-bold ${styles[status]}`}>{status}</span>; }
