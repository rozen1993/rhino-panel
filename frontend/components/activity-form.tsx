"use client";
import { ActivityJourneys } from "@/components/activity-journeys";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  createOwnSupabaseActivityAction,
  planSupabaseActivityAction,
  replanSupabaseActivityAction,
  updateSupabaseExecutionAction,
  type ActivityServerResult,
} from "@/app/actividades/actions";
import {
  createSupabaseBursonRequestAction,
  type BursonRequestServerResult,
} from "@/app/burson/actions";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import type { AssignableOperator } from "@/lib/accounts";
import { useAccounts } from "@/lib/account-store";
import { activityTypes, type DateSpan } from "@/lib/activities";
import {
  activityDraftStorageKey,
  createIdempotencyKey,
  readActivityDraft,
  writeActivityDraft,
  type ActivityDraftFields,
} from "@/lib/activity-draft";
import {
  actorFromRole,
  canEditActivity,
  createBursonActivity,
  createOwnActivity,
  planActivity,
  replanActivity,
  updateExecutionActivity,
  useSimulatedActivities,
  type SimulatedActivity,
} from "@/lib/activity-simulation";
import type { DataSource } from "@/lib/data-source";
import { activityHistoryFloor } from "@/lib/activity-validation";
import { safeMaterialUrl } from "@/lib/external-link";
import type { Role } from "@/lib/roles";

const control =
  "min-h-10 w-full rounded-md border border-line bg-panel px-3 py-2 text-xs text-ink outline-none transition placeholder:text-ink-muted focus:border-cyan focus:ring-2 focus:ring-cyan/15 disabled:cursor-not-allowed disabled:bg-panel-secondary disabled:text-ink-muted";
const noOperators: AssignableOperator[] = [];

const empty: ActivityDraftFields = {
  type: "Grabación",
  title: "",
  description: "",
  placeName: "",
  responsibleAccountId: "",
  spans: [{ start: "", end: "" }],
  materialLink: "",
  notes: "",
  referenceLink: "",
};

function hasDraftContent(fields: ActivityDraftFields) {
  return Boolean(
    fields.title ||
      fields.description ||
      fields.placeName ||
      fields.materialLink ||
      fields.notes ||
      fields.referenceLink ||
      fields.spans.some((span) => span.start || span.end),
  );
}

type Props = {
  editing?: boolean;
  role: Role;
  activityId?: string;
  dataSource?: DataSource;
  initialActivity?: SimulatedActivity | null;
  operators?: AssignableOperator[];
};

export function ActivityForm({
  editing = false,
  role,
  activityId,
  dataSource = "demo",
  initialActivity,
  operators = noOperators,
}: Props) {
  const activities = useSimulatedActivities(dataSource === "demo");
  const demoAccounts = useAccounts();
  const assignableOperators = useMemo<AssignableOperator[]>(
    () =>
      dataSource === "supabase"
        ? operators
        : demoAccounts
            .filter((account) => account.active && account.roleId === "operario")
            .map((account) => ({
              id: account.id,
              name: account.name,
              bursonLinked: account.bursonLinked,
            })),
    [dataSource, demoAccounts, operators],
  );
  const candidate = editing
    ? dataSource === "supabase"
      ? initialActivity ?? undefined
      : activities.find((item) => item.id === activityId && !item.deletedAt)
    : undefined;
  const existing =
    candidate && canEditActivity(candidate, role) ? candidate : undefined;
  const executionMode = editing && role.id === "operario";
  const planningMode = !executionMode;
  const defaultResponsible =
    role.id === "admin"
      ? assignableOperators[0]?.id ?? ""
      : role.id === "operario"
        ? role.accountId ?? ""
        : "";
  const initial = useMemo<ActivityDraftFields>(
    () =>
      existing
        ? {
            type: existing.type,
            title: existing.title,
            description: existing.description,
            placeName: existing.place,
            responsibleAccountId: existing.responsibleAccountId,
            spans: existing.spans,
            materialLink: existing.materialLink,
            notes: existing.operatorOpinion,
            referenceLink: existing.referenceLink,
          }
        : { ...empty, responsibleAccountId: defaultResponsible },
    [defaultResponsible, existing],
  );
  const [fields, setFields] = useState<ActivityDraftFields>(initial);
  const [notice, setNotice] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const actor = actorFromRole(role);
  const deliveryLocked = Boolean(existing?.threadOpenedAt && executionMode);
  const loadedActivityId = useRef<string | null>(null);
  const expectedVersion = useRef<number | null>(null);
  const idempotencyKey = useRef(createIdempotencyKey());
  const draftReady = useRef(false);
  const savesDraft = !editing;
  const draftKey = activityDraftStorageKey(
    role.id,
    role.accountId ?? "sin-cuenta",
    activityId,
    dataSource,
  );

  useEffect(() => {
    if (!editing || !existing || loadedActivityId.current === existing.id)
      return;
    setFields(initial);
    expectedVersion.current = existing.version;
    loadedActivityId.current = existing.id;
  }, [editing, existing, initial]);

  useEffect(() => {
    if (!savesDraft) return;
    const saved = readActivityDraft(window.localStorage, draftKey);
    const timer = window.setTimeout(() => {
      if (saved && hasDraftContent(saved.fields)) {
        setFields(saved.fields);
        idempotencyKey.current = saved.idempotencyKey;
      }
      draftReady.current = true;
    }, 0);
    return () => window.clearTimeout(timer);
  }, [draftKey, savesDraft]);

  useEffect(() => {
    if (!savesDraft || !draftReady.current || savedId) return;
    if (!hasDraftContent(fields)) {
      window.localStorage.removeItem(draftKey);
      return;
    }
    const timer = window.setTimeout(
      () =>
        writeActivityDraft(window.localStorage, draftKey, {
          version: 5,
          idempotencyKey: idempotencyKey.current,
          savedAt: new Date().toISOString(),
          fields,
        }),
      200,
    );
    return () => window.clearTimeout(timer);
  }, [draftKey, fields, savedId, savesDraft]);

  function change(
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    setFields((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  function changeSpan(index: number, field: keyof DateSpan, value: string) {
    setFields((current) => ({
      ...current,
      spans: current.spans.map((span, spanIndex) =>
        spanIndex === index ? { ...span, [field]: value } : span,
      ),
    }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const submittedFields =
      planningMode &&
      role.id === "admin" &&
      !fields.responsibleAccountId &&
      defaultResponsible
        ? { ...fields, responsibleAccountId: defaultResponsible }
        : fields;
    if (
      executionMode &&
      submittedFields.materialLink &&
      !safeMaterialUrl(submittedFields.materialLink)
    ) {
      setNotice("Usa un enlace HTTPS válido sin credenciales incrustadas.");
      return;
    }

    if (dataSource === "supabase") {
      startTransition(async () => {
        const result =
          editing && existing
            ? role.id === "admin"
              ? await replanSupabaseActivityAction(
                  existing.id,
                  expectedVersion.current ?? existing.version,
                  submittedFields,
                )
              : await updateSupabaseExecutionAction(
                  existing.id,
                  expectedVersion.current ?? existing.version,
                  submittedFields,
                )
            : role.id === "admin"
              ? await planSupabaseActivityAction(
                  submittedFields,
                  idempotencyKey.current,
                )
              : role.id === "burson"
                ? await createSupabaseBursonRequestAction(
                    submittedFields,
                    idempotencyKey.current,
                  )
                : await createOwnSupabaseActivityAction(
                    submittedFields,
                    idempotencyKey.current,
                  );
        handleResult(result);
      });
      return;
    }

    const result =
      editing && existing
        ? role.id === "admin"
          ? replanActivity(
              window.localStorage,
              window.localStorage,
              existing.id,
              submittedFields,
              actor,
              expectedVersion.current ?? existing.version,
            )
          : updateExecutionActivity(
              window.localStorage,
              existing.id,
              submittedFields,
              actor,
              expectedVersion.current ?? existing.version,
            )
        : role.id === "admin"
          ? planActivity(
              window.localStorage,
              window.localStorage,
              submittedFields,
              role,
              idempotencyKey.current,
            )
          : role.id === "burson"
            ? createBursonActivity(
                window.localStorage,
                window.localStorage,
                submittedFields,
                role,
                idempotencyKey.current,
              )
            : createOwnActivity(
                window.localStorage,
                submittedFields,
                role,
                idempotencyKey.current,
              );
    handleResult(result);
  }

  function handleResult(
    result: ActivityServerResult | BursonRequestServerResult,
  ) {
    setNotice(
      result.ok
        ? editing
          ? executionMode
            ? "Ejecución actualizada."
            : "Planificación actualizada."
          : result.replayed
            ? "La actividad ya había sido registrada."
            : role.id === "burson"
              ? "Encargo creado y asignado."
              : role.id === "admin"
                ? "Actividad planificada y asignada."
                : "Actividad propia creada."
        : result.error,
    );
    if (!result.ok) return;
    const savedItem = "activity" in result ? result.activity : result.request;
    setSavedId(savedItem.id);
    if ("activity" in result)
      expectedVersion.current = result.activity.version;
    if (savesDraft) {
      draftReady.current = false;
      window.localStorage.removeItem(draftKey);
    }
    router.refresh();
  }

  if (editing && !existing)
    return <Card className="p-5">Actividad no encontrada o sin acceso.</Card>;
  if (!editing && role.id === "operario" && !role.canCreateOwnActivities)
    return (
      <Card className="border-orange/35 bg-orange/[.06] p-5">
        Admin gestiona la planificación. Tu cuenta no tiene habilitada la
        creación de actividades propias.
      </Card>
    );
  if (planningMode && role.id === "admin" && !assignableOperators.length)
    return (
      <Card className="border-orange/35 bg-orange/[.06] p-5">
        No hay Operarios activos disponibles para asignar la actividad.
      </Card>
    );

  const heading = executionMode
    ? "Actualizar ejecución"
    : role.id === "burson"
      ? "Nuevo encargo"
      : editing
        ? "Editar planificación"
        : role.id === "admin"
          ? "Planificar actividad"
          : "Crear actividad propia";

  return (
    <form className="space-y-3" onSubmit={submit}>
      {notice && (
        <p
          aria-live="polite"
          className="rounded-md border border-cyan/40 bg-cyan/10 p-3 text-xs font-bold"
        >
          {notice}
          {savedId && !editing && (
            <>
              {" "}
              <Link
                className="text-[#08718a] underline"
                href={
                  role.id === "burson"
                    ? `/burson/${savedId}`
                    : `/actividades/${savedId}`
                }
              >
                {role.id === "burson" ? "Ver encargo" : "Ver actividad"}
              </Link>
              .
            </>
          )}
        </p>
      )}

      <Card className="mx-auto max-w-4xl overflow-hidden shadow-[var(--shadow-2)]">
        <header className="border-b border-line p-4 md:p-5">
          <p className="data-label text-cyan-ink">
            {executionMode
              ? "Campos del Operario responsable"
              : role.id === "burson"
                ? "Canal Burson"
                : "Planificación audiovisual"}
          </p>
          <h2 className="section-title mt-1 text-xl">{heading}</h2>
          <p className="mt-3 text-xs leading-5 text-ink-muted">
            {executionMode
              ? "La planificación permanece bajo control de Admin. Aquí solo cambias el enlace y tu opinión."
              : role.id === "burson"
                ? "El sistema lo asignará al Operario especial."
                : role.id === "admin"
                  ? "Define el trabajo, sus jornadas y la persona responsable."
                  : "Este permiso es individual; la actividad quedará asignada a tu cuenta."}
          </p>
        </header>

        {planningMode ? (
          <>
            <div className="grid gap-3 p-4 md:grid-cols-2 md:p-5">
              {role.id === "admin" && (
                <label className="text-xs font-bold md:col-span-2">
                  Operario responsable
                  <select
                    className={`${control} mt-1.5`}
                    name="responsibleAccountId"
                    onChange={change}
                    required
                    value={fields.responsibleAccountId || defaultResponsible}
                  >
                    {assignableOperators.map((operator) => (
                      <option key={operator.id} value={operator.id}>
                        {operator.name}
                        {operator.bursonLinked ? " · Operario especial" : ""}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="text-xs font-bold">
                Actividad o proyecto
                <input
                  className={`${control} mt-1.5`}
                  name="title"
                  onChange={change}
                  placeholder="Ej. Cobertura institucional"
                  required
                  value={fields.title}
                />
              </label>
              <label className="text-xs font-bold">
                Tipo de servicio
                <select
                  className={`${control} mt-1.5`}
                  name="type"
                  onChange={change}
                  value={fields.type}
                >
                  {activityTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-bold md:col-span-2">
                Lugar o referencia
                <input
                  className={`${control} mt-1.5`}
                  name="placeName"
                  onChange={change}
                  placeholder="Ciudad, sede o referencia"
                  value={fields.placeName}
                />
              </label>
              <label className="text-xs font-bold md:col-span-2">
                Descripción
                <textarea
                  className={`${control} mt-1.5 min-h-20 resize-y`}
                  name="description"
                  onChange={change}
                  placeholder="Describe el objetivo y alcance"
                  required
                  value={fields.description}
                />
              </label>
              {role.id === "burson" && (
                <label className="text-xs font-bold md:col-span-2">
                  Enlace de referencia opcional
                  <input
                    className={`${control} mt-1.5`}
                    name="referenceLink"
                    onChange={change}
                    placeholder="https://..."
                    type="url"
                    value={fields.referenceLink}
                  />
                </label>
              )}
            </div>

            <section className="border-t border-line bg-panel-secondary/65 p-4 md:p-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h3 className="text-xs font-extrabold">
                    Jornadas de la actividad
                  </h3>
                  <p className="mt-1 text-[0.6875rem] text-ink-muted">
                    Admite fechas continuas o periodos separados desde el 1 de
                    enero de 2026. Puedes repetir fechas si hay distintos lugares.
                  </p>
                </div>
                <button
                  className="text-xs font-bold text-[#08718a] underline decoration-cyan underline-offset-4"
                  onClick={() =>
                    setFields((current) => ({
                      ...current,
                      spans: [...current.spans, { start: "", end: "" }],
                    }))
                  }
                  type="button"
                >
                  ＋ Añadir jornada
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {fields.spans.map((span, index) => (
                  <div
                    className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 rounded-md border border-line p-2"
                    key={index}
                  >
                    <label className="data-label text-ink-muted">
                      Inicio
                      <input
                        className={`${control} mt-1 px-2`}
                        min={activityHistoryFloor}
                        onChange={(event) =>
                          changeSpan(index, "start", event.target.value)
                        }
                        required
                        type="date"
                        value={span.start}
                      />
                    </label>
                    <label className="data-label text-ink-muted">
                      Fin
                      <input
                        className={`${control} mt-1 px-2`}
                        min={span.start || activityHistoryFloor}
                        onChange={(event) =>
                          changeSpan(index, "end", event.target.value)
                        }
                        required
                        type="date"
                        value={span.end}
                      />
                    </label>
                    <button
                      aria-label="Eliminar periodo"
                      className="mt-5 grid size-10 place-items-center rounded-md text-lg font-bold text-red transition hover:bg-red/5 disabled:opacity-30"
                      disabled={fields.spans.length === 1}
                      onClick={() =>
                        setFields((current) => ({
                          ...current,
                          spans: current.spans.filter(
                            (_, itemIndex) => itemIndex !== index,
                          ),
                        }))
                      }
                      type="button"
                    >
                      ×
                    </button>
                    <label className="col-span-3 text-xs font-bold text-ink-muted">
                      Lugar de la jornada {index + 1} (opcional)
                      <input
                        className={`${control} mt-1`}
                        maxLength={300}
                        onChange={(event) => changeSpan(index, "place", event.target.value)}
                        placeholder={fields.placeName || "Usar el lugar general, si se indicó"}
                        value={span.place ?? ""}
                      />
                    </label>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <>
            <dl className="grid gap-3 border-b border-line bg-panel-secondary/65 p-4 text-xs sm:grid-cols-2 md:p-5">
              <div>
                <dt className="data-label text-ink-muted">Actividad</dt>
                <dd className="mt-1 font-extrabold">{existing?.title}</dd>
              </div>
              <div>
                <dt className="data-label text-ink-muted">Responsable</dt>
                <dd className="mt-1 font-extrabold">{existing?.responsible}</dd>
              </div>
            </dl>
            {existing && <section className="border-b border-line p-4 md:p-5"><h3 className="data-label mb-3 text-cyan-ink">Fechas y lugares planificados</h3><ActivityJourneys activity={existing} /></section>}
            <section className="grid gap-3 p-4 md:grid-cols-2 md:p-5">
              <label className="text-xs font-bold">
                Enlace del material
                <input
                  className={`${control} mt-1.5`}
                  disabled={deliveryLocked}
                  name="materialLink"
                  onChange={change}
                  placeholder="https://archivos.ejemplo.pe/..."
                  type="url"
                  value={fields.materialLink}
                />
              </label>
              <label className="text-xs font-bold">
                Opinión opcional
                <textarea
                  className={`${control} mt-1.5 min-h-16 resize-y`}
                  disabled={deliveryLocked}
                  name="notes"
                  onChange={change}
                  placeholder="Comentarios sobre la ejecución o entrega"
                  value={fields.notes}
                />
              </label>
            </section>
          </>
        )}

        <footer className="border-t border-line p-4 md:p-5">
          {deliveryLocked && (
            <p className="mb-3 rounded-md border border-orange/40 bg-orange/10 p-3 text-xs font-bold">
              Admin inició la conversación: el enlace y la opinión están
              bloqueados. Los cambios de estado siguen disponibles en la ficha.
            </p>
          )}
          <Button
            className="w-full"
            disabled={
              pending ||
              deliveryLocked ||
              Boolean(savedId && !editing)
            }
            type="submit"
          >
            {pending
              ? "Guardando…"
              : savedId && !editing
                ? "Actividad guardada"
                : editing
                  ? executionMode
                    ? "Guardar ejecución"
                    : "Guardar planificación"
                  : role.id === "burson"
                    ? "Crear encargo"
                    : role.id === "admin"
                      ? "Planificar y asignar"
                      : "Crear actividad propia"}
          </Button>
        </footer>
      </Card>
    </form>
  );
}
