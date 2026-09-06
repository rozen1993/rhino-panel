import type { Activity } from "@/lib/activities";

export const historicalYearFloor = 2026;
export const historicalYearCeiling = 9999;

const limaCalendarFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Lima",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export type HistoricalActivity = Pick<
  Activity,
  | "id"
  | "type"
  | "title"
  | "responsible"
  | "status"
  | "origin"
  | "spans"
  | "description"
  | "place"
  | "materialLink"
  | "operatorOpinion"
>;

export type HistoricalCategory = "Grabación" | "Edición";
export function parseHistoricalCategory(value: string | string[] | undefined): HistoricalCategory | undefined {
  return value === "grabacion" ? "Grabación" : value === "edicion" ? "Edición" : undefined;
}
export function historicalCategorySlug(category: HistoricalCategory) {
  return category === "Grabación" ? "grabacion" : "edicion";
}

export function calendarDateInLima(now = new Date()) {
  const parts = limaCalendarFormatter.formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((value) => value.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function currentLimaYear(now = new Date()) {
  return Math.max(
    historicalYearFloor,
    Number(calendarDateInLima(now).slice(0, 4)),
  );
}

export function parseHistoricalYear(
  value: string | string[] | undefined,
  now = new Date(),
) {
  const candidate = Array.isArray(value) ? value[0] : value;
  const fallback = currentLimaYear(now);
  if (!candidate || !/^\d{4}$/.test(candidate)) return fallback;
  const parsed = Number(candidate);
  return Math.min(
    historicalYearCeiling,
    Math.max(historicalYearFloor, parsed),
  );
}

export function historicalYearBounds(year: number) {
  if (
    !Number.isInteger(year) ||
    year < historicalYearFloor ||
    year > historicalYearCeiling
  ) {
    throw new RangeError(
      `El año histórico debe estar entre ${historicalYearFloor} y ${historicalYearCeiling}.`,
    );
  }
  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`,
  };
}

export function activityOverlapsYear(
  activity: Pick<HistoricalActivity, "spans">,
  year: number,
) {
  const bounds = historicalYearBounds(year);
  return activity.spans.some(
    (span) => span.start <= bounds.end && span.end >= bounds.start,
  );
}

export function compareHistoricalActivities(
  left: HistoricalActivity,
  right: HistoricalActivity,
) {
  const leftStart = left.spans.reduce(
    (earliest, span) =>
      !earliest || span.start < earliest ? span.start : earliest,
    "",
  );
  const rightStart = right.spans.reduce(
    (earliest, span) =>
      !earliest || span.start < earliest ? span.start : earliest,
    "",
  );
  return leftStart.localeCompare(rightStart) || left.id.localeCompare(right.id);
}
