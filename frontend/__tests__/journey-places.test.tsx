import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActivityJourneys } from "@/components/activity-journeys";
import { normalizeSpans, spanPlace } from "@/lib/activities";
import { validSpans } from "@/lib/activity-validation";
import { parseActivityDraft } from "@/lib/activity-draft";
import { actorFromRole, createOwnActivity, readActivities, replanActivity, updateExecutionActivity } from "@/lib/activity-simulation";
import { roles } from "@/lib/roles";

const spans = [{ start: "2026-09-10", end: "2026-09-10", place: " Norte " }, { start: "2026-09-10", end: "2026-09-10", place: "Sur" }];
const fields = { type: "Grabación" as const, title: "Test multi-sede", description: "Ejemplo ficticio", placeName: "Lima", responsibleAccountId: "account-ana", spans, materialLink: "", notes: "", referenceLink: "" };
const admin = { ...roles.admin, accountId: "account-admin", accountName: "Admin" };
const operator = { ...roles.operario, accountId: "account-ana", accountName: "Ana Torres", canCreateOwnActivities: true };
class MemoryStorage { values = new Map<string, string>(); getItem(k: string) { return this.values.get(k) ?? null; } setItem(k: string,v: string) { this.values.set(k,v); } }

describe("lugares por jornada", () => {
  it("admite fechas iguales con lugares diferentes y hereda el general", () => {
    expect(validSpans(spans)).toBe(true);
    expect(normalizeSpans(spans).map(s => s.place)).toEqual(["Norte", "Sur"]);
    expect(spanPlace({ start: "", end: "", place: " " }, "Lima")).toBe("Lima");
    expect(validSpans([{ ...spans[0], place: null }])).toBe(false);
    expect(validSpans([{ ...spans[0], place: 12 }])).toBe(false);
    expect(validSpans([{ ...spans[0], place: "x".repeat(301) }])).toBe(false);
  });
  it("lee borradores v5 antiguos y nuevos sin cambiar la clave", () => {
    for (const places of [spans, spans.map(({start,end})=>({start,end}))]) {
      expect(parseActivityDraft(JSON.stringify({ version: 5, idempotencyKey: "00000000-0000-4000-8000-000000000001", savedAt: new Date().toISOString(), fields: { ...fields, spans: places } }))?.fields.spans).toEqual(places);
    }
  });
  it("muestra cada pareja fecha-lugar, sin colapsar jornadas coincidentes", () => {
    render(<ActivityJourneys activity={{ place: "Lima", spans }} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Norte")).toBeTruthy();
    expect(screen.getByText("Sur")).toBeTruthy();
  });
  it("demo conserva lugares e idempotencia y reserva replanificación al Admin", () => {
    const storage = new MemoryStorage();
    const created = createOwnActivity(storage, fields, operator, "journeys-test");
    expect(created.ok).toBe(true); if (!created.ok) return;
    expect(readActivities(storage).find(a=>a.id===created.activity.id)?.spans).toEqual(normalizeSpans(spans));
    expect(createOwnActivity(storage, {...fields, spans: normalizeSpans(spans)}, operator, "journeys-test").ok).toBe(true);
    expect(createOwnActivity(storage, {...fields, spans: [{ ...spans[0], place: "Otro" }]}, operator, "journeys-test").ok).toBe(false);
    const changed = { ...fields, spans: [{ ...spans[0], place: "Este" }] };
    expect(replanActivity(storage, storage, created.activity.id, changed, actorFromRole(operator), 1).ok).toBe(false);
    expect(replanActivity(storage, storage, created.activity.id, changed, actorFromRole(admin), 1).ok).toBe(true);
    const after = readActivities(storage).find(a=>a.id===created.activity.id)!;
    expect(after.version).toBe(2);
    expect(after.spans[0].place).toBe("Este");
    updateExecutionActivity(storage, after.id, { materialLink: "", notes: "Entrega" }, actorFromRole(operator), after.version);
    expect(readActivities(storage).find(a=>a.id===after.id)?.spans).toEqual(after.spans);
  });
});
