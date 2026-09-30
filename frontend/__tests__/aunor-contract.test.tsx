import {fireEvent, render, screen, within} from "@testing-library/react";
import {beforeAll, describe, expect, it, vi} from "vitest";
import {AunorContract} from "@/components/aunor-contract";
import {createAunorExamples} from "@/lib/aunor-examples";
import {demoReferencePeriods} from "@/lib/contract-reference";
import type {AunorWorkspace} from "@/lib/aunor";

vi.mock("@/components/intent-link",()=>({IntentLink:({children,...props}:React.ComponentProps<"a">)=><a {...props}>{children}</a>}));
beforeAll(()=>{
  HTMLDialogElement.prototype.showModal=function(){this.setAttribute("open","");};
  HTMLDialogElement.prototype.close=function(){this.removeAttribute("open");};
});
function fixture() {
  const w=createAunorExamples();w.contractPeriods=demoReferencePeriods("2026-09");
  const period=w.contractPeriods.find(p=>p.service_id==="cobertura"&&p.starts_on==="2026-09-01")!;
  w.activities[0].contract_period_id=period.id;
  w.activities.push({...w.activities[0],id:"pending",title:"Pendiente sintética",status:"En proceso"});
  return w;
}
function mount(w: AunorWorkspace=fixture(),initialMonth="2026-09") {
  return render(<AunorContract w={w} initialMonth={initialMonth} renderReplacement={r=><p>{r.original_title} → {r.substitute_title}</p>}/>);
}
function openCoverage(){const card=screen.getByRole("button",{name:/^Cobertura fotográfica y audiovisual:/});fireEvent.click(card);return screen.getByRole("dialog");}

describe("tarjetas de contrato Aunor",()=>{
  it("separates 8 monthly and 4 annual services with real period counts",()=>{
    mount();
    expect(within(screen.getByRole("region",{name:"Servicios del mes"})).getAllByRole("button")).toHaveLength(8);
    expect(within(screen.getByRole("region",{name:"Compromisos del ciclo"})).getAllByRole("button")).toHaveLength(4);
    expect(within(screen.getByRole("region",{name:"Servicios del mes"})).queryByRole("button",{name:/^Videos de fiesta de fin de año:/})).toBeNull();
    expect(within(screen.getByRole("region",{name:"Compromisos del ciclo"})).getByRole("button",{name:/^Videos de fiesta de fin de año: 0\/2/})).toBeTruthy();
    expect(screen.getByRole("button",{name:/^Cobertura.*1\/10/})).toBeTruthy();
    expect(screen.getByRole("button",{name:/^Videos de seguridad vial: 0\/24/})).toBeTruthy();
    expect(screen.queryByText("Responsable")).toBeNull();
    expect(screen.queryByRole("button",{name:/Guardar|Confirmar entrega|Eliminar/})).toBeNull();
  });
  it("opens a read-only dialog, separates pending and excluded, restores focus on close",()=>{
    mount();const card=screen.getByRole("button",{name:/^Cobertura fotográfica/});card.focus();
    const dialog=openCoverage();
    expect(within(dialog).getByRole("heading",{name:"Entregas del periodo (1)"})).toBeTruthy();
    expect(within(dialog).getByText("Programadas o en proceso (1)")).toBeTruthy();
    expect(within(dialog).getByText("No computables (1)")).toBeTruthy();
    expect(within(dialog).getByText("Reemplazos documentados (1)")).toBeTruthy();
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.click(within(dialog).getByRole("button",{name:"Cerrar detalle"}));
    expect(screen.queryByRole("dialog")).toBeNull();expect(document.activeElement).toBe(card);
    expect(document.body.style.overflow).not.toBe("hidden");
  });
  it("filters monthly counts without reassigning data and keeps annual cycle",()=>{
    const w=fixture(),before=JSON.stringify(w);mount(w);
    fireEvent.change(screen.getByLabelText("Consultar mes"),{target:{value:"2026-04"}});
    expect(screen.getByRole("button",{name:/^Cobertura.*0\/10/})).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:/^Videos de resumen anual:/}));
    expect(within(screen.getByRole("dialog")).getByText(/Control anual · 2026-04-01 — 2027-03-31/)).toBeTruthy();
    expect(JSON.stringify(w)).toBe(before);
  });
  it("does not invent targets for a missing period",()=>{
    mount(fixture(),"2026-03");
    expect(screen.getByRole("button",{name:/^Cobertura.*0 \/ —/})).toBeTruthy();
    const dialog=openCoverage();
    expect(within(dialog).queryByRole("progressbar")).toBeNull();
    expect(within(dialog).getByText(/La meta de referencia no se aplica/)).toBeTruthy();
  });
  it("counts fiesta against a single annual target, not a fresh target each month",()=>{
    const w=fixture(),period=w.contractPeriods!.find(p=>p.service_id==="fiesta")!;
    w.activities.push({...w.activities[0],id:"fiesta-anual",service_id:"fiesta",contract_period_id:period.id});
    mount(w,"2026-04");
    const annual=screen.getByRole("region",{name:"Compromisos del ciclo"});
    expect(within(annual).getByRole("button",{name:/^Videos de fiesta de fin de año: 1\/2/})).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Consultar mes"),{target:{value:"2026-12"}});
    fireEvent.click(within(annual).getByRole("button",{name:/^Videos de fiesta de fin de año: 1\/2/}));
    expect(within(screen.getByRole("dialog")).getByText(/Control anual · 2026-04-01 — 2027-03-31/)).toBeTruthy();
  });
  it("shows excess without multiplying Special or moving it to another month",()=>{
    const w=fixture();const base=w.activities[0];
    w.activities=Array.from({length:15},(_,i)=>({...base,id:`special-${i}`,classification:"special" as const}));
    mount(w);const dialog=openCoverage();
    expect(within(dialog).getByText("+5 sobre la meta · sin traslado a otro periodo")).toBeTruthy();
    expect(within(dialog).getByRole("heading",{name:"Entregas del periodo (15)"})).toBeTruthy();
    expect(within(dialog).getByRole("progressbar").getAttribute("aria-valuetext")).toBe("15 de 10 trabajos entregados");
  });
  it("keeps unknown target and explicit zero distinct",()=>{
    const w=fixture();const period=w.contractPeriods!.find(p=>p.id===w.activities[0].contract_period_id)!;period.target=null;
    const {unmount}=mount(w);let dialog=openCoverage();expect(within(dialog).queryByRole("progressbar")).toBeNull();
    expect(within(dialog).getByText(/No se calcula un porcentaje/)).toBeTruthy();unmount();
    period.target=0;mount(w);dialog=openCoverage();expect(within(dialog).queryByRole("progressbar")).toBeNull();
    expect(within(dialog).getByText("+1 sobre la meta · sin traslado a otro periodo")).toBeTruthy();
  });
  it("keeps unlinked work accessible and does not expose it in delivered totals",()=>{
    mount();fireEvent.click(screen.getByRole("button",{name:"Ver trabajos"}));
    const region=screen.getByRole("region",{name:"Trabajos por relacionar"});
    expect(within(region).getByRole("link",{name:/Registro de señalización/}).getAttribute("href")).toBe("/aunor/actividades/aunor-senalizacion");
    expect(screen.getByRole("button",{name:/^Cobertura.*1\/10/})).toBeTruthy();
  });
  it("handles refreshed counts and a removed selected service without retaining stale data",()=>{
    const w=fixture();const rendered=mount(w);openCoverage();
    const updated=structuredClone(w);updated.activities[0].contract_period_id=null;
    rendered.rerender(<AunorContract w={updated} initialMonth="2026-09" renderReplacement={()=>null}/>);
    expect(within(screen.getByRole("dialog")).getByText("Por confirmar periodo (1)")).toBeTruthy();
    expect(within(screen.getByRole("dialog")).getByRole("heading",{name:"Entregas del periodo (0)"})).toBeTruthy();
    updated.services=[];rendered.rerender(<AunorContract w={{...updated}} initialMonth="2026-09" renderReplacement={()=>null}/>);
    expect(within(screen.getByRole("dialog")).getByRole("heading",{name:"Servicio no disponible"})).toBeTruthy();
  });
});
