import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { ClassificationBadge } from "@/components/classification-badge";
import { ClassificationPicker } from "@/components/classification-picker";
import type { ActivityClassification } from "@/lib/activity-classification";

it.each([["standard","Estándar"],["special","Especial"],[null,"Sin clasificar"]] as const)("conserva el nombre de %s y su icono decorativo", (value,label) => {
  const {container}=render(<ClassificationBadge value={value}/>);
  expect(screen.getByText(label)).toBeTruthy();
  expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
  expect(container.querySelectorAll('svg')).toHaveLength(value ? 1 : 0);
});

it("permite elegir una sola clasificación y volver a Sin clasificar sin enviar el formulario", () => {
  let submits=0;
  function Form() {
    const [value,setValue]=useState<ActivityClassification|null>(null);
    return <form onSubmit={event=>{event.preventDefault();submits++;}}><ClassificationPicker value={value} onChange={setValue}/></form>;
  }
  render(<Form/>);
  const unknown=screen.getByRole('radio',{name:'Sin clasificar'}) as HTMLInputElement;
  expect(unknown.checked).toBe(true);
  for (const name of ['Especial','Estándar','Sin clasificar']) {
    fireEvent.click(screen.getByRole('radio',{name}));
    expect(screen.getAllByRole('radio').filter(el=>(el as HTMLInputElement).checked)).toHaveLength(1);
    expect((screen.getByRole('radio',{name}) as HTMLInputElement).checked).toBe(true);
  }
  expect(submits).toBe(0);
  expect(screen.getByRole('group',{name:'Clasificación del trabajo'})).toBeTruthy();
});
