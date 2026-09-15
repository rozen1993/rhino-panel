import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { AunorDashboard } from "@/components/aunor-dashboard";
import { createAunorExamples } from "@/lib/aunor-examples";
import { DetailPanel } from "@/components/calendar-detail-panel";

afterEach(()=>{cleanup();vi.useRealTimers();});
it("muestra todos los estados y retira solo la entrega al cumplir las 72 horas",()=>{
  vi.useFakeTimers();
  const w=createAunorExamples();
  const now=Date.parse("2026-09-14T20:00:00Z");
  vi.setSystemTime(now);
  w.activities[0].delivered_at=new Date(now-72*3600000+1000).toISOString();
  w.activities[3].delivered_at="2026-01-01T00:00:00Z";
  render(<AunorDashboard w={w} today="2026-09-14" initialNow={now}/>);
  expect(screen.getByRole("button",{name:"Ver detalles: Cobertura audiovisual Norte"})).toBeTruthy();
  expect(screen.getByRole("button",{name:"Ver detalles: Edición campaña de seguridad vial"})).toBeTruthy();
  expect(screen.getByRole("button",{name:"Ver detalles: Taller de seguridad vial"})).toBeTruthy();
  expect(screen.queryByRole("button",{name:/Ver detalles: Registro de señalización/})).toBeNull();
  act(()=>vi.advanceTimersByTime(1000));
  expect(screen.queryByRole("button",{name:"Ver detalles: Cobertura audiovisual Norte"})).toBeNull();
  expect(w.activities).toHaveLength(4);
});
it("ofrece filtros y una vista previa sin responsable ni acciones de gestión",()=>{
  const w=createAunorExamples();
  render(<AunorDashboard w={w} today="2026-09-14" initialNow={Date.parse("2026-09-14")}/>);
  fireEvent.change(screen.getByLabelText("Buscar actividad"),{target:{value:"Taller"}});
  expect(screen.queryByRole("button",{name:/Ver detalles: Edición/})).toBeNull();
  expect(screen.getByRole("link",{name:/Ver actividad completa/}).getAttribute("href")).toBe("/aunor/actividades/aunor-original");
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
