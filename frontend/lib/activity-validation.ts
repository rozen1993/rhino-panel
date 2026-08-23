import type { DateSpan } from "@/lib/activities";

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
        validCalendarDate(span.start) &&
        validCalendarDate(span.end) &&
        span.end >= span.start &&
        Date.parse(`${span.end}T00:00:00Z`) -
          Date.parse(`${span.start}T00:00:00Z`) <=
          3660 * 86_400_000,
    )
  );
}
