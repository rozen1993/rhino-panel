import { describe, expect, it } from "vitest";
import { createAunorExamples } from "@/lib/aunor-examples";
import { aunorVisibleUntil, isCurrentAunorActivity, AUNOR_DELIVERY_WINDOW_MS } from "@/lib/aunor-visibility";

const delivered = Date.parse("2026-09-11T23:30:00-05:00");
const activity = {...createAunorExamples().activities[0],delivered_at:new Date(delivered).toISOString()};
describe("Aunor: ventana de entrega sin pérdida de historial",()=>{
  it("incluye la entrega durante 72 horas exactas, no hasta medianoche",()=>{
    expect(aunorVisibleUntil(activity)).toBe(delivered+AUNOR_DELIVERY_WINDOW_MS);
    for(const elapsed of [0,1,24*3600000,72*3600000-1]) expect(isCurrentAunorActivity(activity,delivered+elapsed)).toBe(true);
    expect(isCurrentAunorActivity(activity,delivered+AUNOR_DELIVERY_WINDOW_MS)).toBe(false);
    expect(isCurrentAunorActivity(activity,delivered+AUNOR_DELIVERY_WINDOW_MS+1)).toBe(false);
  });
  it("no extiende el plazo con una publicación ni una edición posterior",()=>{
    const edited = {...activity,published_at:"2026-09-20T00:00:00Z",updated_at:"2026-09-20T00:00:00Z"};
    expect(isCurrentAunorActivity(edited,Date.parse(edited.published_at))).toBe(false);
  });
  it("conserva programadas y en proceso de cualquier fecha",()=>{
    for(const status of ["Programada","En proceso"] as const) expect(isCurrentAunorActivity({...activity,status},Date.parse("2029-01-01"))).toBe(true);
  });
  it("una fecha ausente o inválida no inventa un plazo ni elimina el registro",()=>{
    for(const delivered_at of [null,undefined,"inválida"]) expect(isCurrentAunorActivity({...activity,delivered_at},delivered)).toBe(false);
    const original = structuredClone(activity);
    expect(isCurrentAunorActivity(activity,delivered+AUNOR_DELIVERY_WINDOW_MS)).toBe(false);
    expect(activity).toEqual(original);
  });
});
