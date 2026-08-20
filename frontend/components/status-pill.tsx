export const internalStatuses = ["Programada", "En proceso", "Por subir", "Entregada", "Observada", "Rechazada", "Aprobada", "Cancelada"] as const;
export type InternalStatus = (typeof internalStatuses)[number];

const config: Record<InternalStatus, { sign: string; className: string }> = {
  Programada: { sign: "○", className: "bg-red text-white" },
  "En proceso": { sign: "▶", className: "bg-turquoise text-white" },
  "Por subir": { sign: "↑", className: "bg-amber text-ink" },
  Entregada: { sign: "✓", className: "bg-blue text-white" },
  Observada: { sign: "!", className: "bg-observed text-white" },
  Rechazada: { sign: "x", className: "bg-red text-white" },
  Aprobada: { sign: "★", className: "bg-green text-ink" },
  Cancelada: { sign: "×", className: "bg-status-gray text-white" },
};

export function StatusPill({ status }: { status: InternalStatus }) {
  const item = config[status];
  return <span className={`inline-flex min-h-8 items-center justify-center gap-2 rounded-[5px] px-3 py-1 text-xs font-bold ${item.className}`}><span aria-hidden="true">{item.sign}</span>{status}</span>;
}
