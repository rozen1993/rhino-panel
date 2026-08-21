import type { InternalStatus } from "@/components/status-pill";
import { activityTypes, type ActivityType } from "@/lib/roles";
export { activityTypes }; export type { ActivityType };
export type DateSpan = { start: string; end: string };
export type Activity = { id: string; type: ActivityType; title: string; responsible: string; responsibleAccountId: string; status: InternalStatus; origin: "operario" | "burson"; spans: DateSpan[]; description: string; place: string; materialLink: string; operatorOpinion: string; deletedAt?: string };
export function requiresLocation(type: ActivityType) { return type === "Grabación"; }
export function requiresMaterialLink() { return true; }
export function showsProgress() { return false; }
export function firstDate(activity: Pick<Activity, "spans">) { return activity.spans.map((span) => span.start).sort()[0] ?? ""; }
export function lastDate(activity: Pick<Activity, "spans">) { return activity.spans.map((span) => span.end).sort().at(-1) ?? ""; }
