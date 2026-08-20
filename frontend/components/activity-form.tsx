"use client";

import Link from "next/link";
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { FormField } from "@/components/form-field";
import {
  activityTypes,
  requiresLocation,
  showsProgress,
  type ActivityType,
} from "@/lib/activities";
import {
  activityDraftStorageKey,
  createIdempotencyKey,
  parseActivityDraft,
  type ActivityDraftFields,
  writeActivityDraft,
} from "@/lib/activity-draft";
import {
  actorFromRole,
  updateDelivery,
  upsertActivity,
  useSimulatedActivities,
} from "@/lib/activity-simulation";
import { useAccounts } from "@/lib/account-store";
import { safeMaterialUrl } from "@/lib/external-link";
import type { Role, RoleId } from "@/lib/roles";

const control =
  "min-h-11 w-full rounded-[5px] border border-line bg-panel px-3 py-2 text-sm text-ink disabled:bg-panel-secondary disabled:text-ink-muted";
const roleIdForType: Record<ActivityType, RoleId> = {
  Grabación: "grabacion",
  Edición: "edicion",
  Creatividad: "creatividad",
  Locución: "locucion",
};
function emptyFields(type: ActivityType): ActivityDraftFields {
  return {
    date: "",
    type,
    title: "",
    responsible: "",
    responsibleAccountId: "",
    status: "Programada",
    progress: "0%",
    placeName: "",
    placeReference: "",
    placeKm: "",
    placeDirection: "",
    placeLatitude: "",
    placeLongitude: "",
    description: "",
    deliveryDate: "",
    materialLink: "",
    notes: "",
  };
}
function fromActivity(
  activity: ReturnType<typeof useSimulatedActivities>[number],
): ActivityDraftFields {
  return {
    date: activity.dateTime,
    type: activity.type,
    title: activity.title,
    responsible: activity.responsible,
    responsibleAccountId: activity.responsibleAccountId,
    status: activity.status,
    progress: `${activity.progress ?? 0}%`,
    placeName: activity.place === "Sin ubicación" ? "" : activity.place,
    placeReference: activity.placeReference,
    placeKm: activity.placeKm,
    placeDirection: activity.placeDirection,
    placeLatitude: "",
    placeLongitude: "",
    description: activity.description,
    deliveryDate: activity.deliveryDate,
    materialLink: activity.materialLink,
    notes: activity.deliveryMessage,
  };
}

export function ActivityForm({
  editing = false,
  role,
  activityId,
}: {
  editing?: boolean;
  role: Role;
  activityId?: string;
}) {
  const activities = useSimulatedActivities();
  const accounts = useAccounts();
  const existing = editing
    ? activities.find((item) => item.id === activityId && !item.deletedAt)
    : undefined;
  const initialType = (role.activityType ?? "Grabación") as ActivityType;
  const initial = useMemo(
    () => (existing ? fromActivity(existing) : emptyFields(initialType)),
    [existing, initialType],
  );
  const [fields, setFields] = useState(initial);
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const draftKey = activityDraftStorageKey(
    role.id,
    editing ? activityId : undefined,
  );
  const eligible = accounts.filter(
    (account) =>
      account.active && account.roleIds.includes(roleIdForType[fields.type]),
  );
  const allowed =
    role.createsOrders ||
    Boolean(existing && existing.responsibleAccountId === role.accountId);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const draft = parseActivityDraft(window.localStorage.getItem(draftKey));
      setFields(
        draft
          ? {
              ...draft.fields,
              responsibleAccountId: draft.fields.responsibleAccountId ?? "",
            }
          : initial,
      );
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [draftKey, initial]);
  function change(
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    const name = event.target.name as keyof ActivityDraftFields;
    const next = { ...fields, [name]: event.target.value };
    if (name === "responsibleAccountId")
      next.responsible =
        eligible.find((account) => account.id === event.target.value)?.name ??
        "";
    setFields(next);
    const previous = parseActivityDraft(window.localStorage.getItem(draftKey));
    writeActivityDraft(window.localStorage, draftKey, {
      version: 1,
      idempotencyKey: previous?.idempotencyKey ?? createIdempotencyKey(),
      savedAt: new Date().toISOString(),
      fields: next,
    });
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (fields.materialLink && !safeMaterialUrl(fields.materialLink)) {
      setNotice("Usa un enlace HTTPS válido de OneDrive o SharePoint.");
      return;
    }
    try {
      const draft = parseActivityDraft(window.localStorage.getItem(draftKey));
      const activity = role.createsOrders
        ? upsertActivity(
            window.localStorage,
            fields,
            role,
            editing ? activityId : undefined,
            draft?.idempotencyKey ?? createIdempotencyKey(),
          )
        : (() => {
            if (!existing) throw new Error("La actividad no existe.");
            const result = updateDelivery(
              window.localStorage,
              existing.id,
              fields,
              actorFromRole(role),
              existing.version,
            );
            if (!result.ok) throw new Error(result.error);
            return result.activity;
          })();
      window.localStorage.removeItem(draftKey);
      setSavedId(activity.id);
      setNotice(
        role.createsOrders ? "Orden guardada." : "Entrega actualizada.",
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo guardar.");
    }
  }
  if (!loaded) return <Card className="p-5">Cargando formulario…</Card>;
  if (!allowed || (editing && !existing))
    return (
      <Card className="border-red bg-red/5 p-6">
        <h2 className="font-bold text-red">No puedes editar esta actividad</h2>
        <Link
          className="mt-3 inline-block text-sm font-bold text-blue underline"
          href="/actividades"
        >
          Volver
        </Link>
      </Card>
    );
  const admin = role.createsOrders;
  return (
    <form className="space-y-4" onSubmit={submit}>
      {notice && (
        <p
          aria-live="polite"
          className="rounded-[5px] border border-blue bg-blue/10 p-3 text-sm font-bold"
        >
          {notice}
          {savedId && (
            <>
              {" "}
              <Link
                className="text-blue underline"
                href={`/actividades/${savedId}`}
              >
                Ver actividad
              </Link>
              .
            </>
          )}
        </p>
      )}
      <Card className="grid gap-4 p-4 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <h2 className="font-bold">Orden de trabajo</h2>
          <p className="text-xs text-ink-muted">
            Coordinación define y asigna estos datos.
          </p>
        </div>
        <FormField
          disabled={!admin}
          id="activity-date"
          label="Fecha"
          name="date"
          onChange={change}
          required
          type="datetime-local"
          value={fields.date}
        />
        <label
          className="flex flex-col gap-2 text-sm font-bold"
          htmlFor="activity-type"
        >
          Tipo
          <select
            className={control}
            disabled={!admin}
            id="activity-type"
            name="type"
            onChange={change}
            value={fields.type}
          >
            {activityTypes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <div className="lg:col-span-2">
          <FormField
            disabled={!admin}
            id="activity-title"
            label="Título"
            name="title"
            onChange={change}
            required
            value={fields.title}
          />
        </div>
        <label
          className="flex flex-col gap-2 text-sm font-bold"
          htmlFor="activity-responsible"
        >
          Responsable
          <select
            className={control}
            disabled={!admin}
            id="activity-responsible"
            name="responsibleAccountId"
            onChange={change}
            required
            value={fields.responsibleAccountId}
          >
            <option value="">Selecciona una cuenta</option>
            {eligible.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>
        <FormField
          disabled={!admin}
          id="delivery-date"
          label="Entrega prevista"
          name="deliveryDate"
          onChange={change}
          type="datetime-local"
          value={fields.deliveryDate}
        />
        <div className="lg:col-span-2">
          <label
            className="flex flex-col gap-2 text-sm font-bold"
            htmlFor="activity-description"
          >
            Descripción
            <textarea
              className={`${control} min-h-24`}
              disabled={!admin}
              id="activity-description"
              maxLength={500}
              name="description"
              onChange={change}
              value={fields.description}
            />
          </label>
        </div>
        <FormField
          disabled={!admin}
          id="place-name"
          label="Lugar"
          name="placeName"
          onChange={change}
          required={requiresLocation(fields.type)}
          value={fields.placeName}
        />
      </Card>
      <Card className="grid gap-4 p-4 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <h2 className="font-bold">Reporte del responsable</h2>
          <p className="text-xs text-ink-muted">
            Puede cambiarse hasta que Supervisión tome una decisión.
          </p>
        </div>
        {showsProgress(fields.type) && (
          <label
            className="flex flex-col gap-2 text-sm font-bold"
            htmlFor="activity-progress"
          >
            Avance
            <select
              className={control}
              disabled={admin}
              id="activity-progress"
              name="progress"
              onChange={change}
              value={fields.progress}
            >
              {[0, 25, 50, 75, 100].map((value) => (
                <option key={value}>{value}%</option>
              ))}
            </select>
          </label>
        )}
        <FormField
          disabled={admin}
          id="material-link"
          label="Enlace de OneDrive"
          name="materialLink"
          onChange={change}
          placeholder="https://onedrive.live.com/..."
          type="url"
          value={fields.materialLink}
        />
        <div className="lg:col-span-2">
          <label
            className="flex flex-col gap-2 text-sm font-bold"
            htmlFor="activity-notes"
          >
            Mensaje privado opcional
            <textarea
              className={`${control} min-h-24`}
            disabled={admin}
              id="activity-notes"
              maxLength={500}
              name="notes"
              onChange={change}
              value={fields.notes}
            />
            <span className="text-xs font-normal text-ink-muted">
              Visible solo para Coordinación y Supervisión.
            </span>
          </label>
        </div>
      </Card>
      <Button className="w-full lg:ml-auto lg:w-64" type="submit">
        {admin
          ? editing
            ? "Guardar cambios"
            : "Crear y asignar orden"
          : "Guardar reporte"}
      </Button>
    </form>
  );
}
