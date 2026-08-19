"use client";

import { type ChangeEvent, type FormEvent, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { DraftNotice } from "@/components/draft-notice";
import { FormField } from "@/components/form-field";
import Link from "next/link";
import { activityTypes, type ActivityType, requiresLocation, showsProgress } from "@/lib/activities";
import { upsertActivity, useSimulatedActivities, type SimulatedActivity } from "@/lib/activity-simulation";
import { useAccounts } from "@/lib/account-store";
import { safeMaterialUrl } from "@/lib/external-link";
import {
  activityDraftStorageKey,
  type ActivityDraftFields,
  createIdempotencyKey,
  parseActivityDraft,
  writeActivityDraft,
} from "@/lib/activity-draft";
import type { Role } from "@/lib/roles";

const controlClass = "min-h-11 w-full rounded-[5px] border border-line bg-panel px-3 py-2 text-sm text-ink";
type DraftState = "clean" | "saved" | "retrying" | "sent" | "storage-error";
type FieldName = keyof ActivityDraftFields;
const draftChangedEvent = "rhino:borrador-actividad-cambio";
const emptyServerSnapshot = () => null;

function SelectField({ id, name, label, required, children, value, onChange, disabled, hint }: { id: string; name: FieldName; label: string; required?: boolean; children: React.ReactNode; value: string; onChange: React.ChangeEventHandler<HTMLSelectElement>; disabled?: boolean; hint?: string }) {
  return <div className="flex flex-col gap-2"><label className="text-sm font-bold" htmlFor={id}>{label}{required && <span aria-label="obligatorio" className="ml-1 text-red">*</span>}</label><select className={`${controlClass} ${disabled ? "cursor-not-allowed bg-panel-secondary text-ink-muted" : ""}`} disabled={disabled} id={id} name={name} onChange={onChange} required={required} value={value}>{children}</select>{hint && <p className="text-xs text-ink-muted">{hint}</p>}</div>;
}

function TextAreaField({ id, name, label, placeholder, value, onChange }: { id: string; name: FieldName; label: string; placeholder: string; value: string; onChange: React.ChangeEventHandler<HTMLTextAreaElement> }) {
  return <div className="flex flex-col gap-2"><label className="text-sm font-bold" htmlFor={id}>{label}</label><textarea className={`${controlClass} min-h-24 resize-y`} id={id} maxLength={500} name={name} onChange={onChange} placeholder={placeholder} value={value} /></div>;
}

function initialFields(type: ActivityType, editing: boolean): ActivityDraftFields {
  return {
    date: editing ? "2026-08-17T08:30" : "",
    type,
    title: editing ? "Cobertura de mantenimiento en peaje Chillón" : "",
    responsible: "",
    status: "",
    progress: "0%",
    placeName: editing ? "peaje Chillón" : "",
    placeReference: editing ? "caseta norte" : "",
    placeKm: editing ? "25.4" : "",
    placeDirection: editing ? "Norte → Sur" : "",
    placeLatitude: "",
    placeLongitude: "",
    description: "",
    deliveryDate: "",
    materialLink: "",
    notes: "",
  };
}

function fieldsFromActivity(activity: SimulatedActivity): ActivityDraftFields {
  return {
    date: activity.dateTime, type: activity.type, title: activity.title,
    responsible: activity.responsible, status: activity.status,
    progress: `${activity.progress ?? 0}%`,
    placeName: activity.place === "Sin ubicación" ? "" : activity.place,
    placeReference: activity.placeReference, placeKm: activity.placeKm,
    placeDirection: activity.placeDirection, placeLatitude: "", placeLongitude: "",
    description: activity.description, deliveryDate: activity.deliveryDate,
    materialLink: activity.materialLink, notes: "",
  };
}

export function ActivityForm({ editing = false, role, activityId }: { editing?: boolean; role: Role; activityId?: string }) {
  // D-045: un rol de trabajo solo registra actividades de su propio tipo.
  const fixedType = (role.activityType ?? "Grabación") as ActivityType;
  const storageKey = activityDraftStorageKey(role.id, editing ? activityId : undefined);
  const activities = useSimulatedActivities();
  const accounts = useAccounts();
  const eligibleAccounts = accounts.filter((account) => account.active && account.roleIds.includes(role.id));
  const existingActivity = editing ? activities.find((item) => item.id === activityId) : undefined;
  const fallbackFields = useMemo(() => existingActivity ? fieldsFromActivity(existingActivity) : initialFields(fixedType, editing), [editing, existingActivity, fixedType]);
  const subscribeToDraft = useCallback((notify: () => void) => {
    const onStorage = (event: StorageEvent) => { if (event.key === storageKey) notify(); };
    window.addEventListener("storage", onStorage);
    window.addEventListener(draftChangedEvent, notify);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(draftChangedEvent, notify);
    };
  }, [storageKey]);
  const getDraftSnapshot = useCallback(() => window.localStorage.getItem(storageKey), [storageKey]);
  const rawDraft = useSyncExternalStore(subscribeToDraft, getDraftSnapshot, emptyServerSnapshot);
  const storedDraft = parseActivityDraft(rawDraft);
  const [editedFields, setEditedFields] = useState<ActivityDraftFields | null>(null);
  const fields = editedFields ?? (storedDraft ? { ...storedDraft.fields, type: fixedType } : fallbackFields);
  const [draftState, setDraftState] = useState<DraftState>("clean");
  const idempotencyKey = useRef("");
  const sendTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [savedActivityId, setSavedActivityId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    return () => {
      if (sendTimer.current) clearTimeout(sendTimer.current);
    };
  }, []);

  if (editing && !existingActivity) return <Card className="p-6 text-center"><h2 className="font-bold">Actividad no encontrada</h2><p className="mt-2 text-sm text-ink-muted">No existe una actividad editable con este identificador.</p><Link className="mt-4 inline-block text-sm font-bold text-blue underline" href="/actividades">Volver a actividades</Link></Card>;
  if (editing && existingActivity && existingActivity.type !== role.activityType) return <Card className="border-red bg-red/5 p-6 text-center"><h2 className="font-bold text-red">No puedes editar esta actividad</h2><p className="mt-2 text-sm text-ink-muted">Tu rol solo modifica actividades de tipo {role.activityType}.</p><Link className="mt-4 inline-block text-sm font-bold text-blue underline" href="/actividades">Volver a actividades</Link></Card>;

  function persist(nextFields: ActivityDraftFields) {
    try {
      if (!idempotencyKey.current) idempotencyKey.current = storedDraft?.idempotencyKey ?? createIdempotencyKey();
      writeActivityDraft(window.localStorage, storageKey, {
        version: 1,
        idempotencyKey: idempotencyKey.current,
        savedAt: new Date().toISOString(),
        fields: nextFields,
      });
      window.dispatchEvent(new Event(draftChangedEvent));
      setDraftState("saved");
    } catch {
      setDraftState("storage-error");
    }
  }

  function changeField(event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const name = event.target.name as FieldName;
    const nextFields = { ...fields, [name]: event.target.value };
    setEditedFields(nextFields);
    persist(nextFields);
  }

  function sendToSimulatedServer() {
    if (sendTimer.current) clearTimeout(sendTimer.current);
    setDraftState("retrying");
    sendTimer.current = setTimeout(() => {
      try {
        const activity = upsertActivity(window.localStorage, fields, role, editing ? activityId : undefined);
        window.localStorage.removeItem(storageKey);
        window.dispatchEvent(new Event(draftChangedEvent));
        idempotencyKey.current = "";
        setSavedActivityId(activity.id);
        setDraftState("sent");
      } catch {
        setDraftState("storage-error");
      }
    }, 900);
  }

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (fields.materialLink && !safeMaterialUrl(fields.materialLink)) {
      setValidationError("Usa un enlace HTTPS válido de OneDrive o SharePoint.");
      return;
    }
    setValidationError("");
    persist(fields);
    sendToSimulatedServer();
  }

  return (
    <form className="space-y-4" onSubmit={submitForm} ref={formRef}>
      {(storedDraft || draftState === "saved" || draftState === "retrying") && draftState !== "sent" && draftState !== "storage-error" && <DraftNotice onRetry={() => formRef.current?.requestSubmit()} retrying={draftState === "retrying"} />}
      {draftState === "sent" && <p aria-live="polite" className="rounded-[5px] border border-green bg-green/10 p-3 text-sm font-bold">Actividad guardada en la simulación. El borrador local fue eliminado.{savedActivityId && <> <Link className="text-blue underline" href={`/actividades/${savedActivityId}`}>Ver actividad</Link>.</>}</p>}
      {draftState === "storage-error" && <p aria-live="assertive" className="rounded-[5px] border border-red bg-red/5 p-3 text-sm font-bold text-red">Este navegador no permitió guardar el borrador local. No cierres esta pantalla hasta enviar la actividad.</p>}
      {validationError && <p aria-live="assertive" className="rounded-[5px] border border-red bg-red/5 p-3 text-sm font-bold text-red">{validationError}</p>}

      <Card className="space-y-4 p-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
        <div className="lg:col-span-2"><p className="text-xs font-bold uppercase tracking-[0.14em] text-blue">Obligatorios</p><p className="mt-1 text-xs text-ink-muted">Completa primero lo necesario para programar el trabajo.</p></div>
        <FormField id="activity-date" label="Fecha" name="date" onChange={changeField} required type="datetime-local" value={fields.date} />
        <SelectField disabled hint={`Tu rol registra actividades de tipo ${fixedType}.`} id="activity-type" label="Tipo" name="type" onChange={changeField} required value={fields.type}>{activityTypes.map((item) => <option key={item}>{item}</option>)}</SelectField>
        <div className="lg:col-span-2"><FormField id="activity-title" label="Título" name="title" onChange={changeField} placeholder="Escribe el título de la actividad" required value={fields.title} /></div>
        <SelectField hint="Las personas se asignan en Cuentas; aquí solo se elige entre quienes tienen este rol." id="activity-responsible" label="Responsable" name="responsible" onChange={changeField} required value={fields.responsible}><option value="">Selecciona una persona</option>{eligibleAccounts.map((account) => <option key={account.id}>{account.name}</option>)}<option>Sin asignar</option>{fields.responsible && !eligibleAccounts.some((account) => account.name === fields.responsible) && fields.responsible !== "Sin asignar" && <option>{fields.responsible}</option>}</SelectField>
        <SelectField id="activity-status" label="Estado inicial" name="status" onChange={changeField} required value={fields.status}><option value="">Selecciona un estado</option><option>Programada</option><option>En proceso</option></SelectField>
        {showsProgress(fields.type) && <SelectField id="activity-progress" label="Avance" name="progress" onChange={changeField} required value={fields.progress}><option>0%</option><option>25%</option><option>50%</option><option>55%</option><option>75%</option><option>100%</option></SelectField>}
      </Card>

      <Card className="space-y-3 p-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
        <div className="lg:col-span-2"><p className="text-xs font-bold uppercase tracking-[0.14em] text-blue">Ubicación</p><p className="mt-1 text-xs text-ink-muted">El nombre del lugar basta; añade precisión solo si hace falta.</p></div>
        <FormField id="place-name" label="Nombre del lugar" name="placeName" onChange={changeField} placeholder="Ej. peaje Chillón" required={requiresLocation(fields.type)} value={fields.placeName} />
        <details className="rounded-[5px] border border-line bg-panel-secondary p-3 lg:col-span-2">
          <summary className="cursor-pointer text-sm font-bold">Más datos de ubicación</summary>
          <div className="mt-4 space-y-4"><FormField id="place-reference" label="Referencia" name="placeReference" onChange={changeField} value={fields.placeReference} /><div className="grid grid-cols-2 gap-3"><FormField id="place-km" label="Kilómetro" name="placeKm" onChange={changeField} value={fields.placeKm} /><FormField id="place-direction" label="Sentido" name="placeDirection" onChange={changeField} value={fields.placeDirection} /></div><div className="grid grid-cols-2 gap-3"><FormField id="place-latitude" inputMode="decimal" label="Latitud" name="placeLatitude" onChange={changeField} value={fields.placeLatitude} /><FormField id="place-longitude" inputMode="decimal" label="Longitud" name="placeLongitude" onChange={changeField} value={fields.placeLongitude} /></div></div>
        </details>
      </Card>

      <Card className="space-y-4 p-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue lg:col-span-2">Detalles y entrega</p>
        <div className="lg:col-span-2"><TextAreaField id="activity-description" label="Descripción" name="description" onChange={changeField} placeholder="Describe la actividad" value={fields.description} /></div>
        <FormField id="delivery-date" label="Entrega prevista" name="deliveryDate" onChange={changeField} type="datetime-local" value={fields.deliveryDate} />
        <FormField id="material-link" label="Enlace al material" name="materialLink" onChange={changeField} placeholder="https://onedrive.live.com/..." type="url" value={fields.materialLink} />
        <p className="-mt-2 text-xs text-ink-muted lg:col-start-2 lg:mt-[-0.5rem]">Enlace a la carpeta del material.</p>
        <div className="lg:col-span-2"><TextAreaField id="activity-notes" label="Notas" name="notes" onChange={changeField} placeholder="Notas internas para el equipo" value={fields.notes} /></div>
      </Card>

      <Button className="w-full lg:ml-auto lg:w-64" disabled={draftState === "retrying"} type="submit">{draftState === "retrying" ? "Enviando…" : editing ? "Guardar cambios" : "Guardar actividad"}</Button>
    </form>
  );
}
