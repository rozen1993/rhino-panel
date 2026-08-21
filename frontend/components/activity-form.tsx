"use client";

import Link from "next/link";
import { type ChangeEvent, type FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { activityTypes, type DateSpan } from "@/lib/activities";
import { createIdempotencyKey, type ActivityDraftFields } from "@/lib/activity-draft";
import {
  actorFromRole,
  createBursonActivity,
  createOwnActivity,
  editActivity,
  useSimulatedActivities,
} from "@/lib/activity-simulation";
import { safeMaterialUrl } from "@/lib/external-link";
import type { Role } from "@/lib/roles";

const control = "min-h-10 w-full rounded-md border border-line bg-panel px-3 py-2 text-xs text-ink outline-none transition placeholder:text-ink-muted/75 focus:border-cyan focus:ring-2 focus:ring-cyan/15";
const empty: ActivityDraftFields = {
  type: "Grabación",
  title: "",
  description: "",
  placeName: "",
  spans: [{ start: "", end: "" }],
  materialLink: "",
  notes: "",
  referenceLink: "",
};

type Props = { editing?: boolean; role: Role; activityId?: string; compact?: boolean };

export function ActivityForm({ editing = false, role, activityId, compact = false }: Props) {
  const activities = useSimulatedActivities();
  const existing = editing ? activities.find((item) => item.id === activityId && !item.deletedAt) : undefined;
  const initial = useMemo<ActivityDraftFields>(() => existing ? {
    type: existing.type,
    title: existing.title,
    description: existing.description,
    placeName: existing.place,
    spans: existing.spans,
    materialLink: existing.materialLink,
    notes: existing.operatorOpinion,
    referenceLink: existing.referenceLink,
  } : empty, [existing]);
  const [fields, setFields] = useState(initial);
  const [notice, setNotice] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const actor = actorFromRole(role);
  const locked = Boolean(existing?.threadOpenedAt && role.id === "operario");
  const padding = compact ? "p-3" : "p-4 md:p-5";

  function change(event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setFields((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function changeSpan(index: number, field: keyof DateSpan, value: string) {
    setFields((current) => ({
      ...current,
      spans: current.spans.map((span, spanIndex) => spanIndex === index ? { ...span, [field]: value } : span),
    }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (fields.materialLink && !safeMaterialUrl(fields.materialLink)) {
      setNotice("Usa un enlace HTTPS válido de OneDrive o SharePoint.");
      return;
    }
    const result = editing && existing
      ? editActivity(window.localStorage, existing.id, fields, actor, existing.version)
      : role.id === "burson"
        ? createBursonActivity(window.localStorage, window.localStorage, fields, role)
        : createOwnActivity(window.localStorage, fields, role, createIdempotencyKey());
    setNotice(result.ok
      ? role.id === "burson" ? "Encargo creado y asignado." : editing ? "Actividad actualizada." : "Actividad registrada."
      : result.error);
    if (result.ok) setSavedId(result.activity.id);
  }

  if (editing && !existing) return <Card className="p-5">Actividad no encontrada.</Card>;
  if (role.id === "admin") return <Card className="p-5">Admin consulta y comenta, pero no crea actividades.</Card>;

  return <form className="space-y-3" onSubmit={submit}>
    {notice && <p aria-live="polite" className="rounded-md border border-cyan/40 bg-cyan/10 p-3 text-xs font-bold">
      {notice}{savedId && <> <Link className="text-[#08718a] underline" href={`/actividades/${savedId}`}>Ver actividad</Link>.</>}
    </p>}
    <Card className={`overflow-hidden shadow-[var(--shadow-2)] ${compact ? "" : "mx-auto max-w-4xl"}`}>
      <header className={`border-b border-line ${padding}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="data-label text-cyan-ink">{role.id === "burson" ? "Canal Burson" : "Producción audiovisual"}</p>
            <h2 className={`section-title mt-1 ${compact ? "text-lg" : "text-xl"}`}>{role.id === "burson" ? "Nuevo encargo" : editing ? "Editar actividad" : "Registrar actividad"}</h2>
          </div>
          <span className="hidden rounded-full border border-cyan/30 bg-cyan/10 px-2.5 py-1 text-[0.625rem] font-extrabold text-[#08718a] sm:inline-flex">BORRADOR</span>
        </div>
        {!compact && <p className="mt-3 text-xs leading-5 text-ink-muted">{role.id === "burson" ? "Se asignará automáticamente al operario vinculado." : "Registra el encargo recibido y sus jornadas de trabajo."}</p>}
      </header>

      <div className={`grid gap-2.5 ${padding} ${compact ? "sm:grid-cols-2 xl:grid-cols-2" : "md:grid-cols-2"}`}>
        <label className="text-xs font-bold">Actividad o proyecto
          <input className={`${control} mt-1.5`} disabled={locked} name="title" onChange={change} placeholder="Ej. Cobertura institucional" required value={fields.title} />
        </label>
        <label className="text-xs font-bold">Tipo de servicio
          <select className={`${control} mt-1.5`} disabled={locked} name="type" onChange={change} value={fields.type}>{activityTypes.map((type) => <option key={type}>{type}</option>)}</select>
        </label>
        <label className="text-xs font-bold sm:col-span-2">Lugar o referencia
          <input className={`${control} mt-1.5`} disabled={locked} name="placeName" onChange={change} placeholder="Ciudad, sede o referencia" value={fields.placeName} />
        </label>
        <label className="text-xs font-bold sm:col-span-2">Descripción
          <textarea className={`${control} mt-1.5 resize-y ${compact ? "min-h-14" : "min-h-20"}`} disabled={locked} name="description" onChange={change} placeholder="Describe el objetivo y alcance" required value={fields.description} />
        </label>
        {role.id === "burson" && <label className="text-xs font-bold sm:col-span-2">Enlace de referencia opcional
          <input className={`${control} mt-1.5`} name="referenceLink" onChange={change} placeholder="https://..." type="url" value={fields.referenceLink} />
        </label>}
      </div>

      <section className={`border-t border-line bg-panel-secondary/65 ${padding}`}>
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="text-xs font-extrabold">Fechas de la actividad</h3>
            {!compact && <p className="mt-1 text-[0.6875rem] text-ink-muted">Añade periodos para jornadas separadas.</p>}
          </div>
          <button className="text-xs font-bold text-[#08718a] underline decoration-cyan underline-offset-4 disabled:opacity-40" disabled={locked} onClick={() => setFields((current) => ({ ...current, spans: [...current.spans, { start: "", end: "" }] }))} type="button">＋ Añadir jornada</button>
        </div>
        <div className="mt-2 space-y-2">{fields.spans.map((span, index) => <div className="grid grid-cols-[1fr_1fr_auto] gap-2" key={index}>
          <label className="data-label text-ink-muted">Inicio
            <input className={`${control} mt-1 px-2`} disabled={locked} onChange={(event) => changeSpan(index, "start", event.target.value)} required type="date" value={span.start} />
          </label>
          <label className="data-label text-ink-muted">Fin
            <input className={`${control} mt-1 px-2`} disabled={locked} min={span.start} onChange={(event) => changeSpan(index, "end", event.target.value)} required type="date" value={span.end} />
          </label>
          <button aria-label="Eliminar periodo" className="mt-5 grid size-10 place-items-center rounded-md text-lg font-bold text-red transition hover:bg-red/5 disabled:opacity-30" disabled={locked || fields.spans.length === 1} onClick={() => setFields((current) => ({ ...current, spans: current.spans.filter((_, itemIndex) => itemIndex !== index) }))} type="button">×</button>
        </div>)}</div>
      </section>

      {role.id === "operario" && <section className={`grid gap-2.5 border-t border-line ${padding} ${compact ? "" : "md:grid-cols-2"}`}>
        <div className={compact ? "" : "md:col-span-2"}>
          <div className="flex items-center justify-between gap-2"><h3 className="text-xs font-extrabold">Entrega digital</h3><span className="data-label text-ink-muted">Opcional ahora</span></div>
          {!compact && <p className="mt-1 text-[0.6875rem] text-ink-muted">El enlace será obligatorio al marcar la actividad como entregada.</p>}
        </div>
        <label className="text-xs font-bold">Enlace de OneDrive
          <input className={`${control} mt-1.5`} disabled={locked} name="materialLink" onChange={change} placeholder="https://onedrive.live.com/..." type="url" value={fields.materialLink} />
        </label>
        <label className="text-xs font-bold">Opinión opcional
          <textarea className={`${control} mt-1.5 resize-y ${compact ? "min-h-12" : "min-h-16"}`} disabled={locked} name="notes" onChange={change} placeholder="Comentarios sobre la entrega" value={fields.notes} />
        </label>
      </section>}

      <footer className={`border-t border-line ${padding}`}>
        {locked
          ? <p className="rounded-md border border-orange/40 bg-orange/10 p-3 text-xs font-bold">La entrega está bloqueada porque Admin inició la conversación.</p>
          : <Button className="w-full" type="submit">{editing ? "Guardar cambios" : role.id === "burson" ? "Crear encargo" : "Guardar actividad"}</Button>}
      </footer>
    </Card>
  </form>;
}
