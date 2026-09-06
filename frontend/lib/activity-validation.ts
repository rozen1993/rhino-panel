import { activityTypes, type DateSpan } from "@/lib/activities";
import type { ActivityDraftFields } from "@/lib/activity-draft";

export const activityHistoryFloor = "2026-01-01";

export function validCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export function validSpans(spans: unknown): spans is DateSpan[] {
  return (
    Array.isArray(spans) &&
    spans.length > 0 &&
    spans.length <= 100 &&
    spans.every(
      (span) =>
        typeof span === "object" &&
        span !== null &&
        (span.place === undefined ||
          (typeof span.place === "string" && span.place.length <= 300)) &&
        validCalendarDate(span.start) &&
        validCalendarDate(span.end) &&
        span.start >= activityHistoryFloor &&
        span.end >= span.start &&
        Date.parse(`${span.end}T00:00:00Z`) -
          Date.parse(`${span.start}T00:00:00Z`) <=
          3660 * 86_400_000,
    )
  );
}

export function activityPlanningError(
  fields: ActivityDraftFields | unknown,
): string | null {
  if (!fields || typeof fields !== "object")
    return "Completa título, descripción y fechas válidas.";
  const candidate = fields as Partial<ActivityDraftFields>;
  const title = typeof candidate.title === "string" ? candidate.title.trim() : "";
  const description =
    typeof candidate.description === "string"
      ? candidate.description.trim()
      : "";
  if (
    typeof candidate.placeName !== "string" ||
    !activityTypes.includes(candidate.type as (typeof activityTypes)[number]) ||
    title.length < 2 ||
    title.length > 180 ||
    description.length < 2 ||
    description.length > 5000 ||
    !validSpans(candidate.spans)
  )
    return "Completa título, descripción y fechas válidas.";
  if (candidate.placeName.length > 300)
    return "El lugar supera el tamaño permitido.";
  return null;
}
