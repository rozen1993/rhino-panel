"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { DraftNotice } from "@/components/draft-notice";
import { FormField } from "@/components/form-field";
import { activityTypes, type ActivityType, showsProgress } from "@/lib/activities";

const controlClass = "min-h-11 w-full rounded-[5px] border border-line bg-panel px-3 py-2 text-sm text-ink";

function SelectField({ id, label, required, children, value, onChange }: { id: string; label: string; required?: boolean; children: React.ReactNode; value?: string; onChange?: React.ChangeEventHandler<HTMLSelectElement> }) {
  return <div className="flex flex-col gap-2"><label className="text-sm font-bold" htmlFor={id}>{label}{required && <span className="ml-1 text-red">*</span>}</label><select className={controlClass} id={id} onChange={onChange} required={required} value={value}>{children}</select></div>;
}

function TextAreaField({ id, label, placeholder }: { id: string; label: string; placeholder: string }) {
  return <div className="flex flex-col gap-2"><label className="text-sm font-bold" htmlFor={id}>{label}</label><textarea className={`${controlClass} min-h-24 resize-y`} id={id} placeholder={placeholder} /></div>;
}

export function ActivityForm({ editing = false }: { editing?: boolean }) {
  const [type, setType] = useState<ActivityType>(editing ? "Grabación" : "Grabación");
  const [draft, setDraft] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const sendTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (sendTimer.current) clearTimeout(sendTimer.current); }, []);

  function markDraft() {
    setDraft(true);
    if (sendTimer.current) clearTimeout(sendTimer.current);
    sendTimer.current = setTimeout(() => setDraft(false), 8000);
  }

  function retry() {
    setRetrying(true);
    setTimeout(() => { setRetrying(false); setDraft(false); }, 900);
  }

  return (
    <form className="space-y-4" onChange={markDraft} onSubmit={(event) => event.preventDefault()}>
      {draft && <DraftNotice onRetry={retry} retrying={retrying} />}

      <Card className="space-y-4 p-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
        <div className="lg:col-span-2"><p className="text-xs font-bold uppercase tracking-[0.14em] text-blue">Obligatorios</p><p className="mt-1 text-xs text-ink-muted">Completa primero lo necesario para programar el trabajo.</p></div>
        <FormField defaultValue={editing ? "2026-08-17T08:30" : undefined} id="activity-date" label="Fecha" required type="datetime-local" />
        <SelectField id="activity-type" label="Tipo" onChange={(event) => setType(event.target.value as ActivityType)} required value={type}>{activityTypes.map((item) => <option key={item}>{item}</option>)}</SelectField>
        <div className="lg:col-span-2"><FormField defaultValue={editing ? "Cobertura de mantenimiento en peaje Chillón" : undefined} id="activity-title" label="Título" placeholder="Escribe el título de la actividad" required /></div>
        <SelectField id="activity-responsible" label="Responsable" required><option value="">Selecciona una persona</option><option>Johann</option><option>Martín</option><option>Eduardo</option><option>Chiara</option></SelectField>
        <SelectField id="activity-status" label="Estado inicial" required><option value="">Selecciona un estado</option><option>Programada</option><option>En proceso</option></SelectField>
        {showsProgress(type) && <SelectField id="activity-progress" label="Avance" required><option>0%</option><option>25%</option><option>50%</option><option>55%</option><option>75%</option><option>100%</option></SelectField>}
      </Card>

      <Card className="space-y-3 p-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
        <div className="lg:col-span-2"><p className="text-xs font-bold uppercase tracking-[0.14em] text-blue">Ubicación</p><p className="mt-1 text-xs text-ink-muted">El nombre del lugar basta; añade precisión solo si hace falta.</p></div>
        <FormField defaultValue={editing ? "peaje Chillón" : undefined} id="place-name" label="Nombre del lugar" placeholder="Ej. peaje Chillón" required />
        <details className="rounded-[5px] border border-line bg-panel-secondary p-3 lg:col-span-2">
          <summary className="cursor-pointer text-sm font-bold">Más datos de ubicación</summary>
          <div className="mt-4 space-y-4"><FormField defaultValue={editing ? "caseta norte" : undefined} id="place-reference" label="Referencia" /><div className="grid grid-cols-2 gap-3"><FormField defaultValue={editing ? "25.4" : undefined} id="place-km" label="Kilómetro" /><FormField defaultValue={editing ? "Norte → Sur" : undefined} id="place-direction" label="Sentido" /></div><div className="grid grid-cols-2 gap-3"><FormField id="place-latitude" label="Latitud" inputMode="decimal" /><FormField id="place-longitude" label="Longitud" inputMode="decimal" /></div></div>
        </details>
      </Card>

      <Card className="space-y-4 p-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue lg:col-span-2">Detalles y entrega</p>
        <div className="lg:col-span-2"><TextAreaField id="activity-description" label="Descripción" placeholder="Describe la actividad" /></div>
        <FormField id="delivery-date" label="Entrega prevista" type="datetime-local" />
        <FormField id="material-link" label="Enlace al material" placeholder="https://onedrive.live.com/..." type="url" />
        <p className="-mt-2 text-xs text-ink-muted lg:col-start-2 lg:mt-[-0.5rem]">Enlace a la carpeta del material.</p>
        <div className="lg:col-span-2"><TextAreaField id="activity-notes" label="Notas" placeholder="Notas internas para el equipo" /></div>
      </Card>

      <Button className="w-full lg:ml-auto lg:w-64" type="submit">{editing ? "Guardar cambios" : "Guardar actividad"}</Button>
    </form>
  );
}
