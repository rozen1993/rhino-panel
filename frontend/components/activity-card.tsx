import Link from "next/link";
import { Card } from "@/components/card";
import { StatusPill } from "@/components/status-pill";
import { type Activity, showsProgress } from "@/lib/activities";

export function ActivityCard({ activity, showResponsible = false }: { activity: Activity; showResponsible?: boolean }) {
  const observed = activity.status === "Observada";
  const progress = showsProgress(activity.type) ? activity.progress : undefined;

  return (
    <Link aria-label={`Ver ${activity.title}`} href={`/actividades/${activity.id}`}>
      <Card className={`relative overflow-hidden p-3 transition-colors hover:bg-panel-secondary ${observed ? "border-observed bg-red/5 pl-4" : ""}`}>
        {observed && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-observed" />}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={`text-[0.6875rem] font-bold uppercase tracking-[0.12em] ${observed ? "text-observed" : "text-blue"}`}>{activity.date} · {activity.type}</p>
            <h2 className="mt-1 text-sm font-bold leading-5">{activity.title}</h2>
            {showResponsible && <p className="mt-1 text-xs text-ink-muted">Responsable: <span className="font-semibold text-ink">{activity.responsible}</span></p>}
          </div>
          <StatusPill status={activity.status} />
        </div>
        {progress !== undefined && (
          <div className="mt-3 flex items-center gap-3" aria-label={`Avance ${progress}%`}>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel-secondary"><div className={`h-full ${observed ? "bg-observed" : "bg-blue"}`} style={{ width: `${progress}%` }} /></div>
            <span className="text-xs font-bold tabular-nums">{progress}%</span>
          </div>
        )}
      </Card>
    </Link>
  );
}
