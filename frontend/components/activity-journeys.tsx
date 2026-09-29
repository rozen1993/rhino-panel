import { formatActivitySpans } from "@/components/activity-card";
import { spanPlace, type Activity } from "@/lib/activities";

/** One row per date/place pair; planning stays read-only to the responsible operator. */
export function ActivityJourneys({ activity }: { activity: Pick<Activity, "spans" | "place" | "deliveryDueOn"> }) {
  if(activity.deliveryDueOn) return <div className="space-y-3 text-sm">
    <p><strong>Entrega prevista: {formatActivitySpans({spans:[{start:activity.deliveryDueOn,end:activity.deliveryDueOn}]})}</strong></p>
    <p className="text-xs text-ink-muted">Es una fecha de planificación, no una confirmación de entrega.</p>
    {activity.spans.length>0 && <details><summary className="cursor-pointer text-xs text-cyan-ink">Ver fechas y lugares conservados del registro</summary><div className="mt-2"><ActivityJourneys activity={{spans:activity.spans,place:activity.place}}/></div></details>}
  </div>;
  return (
    <ul className="grid gap-2 text-sm" aria-label="Jornadas y lugares">
      {activity.spans.map((span, index) => (
        <li className="min-w-0 break-words" key={`${index}-${span.start}-${span.end}`}>
          <span className="block font-bold">{formatActivitySpans({ spans: [span] })}</span>
          <span className="block text-xs font-normal text-ink-muted">{spanPlace(span, activity.place) || "Sin lugar indicado"}</span>
        </li>
      ))}
    </ul>
  );
}
