import { describe, expect, it } from "vitest";
import {
  activityOverlapsYear,
  calendarDateInLima,
  compareHistoricalActivities,
  currentLimaYear,
  historicalYearBounds,
  parseHistoricalYear,
  type HistoricalActivity,
} from "@/lib/historical";
import { isOverdue } from "@/lib/activity-simulation";

function activity(
  id: string,
  spans: HistoricalActivity["spans"],
): HistoricalActivity {
  return {
    id,
    type: "Edición",
    title: `Actividad ${id}`,
    responsible: "Ana Torres",
    status: "Programada",
    origin: "operario",
    spans,
    description: "Descripción",
    materialLink: "",
    operatorOpinion: "",
  };
}

describe("contrato temporal del Histórico", () => {
  it("usa el año de Lima incluso en el cambio de año UTC", () => {
    expect(calendarDateInLima(new Date("2027-01-01T04:59:59Z"))).toBe(
      "2026-12-31",
    );
    expect(currentLimaYear(new Date("2027-01-01T04:59:59Z"))).toBe(2026);
    expect(currentLimaYear(new Date("2027-01-01T05:00:00Z"))).toBe(2027);
  });

  it("calcula atrasos por fecha civil de Lima sin depender del huso del runtime", () => {
    const pending = activity("limite", [
      { start: "2026-08-30", end: "2026-08-30" },
    ]);
    expect(isOverdue(pending, new Date("2026-08-31T02:00:00Z"))).toBe(false);
    expect(isOverdue(pending, new Date("2026-08-31T05:00:00Z"))).toBe(true);
    pending.status = "Entregada";
    expect(isOverdue(pending, new Date("2026-09-01T12:00:00Z"))).toBe(false);
  });

  it("normaliza la URL con piso 2026 y límite técnico de cuatro dígitos", () => {
    const now = new Date("2028-06-01T12:00:00Z");
    expect(parseHistoricalYear(undefined, now)).toBe(2028);
    expect(parseHistoricalYear("2025", now)).toBe(2026);
    expect(parseHistoricalYear("2026", now)).toBe(2026);
    expect(parseHistoricalYear("9999", now)).toBe(9999);
    expect(parseHistoricalYear(["2030", "2031"], now)).toBe(2030);
    expect(parseHistoricalYear("abc", now)).toBe(2028);
    expect(parseHistoricalYear("2026.5", now)).toBe(2028);
    expect(parseHistoricalYear("99999", now)).toBe(2028);
    expect(parseHistoricalYear("-2026", now)).toBe(2028);
  });

  it("construye límites válidos y rechaza entradas fuera del contrato", () => {
    expect(historicalYearBounds(2026)).toEqual({
      start: "2026-01-01",
      end: "2026-12-31",
    });
    expect(() => historicalYearBounds(2025)).toThrow(RangeError);
    expect(() => historicalYearBounds(10000)).toThrow(RangeError);
    expect(() => historicalYearBounds(2026.5)).toThrow(RangeError);
  });

  it("detecta solapamientos inclusivos, cruces y jornadas discontinuas", () => {
    expect(
      activityOverlapsYear(
        activity("entra", [{ start: "2026-12-20", end: "2027-01-01" }]),
        2027,
      ),
    ).toBe(true);
    expect(
      activityOverlapsYear(
        activity("sale", [{ start: "2026-12-31", end: "2027-01-04" }]),
        2026,
      ),
    ).toBe(true);
    expect(
      activityOverlapsYear(
        activity("envuelve", [
          { start: "2026-01-02", end: "2026-01-02" },
          { start: "2027-02-01", end: "2027-02-01" },
        ]),
        2026,
      ),
    ).toBe(true);
    expect(
      activityOverlapsYear(
        activity("fuera", [{ start: "2027-01-01", end: "2027-01-02" }]),
        2026,
      ),
    ).toBe(false);
  });

  it("ordena por primera jornada y desempata por id", () => {
    const values = [
      activity("z", [{ start: "2026-05-01", end: "2026-05-02" }]),
      activity("b", [{ start: "2026-01-01", end: "2026-01-01" }]),
      activity("a", [{ start: "2026-01-01", end: "2026-01-02" }]),
    ];
    expect(values.sort(compareHistoricalActivities).map((item) => item.id)).toEqual([
      "a",
      "b",
      "z",
    ]);
  });
});
