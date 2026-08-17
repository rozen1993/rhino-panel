export const bursonStatuses = ["Solicitado", "En proceso", "Entregado", "Aprobado", "Cancelado"] as const;
export type BursonStatus = (typeof bursonStatuses)[number];
const styles: Record<BursonStatus, string> = {
  Solicitado: "bg-red text-white",
  "En proceso": "bg-turquoise text-white",
  Entregado: "bg-blue text-white",
  Aprobado: "bg-green text-ink",
  Cancelado: "bg-status-gray text-white",
};

export function BursonStatusPill({ status }: { status: BursonStatus }) {
  return <span className={`inline-flex min-h-7 items-center justify-center rounded-[5px] px-2.5 py-1 text-[0.6875rem] font-bold ${styles[status]}`}>{status}</span>;
}
