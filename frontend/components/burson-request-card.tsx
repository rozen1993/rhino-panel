import Link from "next/link";
import { formatActivityDates } from "@/components/activity-card";
import { Card } from "@/components/card";
import { StatusPill } from "@/components/status-pill";
import type { BursonRequestView } from "@/lib/burson";

export function BursonRequestCard({
  request,
}: {
  request: BursonRequestView;
}) {
  const rail =
    request.status === "Programada"
      ? "border-l-cyan"
      : request.status === "En proceso"
        ? "border-l-orange"
        : "border-l-green";
  return (
    <Link
      aria-label={`Consultar encargo ${request.title}`}
      href={`/burson/${request.id}`}
    >
      <Card
        className={`h-full border-l-[4px] p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-2)] ${rail}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="data-label text-cyan-ink">
              {formatActivityDates(request)} · {request.type}
            </p>
            <h2 className="display-title mt-1.5 text-[0.95rem] leading-5 text-ink">
              {request.title}
            </h2>
          </div>
          <StatusPill status={request.status} />
        </div>
        <p className="mt-3 line-clamp-2 text-xs leading-5 text-ink-muted">
          {request.description}
        </p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3 text-[0.6875rem] text-ink-muted">
          <span>
            Responsable: <strong className="text-ink">{request.responsible}</strong>
          </span>
          {request.place && <span>Lugar: {request.place}</span>}
        </div>
      </Card>
    </Link>
  );
}
