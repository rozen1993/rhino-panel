import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { ClassificationBadge } from "@/components/classification-badge";
import { ClassificationPicker } from "@/components/classification-picker";
import type { ActivityClassification } from "@/lib/activity-classification";
import { SpecialActivityMark } from "@/components/special-activity-mark";

it.each([["standard","Estándar"],["special","Especial"],[null,"Estándar"]] as const)("conserva el nombre de %s y su icono decorativo", (value,label) => {
  const {container}=render(<ClassificationBadge value={value}/>);
  expect(screen.getByText(label)).toBeTruthy();
  expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
  expect(container.querySelectorAll('svg')).toHaveLength(1);
});

it("es estándar por defecto y solo requiere marcar Especial, sin enviar el formulario", () => {
  let submits=0;
  function Form() {
    const [value,setValue]=useState<ActivityClassification|null>(null);
    return <form onSubmit={event=>{event.preventDefault();submits++;}}><ClassificationPicker value={value} onChange={setValue}/></form>;
  }
  render(<Form/>);
  const checkbox=screen.getByRole('checkbox') as HTMLInputElement;
  expect(checkbox.checked).toBe(false);
  for (const checked of [true,false,true]) {
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(checked);
  }
  expect(submits).toBe(0);
  expect(screen.getByRole('group',{name:'Clasificación del trabajo'})).toBeTruthy();
});

it("el panel solo muestra el diamante en trabajos especiales", () => {
  const {rerender,container}=render(<SpecialActivityMark value={null}/>);
  expect(container.textContent).toBe("");
  expect(screen.queryByRole("img")).toBeNull();
  rerender(<SpecialActivityMark value="standard"/>);
  expect(screen.queryByRole("img")).toBeNull();
  rerender(<SpecialActivityMark value="special"/>);
  expect(screen.getByRole("img",{name:"Actividad especial"}).getAttribute("title")).toBe("Actividad especial");
});
