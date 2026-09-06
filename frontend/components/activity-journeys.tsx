import { formatActivitySpans } from "@/components/activity-card";
import { spanPlace, type Activity } from "@/lib/activities";

/** One row per date/place pair; planning stays read-only to the responsible operator. */
export function ActivityJourneys({ activity }: { activity: Pick<Activity, "spans" | "place"> }) {
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
