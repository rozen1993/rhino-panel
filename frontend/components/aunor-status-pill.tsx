export const aunorStatuses = ["Programada", "En trabajo", "Entregada", "Aprobada", "Cancelada"] as const;
export type AunorStatus = (typeof aunorStatuses)[number];

const config: Record<AunorStatus, { sign: string; className: string }> = {
  Programada: { sign: "○", className: "bg-ink-muted text-white" },
  "En trabajo": { sign: "▶", className: "bg-blue text-white" },
  Entregada: { sign: "✓", className: "bg-turquoise text-white" },
  Aprobada: { sign: "★", className: "bg-green text-ink" },
  Cancelada: { sign: "×", className: "bg-status-gray text-white line-through" },
};

export function AunorStatusPill({ status }: { status: AunorStatus }) {
  const item = config[status];
  return <span className={`inline-flex min-h-8 items-center justify-center gap-2 rounded-[5px] px-3 py-1 text-xs font-bold ${item.className}`}><span aria-hidden="true">{item.sign}</span>{status}</span>;
}
