import {fireEvent, render, screen, within} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import {AunorContract} from "@/components/aunor-contract";
import {ContractCenter} from "@/components/contract-center";
import {createAunorExamples} from "@/lib/aunor-examples";
import {demoReferencePeriods} from "@/lib/contract-reference";
import type {AunorWorkspace} from "@/lib/aunor";

function fixture() {
  const w=createAunorExamples(); w.contractPeriods=demoReferencePeriods("2026-09");
  w.activities[0].contract_period_id=w.contractPeriods.find(p=>p.service_id==="cobertura"&&p.starts_on==="2026-09-01")!.id;
  w.activities.push({...w.activities[0],id:"pending",title:"Pendiente sintética",status:"En proceso"});
  return w;
}
function mount(w: AunorWorkspace=fixture(),initialMonth="2026-09") {
  return render(<AunorContract w={w} initialMonth={initialMonth} renderReplacement={r=><p>{r.original_title} → {r.substitute_title}</p>}/>);
}
function openCoverage(){fireEvent.click(screen.getByRole("button",{name:/^Cobertura fotográfica y audiovisual:/}));return screen.getByRole("region",{name:"Detalle del servicio"});}
const annual=()=>fireEvent.click(screen.getByRole("button",{name:"Anual"}));

describe("contrato común con permisos de cliente",()=>{
  it("keeps 8 monthly and 4 annual services, with fiesta annual and no mutations",()=>{
    mount();
    expect(within(screen.getByRole("region",{name:"Servicios mensuales"})).getAllByRole("button")).toHaveLength(8);
    expect(screen.queryByRole("button",{name:/^Videos de fiesta de fin de año:/})).toBeNull();
    expect(screen.getByRole("button",{name:/^Cobertura.*1\/10/})).toBeTruthy();
    expect(screen.getByRole("button",{name:/^Videos de seguridad vial: 0\/24/})).toBeTruthy();
    annual();
    expect(within(screen.getByRole("region",{name:"Servicios anuales"})).getAllByRole("button")).toHaveLength(4);
    expect(screen.getByRole("button",{name:/^Videos de fiesta de fin de año: 0\/2/})).toBeTruthy();
    expect(screen.queryByText("Responsable")).toBeNull();
    expect(screen.queryByRole("button",{name:/Guardar|Confirmar entrega|Eliminar|Periodos y metas|Revisar excepciones/})).toBeNull();
  });
  it("opens inline detail, separates pending and excluded, keeps replacements and restores focus",()=>{
    mount(); const card=screen.getByRole("button",{name:/^Cobertura fotográfica/});card.focus();
    const detail=openCoverage();
    expect(document.activeElement).toBe(detail);
    expect(within(detail).getByRole("heading",{name:"Entregas del periodo (1)"})).toBeTruthy();
    expect(within(detail).getByText("Programadas o en proceso (1)")).toBeTruthy();
    expect(within(detail).getByText("No computables · todos los periodos (1)")).toBeTruthy();
    expect(within(detail).getByText("Reemplazos documentados (1)")).toBeTruthy();
    expect(within(detail).getByRole("link",{name:/Ver original/}).getAttribute("href")).toContain("/aunor/reemplazos/");
    expect(within(detail).queryByText("Configurar periodos y metas")).toBeNull();
    fireEvent.click(within(detail).getByRole("button",{name:"Cerrar detalle"}));
    expect(screen.queryByRole("region",{name:"Detalle del servicio"})).toBeNull();
    expect(document.activeElement).toBe(card);
  });
  it("filters month without reassigning dates and retains access to stored periods",()=>{
    const w=fixture(),before=JSON.stringify(w);mount(w);
    fireEvent.change(screen.getByLabelText("Consultar mes"),{target:{value:"2026-04"}});
    expect(screen.getByRole("button",{name:/^Cobertura.*0\/10/})).toBeTruthy();
    const detail=openCoverage();
    fireEvent.change(within(detail).getByLabelText("Periodos registrados"),{target:{value:w.activities[0].contract_period_id}});
    expect(screen.getByRole("button",{name:/^Cobertura.*1\/10/})).toBeTruthy();
    annual();
    fireEvent.click(screen.getByRole("button",{name:/^Videos de resumen anual:/}));
    expect(within(screen.getByRole("region",{name:"Detalle del servicio"})).getByText(/2026-04-01 — 2027-03-31 · 0\/2/)).toBeTruthy();
    expect(JSON.stringify(w)).toBe(before);
    expect(screen.getByLabelText("Consultar mes").getAttribute("type")).toBe("month");
  });
  it("does not invent a target before the contract starts",()=>{
    mount(fixture(),"2026-03");
    expect(screen.getByRole("button",{name:/^Cobertura.*0 \/ —/})).toBeTruthy();
    const detail=openCoverage();
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(within(detail).getByText(/La meta de referencia no se aplica/)).toBeTruthy();
  });
  it("keeps fiesta against one annual quota across months",()=>{
    const w=fixture(),p=w.contractPeriods!.find(p=>p.service_id==="fiesta")!;
    w.activities.push({...w.activities[0],id:"fiesta-anual",service_id:"fiesta",contract_period_id:p.id});
    mount(w,"2026-04");annual();
    expect(screen.getByRole("button",{name:/^Videos de fiesta de fin de año: 1\/2/})).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Consultar mes"),{target:{value:"2026-12"}});
    expect(screen.getByRole("button",{name:/^Videos de fiesta de fin de año: 1\/2/})).toBeTruthy();
  });
  it("does not multiply Special or transfer excess",()=>{
    const w=fixture(); w.activities=Array.from({length:15},(_,i)=>({...w.activities[0],id:`special-${i}`,classification:"special" as const}));
    mount(w);const detail=openCoverage();
    expect(within(detail).getByText("+5 sobre la meta · sin traslado a otro periodo")).toBeTruthy();
    expect(within(detail).getByRole("heading",{name:"Entregas del periodo (15)"})).toBeTruthy();
    expect(screen.getByRole("progressbar",{name:/Avance de Cobertura/}).getAttribute("aria-valuetext")).toBe("15 de 10 trabajos entregados");
  });
  it("distinguishes null and zero quotas",()=>{
    const w=fixture(),p=w.contractPeriods!.find(p=>p.id===w.activities[0].contract_period_id)!;p.target=null;
    const {unmount}=mount(w);expect(within(openCoverage()).getByText(/No se calcula un porcentaje/)).toBeTruthy();unmount();
    p.target=0;mount(w);
    expect(screen.queryByRole("progressbar",{name:/Avance de Cobertura/})).toBeNull();
    expect(within(openCoverage()).getByText("+1 sobre la meta · sin traslado a otro periodo")).toBeTruthy();
  });
  it("keeps unlinked work accessible without adding it to quotas",()=>{
    mount();fireEvent.click(screen.getByRole("button",{name:"Ver trabajos sin servicio"}));
    const region=screen.getByRole("region",{name:"Excepciones contractuales"});
    expect(within(region).getByRole("link",{name:/Registro de señalización/}).getAttribute("href")).toBe("/aunor/actividades/aunor-senalizacion");
    expect(screen.getByRole("button",{name:/^Cobertura.*1\/10/})).toBeTruthy();
  });
  it("updates counts and explains when the selected service disappears",()=>{
    const w=fixture();const rendered=mount(w);openCoverage();
    const updated=structuredClone(w);updated.activities[0].contract_period_id=null;
    rendered.rerender(<AunorContract w={updated} initialMonth="2026-09" renderReplacement={()=>null}/>);
    expect(within(screen.getByRole("region",{name:"Detalle del servicio"})).getByRole("heading",{name:"Entregas del periodo (0)"})).toBeTruthy();
    rendered.rerender(<AunorContract w={{...updated,services:[]}} initialMonth="2026-09" renderReplacement={()=>null}/>);
    expect(screen.getByRole("heading",{name:"Servicio no disponible"})).toBeTruthy();
  });
  it("renders identical service cards for both roles but loads management only when requested",()=>{
    const w=fixture(),manage=vi.fn(()=> <p>Editor exclusivo Admin</p>);
    const client=mount(w);const before=screen.getByRole("region",{name:"Servicios mensuales"}).innerHTML;client.unmount();
    render(<ContractCenter w={w} initialMonth="2026-09" management={manage}/>);
    expect(screen.getByRole("region",{name:"Servicios mensuales"}).innerHTML).toBe(before);
    expect(manage).not.toHaveBeenCalled();fireEvent.click(screen.getByRole("button",{name:"Periodos y metas"}));
    expect(manage).toHaveBeenCalledWith("cobertura");
    expect(screen.getByText("Editor exclusivo Admin")).toBeTruthy();
    expect(screen.getAllByRole("link",{name:"Cobertura audiovisual Norte"})[0].getAttribute("href")).toMatch(/^\/actividades\//);
  });
});
