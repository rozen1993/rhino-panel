import Link from "next/link";
import { Card } from "@/components/card";
import { StatusPill } from "@/components/status-pill";
import { firstDate, lastDate, type Activity } from "@/lib/activities";

const shortDate = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short", timeZone: "America/Lima" });
const fullDate = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Lima" });
function asLimaDate(value: string) { return new Date(`${value}T12:00:00-05:00`); }
export function formatActivityDates(activity: Pick<Activity, "spans">) { const first = firstDate(activity); const last = lastDate(activity); if (!first) return "Sin fecha"; if (activity.spans.length > 1) return `${shortDate.format(asLimaDate(first))} · ${activity.spans.length} jornadas`; return first === last ? fullDate.format(asLimaDate(first)) : `${shortDate.format(asLimaDate(first))} – ${shortDate.format(asLimaDate(last))}`; }
export function formatActivitySpans(activity: Pick<Activity, "spans">) { if (!activity.spans.length) return "Sin fecha"; return activity.spans.map((span) => span.start === span.end ? fullDate.format(asLimaDate(span.start)) : `${shortDate.format(asLimaDate(span.start))} – ${fullDate.format(asLimaDate(span.end))}`).join(" · "); }

export function ActivityCard({ activity, showResponsible = false }: { activity: Activity; showResponsible?: boolean }) {
  const rail = activity.status === "Programada" ? "border-l-cyan" : activity.status === "En proceso" ? "border-l-orange" : "border-l-green";
  return <Link aria-label={`Ver ${activity.title}`} href={`/actividades/${activity.id}`}><Card className={`border-l-[4px] p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-2)] ${rail}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="data-label text-cyan-ink">{formatActivityDates(activity)} · {activity.type}</p><h2 className="display-title mt-1.5 text-[0.95rem] leading-5 text-ink">{activity.title}</h2>{showResponsible && <p className="mt-1.5 text-xs text-ink-muted">Responsable: <strong className="text-ink">{activity.responsible}</strong></p>}{activity.origin === "burson" && <span className="mt-2 inline-flex rounded-full bg-violet/10 px-2 py-1 text-[0.625rem] font-extrabold text-violet">Origen Burson</span>}</div><StatusPill status={activity.status} /></div></Card></Link>;
}
