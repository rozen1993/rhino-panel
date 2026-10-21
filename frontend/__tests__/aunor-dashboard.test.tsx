import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { AunorDashboard } from "@/components/aunor-dashboard";
import { createAunorExamples } from "@/lib/aunor-examples";
import { DetailPanel } from "@/components/calendar-detail-panel";

afterEach(()=>{cleanup();vi.useRealTimers();window.history.replaceState(null,'','/');});
it("muestra una sola tarjeta en el histórico Aunor y conserva su privacidad al abrir y volver", () => {
  const item={id:"single",title:"Una cobertura",type:"Grabación" as const,status:"Programada" as const,
    classification:"standard" as const,place:"Lima",description:"Resumen",materialLink:"",
    spans:[{start:"2026-04-07",end:"2026-04-07",place:"Lima"}],responsible:"OPERARIO PRIVADO",
    operatorOpinion:"OPINIÓN PRIVADA",origin:"operario" as const};
  render(<DetailPanel clientView item={item} choices={[item]} onChoose={()=>{}} titleId="single-title" today="2026-10-05" selectedDate="2026-04-07"/>);
  expect(screen.getAllByRole("article")).toHaveLength(1);
  expect(screen.getByText("1 actividad en esta fecha")).toBeTruthy();
  expect(screen.queryByText("Estándar", {exact:true})).toBeNull();
  fireEvent.click(screen.getByRole("button",{name:/Ver detalles:/}));
  expect(screen.queryByText("OPERARIO PRIVADO")).toBeNull();
  expect(screen.queryByText("OPINIÓN PRIVADA")).toBeNull();
  expect(screen.queryByText("Estándar",{exact:true})).toBeNull();
  fireEvent.click(screen.getByRole("button",{name:"Volver a las actividades del día"}));
  expect(screen.getAllByRole("article")).toHaveLength(1);
  expect(document.activeElement).toBe(screen.getByRole("button",{name:/Ver detalles:/}));
});
it("abre el mes actual y mantiene entregas antiguas y regularizadas sin fecha de cierre",()=>{
  const w=createAunorExamples();
  w.activities[0].delivered_at="2026-01-04T12:00:00Z";
  w.activities[3].delivered_at=null;
  window.history.replaceState(null,'','/aunor?periodo=2026-01');
  render(<AunorDashboard w={w} today="2026-10-19"/>);
  expect(screen.getAllByRole("button",{name:"Vista rápida de Cobertura audiovisual Norte"}).length).toBeGreaterThan(0);
  expect(screen.getAllByRole("button",{name:"Vista rápida de Registro de señalización"}).length).toBeGreaterThan(0);
  expect(screen.queryByRole("button",{name:"Vista rápida de Edición campaña de seguridad vial"})).toBeNull();
  expect(screen.getByRole('link',{name:'Abrir ficha completa'}).getAttribute('href')).toContain('/aunor/actividades/');
  expect(w.activities).toHaveLength(4);
});
it("ofrece filtros y una vista previa sin responsable ni acciones de gestión",()=>{
  const w=createAunorExamples();
  render(<AunorDashboard w={w} today="2026-01-14"/>);
  fireEvent.change(screen.getByLabelText("Buscar actividad"),{target:{value:"Taller"}});
  expect(screen.queryByRole("button",{name:/Vista rápida de Edición/})).toBeNull();
  expect(screen.getByRole("link",{name:/Abrir ficha completa/}).getAttribute("href")).toContain("/aunor/actividades/aunor-original?volver=");
  expect(window.location.pathname).toBe('/aunor');
  expect(screen.queryByText("Responsable")).toBeNull();
  expect(screen.queryByRole("button",{name:/Eliminar|Confirmar|Planificar|Restablecer/})).toBeNull();
});
it("reutiliza el detalle de Histórico sin información interna y permite volver al listado",()=>{
  const items=[1,2].map(id=>({id:String(id),title:`Actividad ${id}`,type:"Grabación" as const,status:"Programada" as const,place:"Lima",description:"Resumen",materialLink:"",spans:[{start:"2026-09-14",end:"2026-09-14",place:"Lima"}],responsible:"OPERARIO PRIVADO",operatorOpinion:"OPINIÓN PRIVADA",origin:"operario" as const}));
  render(<DetailPanel clientView item={items[0]} choices={items} onChoose={()=>{}} titleId="detail-title" today="2026-09-14" selectedDate="2026-09-14"/>);
  expect(screen.queryByText("OPERARIO PRIVADO")).toBeNull();
  fireEvent.click(screen.getByRole("button",{name:/Ver detalles: Grabación · Actividad 1/}));
  expect(screen.queryByText("Responsable")).toBeNull();
  expect(screen.queryByText("Opinión del operario")).toBeNull();
  expect(screen.queryByText("OPINIÓN PRIVADA")).toBeNull();
  fireEvent.click(screen.getByRole("button",{name:"Volver a las actividades del día"}));
  expect(screen.getAllByRole("button",{name:/Ver detalles:/})).toHaveLength(2);
});
