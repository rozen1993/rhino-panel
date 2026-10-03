import {fireEvent,render,screen,within} from "@testing-library/react";
import {expect,it,vi} from "vitest";
import {ActivityTable} from "@/components/activity-table";
import {ActivityCard} from "@/components/activity-card";
import type {Activity} from "@/lib/activities";
const activities: Activity[] = [{id:"synthetic",title:"Cobertura sintética",type:"Grabación",status:"Programada",responsible:"Persona de ejemplo",responsibleAccountId:"example",origin:"operario",spans:[{start:"2026-04-12",end:"2026-04-12"}],place:"Sede de ejemplo",description:"Ejemplo",materialLink:"",operatorOpinion:""}];

it("selects from row and title without swallowing material links",()=>{
  const a={...activities[0],materialLink:"https://example.invalid/material"},select=vi.fn();
  render(<ActivityTable activities={[a]} selectedId={a.id} onSelect={select} showResponsible/>);
  const title=screen.getByRole("button",{name:a.title});
  expect(title.getAttribute("aria-pressed")).toBe("true");
  fireEvent.click(title);expect(select).toHaveBeenCalledTimes(1);
  const row=title.closest("tr")!;fireEvent.click(within(row).getByText(a.place));
  expect(select).toHaveBeenCalledTimes(2);expect(document.activeElement).toBe(title);
  fireEvent.click(screen.getByRole("link",{name:`Abrir material de ${a.title}`}));
  expect(select).toHaveBeenCalledTimes(2);
  const selection=vi.spyOn(window,"getSelection").mockReturnValue({toString:()=>"selected text"} as Selection);
  fireEvent.click(within(row).getByText(a.place));expect(select).toHaveBeenCalledTimes(2);selection.mockRestore();
});
it("retains direct navigation for roles without quick preview",()=>{
  render(<ActivityTable activities={[activities[0]]}/>);
  expect(screen.getByRole("link",{name:`Ver ${activities[0].title}`})).toBeTruthy();
  expect(screen.queryByRole("button")).toBeNull();
});
it("opens mobile summary only when a callback is provided",()=>{
  const select=vi.fn();const a=activities[0];
  const {unmount}=render(<ActivityCard activity={a} onSelect={select}/>);
  fireEvent.click(screen.getByRole("button",{name:`Vista rápida de ${a.title}`}));expect(select).toHaveBeenCalledWith(a);unmount();
  render(<ActivityCard activity={a}/>);expect(screen.getByRole("link")).toBeTruthy();
});
