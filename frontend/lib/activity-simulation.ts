"use client";
import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { InternalStatus } from "@/components/status-pill";
import {
  firstDate,
  lastDate,
  type Activity,
  type DateSpan,
} from "@/lib/activities";
import type { ActivityDraftFields } from "@/lib/activity-draft";
import { validSpans } from "@/lib/activity-validation";
import { readAccounts } from "@/lib/account-store";
import { safeMaterialUrl, safeReferenceUrl } from "@/lib/external-link";
import { calendarDateInLima } from "@/lib/historical";
import { activityTypes, roleIds, type Role, type RoleId } from "@/lib/roles";

export const activityStoreKey = "rhino:actividades-simuladas:v4";
const changedEvent = "rhino:actividades-simuladas-cambio-v4";
export type ActivityActor = {
  accountId: string;
  name: string;
  roleId: RoleId;
  roleLabel: string;
};
export type AuditEntry = {
  action: string;
  actor: ActivityActor;
  moment: string;
  detail?: string;
};
export type ThreadMessage = {
  id: string;
  text: string;
  author: ActivityActor;
  createdAt: string;
  version: number;
  opensThread: boolean;
  editedAt?: string;
  deletedAt?: string;
};
export type SimulatedActivity = Activity & {
  createdByAccountId: string;
  createdByRoleId: RoleId;
  createdAt: string;
  updatedAt: string;
  version: number;
  idempotencyKey?: string;
  idempotencyFingerprint?: string;
  referenceLink: string;
  threadOpenedAt?: string;
  detailHydration: "summary" | "complete";
  thread: ThreadMessage[];
  audit: AuditEntry[];
  deletionReason?: string;
  deletedBy?: ActivityActor;
  deliveredAt?: string;
};

const seed: SimulatedActivity[] = [
  seedActivity(
    "cobertura-norte",
    "Grabación",
    "Cobertura audiovisual Norte",
    "Ana Torres",
    "account-ana",
    "Entregada",
    [
      { start: "2026-01-04", end: "2026-01-04" },
      { start: "2026-01-11", end: "2026-01-11" },
      { start: "2026-02-02", end: "2026-02-02" },
    ],
    "Cobertura de actividades y entrevistas en las sedes del norte del país.",
    "https://onedrive.live.com/cobertura-norte",
    "El material cumplió con los objetivos y la calidad técnica requerida.",
  ),
  seedActivity(
    "edicion-seguridad",
    "Edición",
    "Edición campaña de seguridad vial",
    "Carlos Vega",
    "account-carlos",
    "En proceso",
    [{ start: "2026-05-12", end: "2026-05-19" }],
    "Edición de piezas para la campaña vial 2026.",
  ),
  seedActivity(
    "piezas-creativas",
    "Creatividad",
    "Piezas para campaña institucional",
    "Ana Torres",
    "account-ana",
    "Programada",
    [{ start: "2026-10-13", end: "2026-10-15" }],
    "Desarrollo de piezas gráficas y audiovisuales.",
  ),
  seedActivity(
    "locucion-burson",
    "Locución",
    "Locución institucional Burson",
    "Luis Mendoza",
    "account-luis",
    "Programada",
    [{ start: "2026-11-09", end: "2026-11-11" }],
    "Encargo de locución para campaña institucional.",
    "",
    "",
    "burson",
    "account-burson",
  ),
];
function seedActivity(
  id: string,
  type: SimulatedActivity["type"],
  title: string,
  responsible: string,
  responsibleAccountId: string,
  status: InternalStatus,
  spans: DateSpan[],
  description: string,
  materialLink = "",
  operatorOpinion = "",
  origin: SimulatedActivity["origin"] = "operario",
  creator = origin === "burson" ? "account-burson" : "account-admin",
): SimulatedActivity {
  const actor: ActivityActor = {
    accountId: creator,
    name: origin === "burson" ? "Equipo Burson" : "Marco Admin",
    roleId: origin === "burson" ? "burson" : "admin",
    roleLabel: origin === "burson" ? "Burson" : "Admin",
  };
  return {
    id,
    type,
    title,
    responsible,
    responsibleAccountId,
    status,
    origin,
    spans,
    description,
    place: "",
    materialLink,
    operatorOpinion,
    createdByAccountId: creator,
    createdByRoleId: actor.roleId,
    createdAt: `${firstDate({ spans })}T08:00:00-05:00`,
    updatedAt: `${firstDate({ spans })}T08:00:00-05:00`,
    version: 1,
    referenceLink: "",
    detailHydration: "complete",
    thread: [],
    audit: [
      {
        action: "Actividad creada",
        actor,
        moment: `${firstDate({ spans })}T08:00:00-05:00`,
      },
    ],
    deliveredAt:
      status === "Entregada"
        ? `${lastDate({ spans })}T18:00:00-05:00`
        : undefined,
  };
}
const seedSnapshot = JSON.stringify(seed);
const serverSnapshot = () => seedSnapshot;
export function actorFromRole(role: Role): ActivityActor {
  return {
    accountId: role.accountId ?? `test-${role.id}`,
    name: role.accountName ?? role.label,
    roleId: role.id,
    roleLabel: role.label,
  };
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}
function isActor(value: unknown): value is ActivityActor {
  return (
    isRecord(value) &&
    typeof value.accountId === "string" &&
    typeof value.name === "string" &&
    typeof value.roleLabel === "string" &&
    roleIds.includes(value.roleId as RoleId)
  );
}
function isAuditEntry(value: unknown): value is AuditEntry {
  return (
    isRecord(value) &&
    typeof value.action === "string" &&
    typeof value.moment === "string" &&
    isActor(value.actor) &&
    (value.detail === undefined || typeof value.detail === "string")
  );
}
function isThreadMessage(value: unknown): value is ThreadMessage {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.text === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.version === "number" &&
    Number.isInteger(value.version) &&
    value.version > 0 &&
    typeof value.opensThread === "boolean" &&
    isActor(value.author) &&
    (!value.opensThread || value.author.roleId === "admin") &&
    (value.editedAt === undefined || typeof value.editedAt === "string") &&
    (value.deletedAt === undefined || typeof value.deletedAt === "string")
  );
}
function normalizeLegacyThreadMetadata(value: unknown): unknown {
  if (!Array.isArray(value)) return value;
  return value.map((activity) => {
    if (!isRecord(activity) || !Array.isArray(activity.thread)) return activity;
    return {
      ...activity,
      detailHydration:
        activity.detailHydration === undefined
          ? "complete"
          : activity.detailHydration,
      thread: activity.thread.map((message, index) =>
        isRecord(message)
          ? {
              ...message,
              version: message.version === undefined ? 1 : message.version,
              opensThread:
                message.opensThread === undefined
                  ? index === 0
                  : message.opensThread,
            }
          : message,
      ),
    };
  });
}
function isStoredActivity(value: unknown): value is SimulatedActivity {
  if (!isRecord(value)) return false;
  const strings = [
    "id",
    "title",
    "responsible",
    "responsibleAccountId",
    "description",
    "place",
    "materialLink",
    "operatorOpinion",
    "createdByAccountId",
    "createdAt",
    "updatedAt",
    "referenceLink",
  ];
  return (
    strings.every((key) => typeof value[key] === "string") &&
    activityTypes.includes(value.type as SimulatedActivity["type"]) &&
    ["Programada", "En proceso", "Entregada"].includes(
      value.status as string,
    ) &&
    ["operario", "burson"].includes(value.origin as string) &&
    roleIds.includes(value.createdByRoleId as RoleId) &&
    typeof value.version === "number" &&
    Number.isInteger(value.version) &&
    value.version > 0 &&
    ["summary", "complete"].includes(value.detailHydration as string) &&
    Array.isArray(value.spans) &&
    validSpans(value.spans as DateSpan[]) &&
    Array.isArray(value.thread) &&
    value.thread.every(isThreadMessage) &&
    Array.isArray(value.audit) &&
    value.audit.every(isAuditEntry) &&
    ((value.deletedAt === undefined &&
      value.deletedBy === undefined &&
      value.deletionReason === undefined) ||
      (typeof value.deletedAt === "string" &&
        isActor(value.deletedBy) &&
        typeof value.deletionReason === "string" &&
        value.deletionReason.trim().length >= 2 &&
        value.deletionReason.trim().length <= 1000))
  );
}
export function parseActivityStore(raw: string | null): SimulatedActivity[] {
  if (!raw) return seed;
  try {
    const value = normalizeLegacyThreadMetadata(JSON.parse(raw));
    return Array.isArray(value) && value.every(isStoredActivity) ? value : seed;
  } catch {
    return seed;
  }
}
export function readActivities(storage: Pick<Storage, "getItem">) {
  return parseActivityStore(storage.getItem(activityStoreKey));
}
function save(
  storage: Pick<Storage, "setItem">,
  activities: SimulatedActivity[],
) {
  storage.setItem(activityStoreKey, JSON.stringify(activities));
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event(changedEvent));
}
type Result =
  { ok: true; activity: SimulatedActivity } | { ok: false; error: string };
function update(
  storage: Pick<Storage, "getItem" | "setItem">,
  id: string,
  change: (item: SimulatedActivity) => SimulatedActivity | string,
  bumpActivityVersion = true,
  allowDeleted = false,
): Result {
  const current = readActivities(storage);
  const found = current.find((item) => item.id === id);
  if (!found || (found.deletedAt && !allowDeleted))
    return { ok: false, error: "La actividad no existe." };
  const changed = change(found);
  if (typeof changed === "string") return { ok: false, error: changed };
  const next = bumpActivityVersion
    ? {
        ...changed,
        version: changed.version + 1,
        updatedAt: new Date().toISOString(),
      }
    : changed;
  save(
    storage,
    current.map((item) => (item.id === id ? next : item)),
  );
  return { ok: true, activity: next };
}
function slug(title: string) {
  return `${
    title
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 38) || "actividad"
  }-${Date.now().toString(36)}`;
}
function audit(
  item: SimulatedActivity,
  action: string,
  actor: ActivityActor,
  detail?: string,
) {
  return [
    { action, actor, moment: new Date().toISOString(), detail },
    ...item.audit,
  ];
}
export function canViewActivity(item: SimulatedActivity, role: Role) {
  if (item.deletedAt) return role.id === "admin";
  if (role.id === "admin") return true;
  if (role.id === "burson")
    return (
      item.origin === "burson" && item.createdByAccountId === role.accountId
    );
  return (
    item.responsibleAccountId === role.accountId
  );
}
export function canEditActivity(item: SimulatedActivity, role: Role) {
  const responsible =
    role.id === "operario" && item.responsibleAccountId === role.accountId;
  return role.id === "admin" || responsible;
}

function planningError(fields: ActivityDraftFields) {
  if (
    !fields.title.trim() ||
    !fields.description.trim() ||
    !validSpans(fields.spans)
  )
    return "Completa título, descripción y fechas válidas.";
  if (fields.placeName.length > 300)
    return "El lugar supera el tamaño permitido.";
  return null;
}

function planningFingerprint(
  fields: ActivityDraftFields,
  responsibleAccountId: string,
) {
  return JSON.stringify({
    responsibleAccountId,
    type: fields.type,
    title: fields.title.trim(),
    description: fields.description.trim(),
    place: fields.placeName.trim(),
    spans: fields.spans.map(({ start, end }) => ({ start, end })),
  });
}

function bursonPlanningFingerprint(
  fields: ActivityDraftFields,
  referenceLink: string,
) {
  return JSON.stringify({
    type: fields.type,
    title: fields.title.trim(),
    description: fields.description.trim(),
    place: fields.placeName.trim(),
    spans: fields.spans.map(({ start, end }) => ({ start, end })),
    referenceLink,
  });
}

function idempotencyReplay(
  activities: SimulatedActivity[],
  actorAccountId: string,
  key: string | undefined,
  fingerprint: string,
  expectedResponsibleAccountId: string,
  responsibilityMismatchError: string,
) {
  if (!key) return null;
  const duplicate = activities.find(
    (item) =>
      item.createdByAccountId === actorAccountId &&
      item.idempotencyKey === key,
  );
  if (!duplicate) return null;
  if (duplicate.responsibleAccountId !== expectedResponsibleAccountId)
    return {
      ok: false as const,
      error: responsibilityMismatchError,
    };
  if (
    duplicate.deletedAt ||
    duplicate.idempotencyFingerprint !== fingerprint
  )
    return {
      ok: false as const,
      error:
        "SR006: la clave de idempotencia se reutilizó con una solicitud diferente.",
    };
  return { ok: true as const, activity: duplicate, replayed: true as const };
}

export function planActivity(
  storage: Pick<Storage, "getItem" | "setItem">,
  accountStorage: Pick<Storage, "getItem">,
  fields: ActivityDraftFields,
  role: Role,
  idempotencyKey?: string,
) {
  if (role.id !== "admin")
    return {
      ok: false as const,
      error: "Solo Admin puede planificar actividades para el equipo.",
    };
  const validation = planningError(fields);
  if (validation) return { ok: false as const, error: validation };
  const responsible = readAccounts(accountStorage).find(
    (item) =>
      item.id === fields.responsibleAccountId &&
      item.active &&
      item.roleId === "operario",
  );
  if (!responsible)
    return {
      ok: false as const,
      error: "Selecciona un operario activo como responsable.",
    };

  const current = readActivities(storage);
  const actor = actorFromRole(role);
  const idempotencyFingerprint = planningFingerprint(fields, responsible.id);
  const replay = idempotencyReplay(
    current,
    actor.accountId,
    idempotencyKey,
    idempotencyFingerprint,
    responsible.id,
    "SR006: la actividad idempotente ya no conserva el responsable planificado.",
  );
  if (replay) return replay;
  const now = new Date().toISOString();
  const next: SimulatedActivity = {
    id: slug(fields.title),
    type: fields.type,
    title: fields.title.trim(),
    responsible: responsible.name,
    responsibleAccountId: responsible.id,
    status: "Programada",
    origin: "operario",
    spans: fields.spans,
    description: fields.description.trim(),
    place: fields.placeName.trim(),
    materialLink: "",
    operatorOpinion: "",
    referenceLink: "",
    createdByAccountId: actor.accountId,
    createdByRoleId: "admin",
    createdAt: now,
    updatedAt: now,
    version: 1,
    idempotencyKey,
    idempotencyFingerprint,
    detailHydration: "complete",
    thread: [],
    audit: [
      {
        action: "Actividad planificada",
        actor,
        moment: now,
        detail: responsible.name,
      },
    ],
  };
  save(storage, [next, ...current]);
  return { ok: true as const, activity: next };
}

export function createOwnActivity(
  storage: Pick<Storage, "getItem" | "setItem">,
  fields: ActivityDraftFields,
  role: Role,
  idempotencyKey?: string,
) {
  if (role.id !== "operario" || !role.canCreateOwnActivities)
    return {
      ok: false as const,
      error: "Admin no te concedió permiso para crear una actividad propia.",
    };
  const validation = planningError(fields);
  if (validation) return { ok: false as const, error: validation };
  const current = readActivities(storage);
  const actor = actorFromRole(role);
  const idempotencyFingerprint = planningFingerprint(fields, actor.accountId);
  const replay = idempotencyReplay(
    current,
    actor.accountId,
    idempotencyKey,
    idempotencyFingerprint,
    actor.accountId,
    "SR002: la actividad ya no está asignada a este operario.",
  );
  if (replay) return replay;
  const now = new Date().toISOString();
  const next: SimulatedActivity = {
    id: slug(fields.title),
    type: fields.type,
    title: fields.title.trim(),
    responsible: actor.name,
    responsibleAccountId: actor.accountId,
    status: "Programada",
    origin: "operario",
    spans: fields.spans,
    description: fields.description.trim(),
    place: fields.placeName.trim(),
    materialLink: "",
    operatorOpinion: "",
    referenceLink: "",
    createdByAccountId: actor.accountId,
    createdByRoleId: actor.roleId,
    createdAt: now,
    updatedAt: now,
    version: 1,
    idempotencyKey,
    idempotencyFingerprint,
    detailHydration: "complete",
    thread: [],
    audit: [{ action: "Actividad creada", actor, moment: now }],
  };
  save(storage, [next, ...current]);
  return { ok: true as const, activity: next };
}
export function createBursonActivity(
  storage: Pick<Storage, "getItem" | "setItem">,
  accountStorage: Pick<Storage, "getItem">,
  fields: ActivityDraftFields,
  role: Role,
  idempotencyKey?: string,
) {
  if (role.id !== "burson")
    return {
      ok: false as const,
      error: "Solo Burson puede crear encargos Burson.",
    };
  const validation = planningError(fields);
  if (validation) return { ok: false as const, error: validation };
  const rawReferenceLink = fields.referenceLink.trim();
  const normalizedReferenceLink = rawReferenceLink
    ? safeReferenceUrl(rawReferenceLink)
    : "";
  if (normalizedReferenceLink === null)
    return {
      ok: false as const,
      error: "Usa un enlace de referencia HTTPS válido.",
    };
  const actor = actorFromRole(role);
  const current = readActivities(storage);
  const idempotencyFingerprint = bursonPlanningFingerprint(
    fields,
    normalizedReferenceLink,
  );
  if (idempotencyKey) {
    const duplicate = current.find(
      (item) =>
        item.createdByAccountId === actor.accountId &&
        item.idempotencyKey === idempotencyKey,
    );
    if (duplicate) {
      if (
        duplicate.deletedAt ||
        duplicate.origin !== "burson" ||
        duplicate.idempotencyFingerprint !== idempotencyFingerprint
      )
        return {
          ok: false as const,
          error:
            "SR006: la clave de idempotencia se reutilizó con un encargo diferente.",
        };
      return { ok: true as const, activity: duplicate, replayed: true as const };
    }
  }
  const special = readAccounts(accountStorage).find(
    (item) => item.active && item.roleId === "operario" && item.bursonLinked,
  );
  if (!special)
    return {
      ok: false as const,
      error: "No existe un operario activo vinculado a Burson.",
    };
  const now = new Date().toISOString();
  const next: SimulatedActivity = {
    id: slug(fields.title),
    type: fields.type,
    title: fields.title.trim(),
    responsible: special.name,
    responsibleAccountId: special.id,
    status: "Programada",
    origin: "burson",
    spans: fields.spans,
    description: fields.description.trim(),
    place: fields.placeName.trim(),
    materialLink: "",
    operatorOpinion: "",
    referenceLink: normalizedReferenceLink,
    createdByAccountId: actor.accountId,
    createdByRoleId: "burson",
    createdAt: now,
    updatedAt: now,
    version: 1,
    idempotencyKey,
    idempotencyFingerprint,
    detailHydration: "complete",
    thread: [],
    audit: [
      {
        action: "Encargo Burson creado y asignado",
        actor,
        moment: now,
        detail: special.name,
      },
    ],
  };
  save(storage, [next, ...current]);
  return { ok: true as const, activity: next };
}
export function replanActivity(
  storage: Pick<Storage, "getItem" | "setItem">,
  accountStorage: Pick<Storage, "getItem">,
  id: string,
  fields: ActivityDraftFields,
  actor: ActivityActor,
  expectedVersion: number,
): Result {
  return update(storage, id, (item) => {
    if (actor.roleId !== "admin")
      return "Solo Admin puede modificar la planificación.";
    if (item.version !== expectedVersion)
      return "La actividad cambió; recarga antes de guardar.";
    const validation = planningError(fields);
    if (validation) return validation;

    const responsible = readAccounts(accountStorage).find(
      (account) =>
        account.id === fields.responsibleAccountId &&
        account.active &&
        account.roleId === "operario",
    );
    if (!responsible)
      return "Selecciona un operario activo como responsable.";
    if (item.origin === "burson" && !responsible.bursonLinked)
      return "Un encargo Burson requiere al operario especial.";

    return {
      ...item,
      type: fields.type,
      title: fields.title.trim(),
      description: fields.description.trim(),
      spans: fields.spans,
      place: fields.placeName.trim(),
      responsible: responsible.name,
      responsibleAccountId: responsible.id,
      audit: audit(
        item,
        "Planificación actualizada",
        actor,
        responsible.name,
      ),
    };
  });
}

export function updateExecutionActivity(
  storage: Pick<Storage, "getItem" | "setItem">,
  id: string,
  fields: Pick<ActivityDraftFields, "materialLink" | "notes">,
  actor: ActivityActor,
  expectedVersion: number,
): Result {
  return update(storage, id, (item) => {
    if (
      actor.roleId !== "operario" ||
      item.responsibleAccountId !== actor.accountId
    )
      return "Solo el operario responsable actualiza la ejecución.";
    if (item.version !== expectedVersion)
      return "La actividad cambió; recarga antes de guardar.";
    if (item.threadOpenedAt)
      return "Admin inició la conversación; el enlace y la opinión están bloqueados.";
    const rawMaterialLink = fields.materialLink.trim();
    const materialLink = rawMaterialLink
      ? safeMaterialUrl(rawMaterialLink)
      : "";
    if (materialLink === null)
      return "Usa un enlace HTTPS válido sin credenciales incrustadas.";
    if (fields.notes.length > 5000)
      return "La opinión supera el tamaño permitido.";
    if (item.status === "Entregada" && !materialLink)
      return "Una actividad entregada debe conservar su enlace de material.";

    return {
      ...item,
      materialLink,
      operatorOpinion: fields.notes.trim(),
      audit: audit(item, "Ejecución actualizada", actor),
    };
  });
}
export function advanceActivity(
  storage: Pick<Storage, "getItem" | "setItem">,
  id: string,
  actor: ActivityActor,
  expectedVersion?: number,
): Result {
  return update(storage, id, (item) => {
    if (
      actor.roleId !== "operario" ||
      item.responsibleAccountId !== actor.accountId
    )
      return "Solo el operario responsable puede cambiar el estado.";
    if (expectedVersion !== undefined && item.version !== expectedVersion)
      return "La actividad cambió; revisa la versión nueva.";
    const status: InternalStatus | null =
      item.status === "Programada"
        ? "En proceso"
        : item.status === "En proceso"
          ? "Entregada"
          : null;
    if (!status) return "La actividad ya fue entregada.";
    if (status === "Entregada" && !safeMaterialUrl(item.materialLink))
      return "Añade un enlace HTTPS válido antes de entregar.";
    return {
      ...item,
      status,
      deliveredAt:
        status === "Entregada" ? new Date().toISOString() : item.deliveredAt,
      audit: audit(item, `Estado cambiado a ${status}`, actor),
    };
  });
}
export function softDeleteActivity(
  storage: Pick<Storage, "getItem" | "setItem">,
  id: string,
  reason: string,
  actor: ActivityActor,
  expectedVersion: number,
): Result {
  return update(storage, id, (item) => {
    if (actor.roleId !== "admin")
      return "Solo Admin puede dar de baja una actividad.";
    if (item.deletedAt) return "La actividad ya está en la Papelera.";
    const normalizedReason = reason.trim();
    if (normalizedReason.length < 2 || normalizedReason.length > 1000)
      return "Escribe un motivo de baja de 2 a 1000 caracteres.";
    if (item.version !== expectedVersion)
      return "La actividad cambió; recarga antes de darla de baja.";
    return {
      ...item,
      deletedAt: new Date().toISOString(),
      deletedBy: actor,
      deletionReason: normalizedReason,
      audit: audit(
        item,
        "Actividad dada de baja",
        actor,
        normalizedReason,
      ),
    };
  }, true, true);
}

export function restoreActivity(
  storage: Pick<Storage, "getItem" | "setItem">,
  accountStorage: Pick<Storage, "getItem">,
  id: string,
  actor: ActivityActor,
  expectedVersion: number,
  responsibleAccountId: string | null = null,
): Result {
  return update(storage, id, (item) => {
    if (actor.roleId !== "admin")
      return "Solo Admin puede restaurar una actividad.";
    if (!item.deletedAt) return "La actividad no está en la Papelera.";
    if (item.version !== expectedVersion)
      return "La actividad cambió; recarga antes de restaurarla.";

    const resolvedResponsibleId =
      responsibleAccountId ?? item.responsibleAccountId;
    const responsibleChanged =
      resolvedResponsibleId !== item.responsibleAccountId;
    if (item.status === "Entregada" && responsibleChanged)
      return "Una actividad entregada conserva a su responsable histórico.";
    const accounts = readAccounts(accountStorage);
    const resolvedAccount = accounts.find(
      (account) => account.id === resolvedResponsibleId,
    );
    const requiresActiveResponsible = item.status !== "Entregada";
    if (
      (requiresActiveResponsible || responsibleChanged) &&
      (!resolvedAccount?.active || resolvedAccount.roleId !== "operario")
    )
      return responsibleAccountId === null
        ? "El responsable ya no está activo. Elige un Operario activo para restaurar."
        : "Selecciona un Operario activo para restaurar.";
    if (
      item.origin === "burson" &&
      item.status !== "Entregada" &&
      !resolvedAccount?.bursonLinked
    )
      return "Un encargo Burson requiere al Operario especial activo.";
    const restored = { ...item };
    delete restored.deletedAt;
    delete restored.deletedBy;
    delete restored.deletionReason;
    return {
      ...restored,
      responsibleAccountId: resolvedResponsibleId,
      responsible:
        responsibleChanged
          ? (resolvedAccount?.name ?? item.responsible)
          : item.responsible,
      audit: audit(
        item,
        "Actividad restaurada",
        actor,
        responsibleChanged
          ? `Responsable: ${resolvedAccount?.name ?? item.responsible}`
          : undefined,
      ),
    };
  }, true, true);
}

export function listTrashedActivities(
  storage: Pick<Storage, "getItem">,
  role: Role,
) {
  if (role.id !== "admin") return [];
  return readActivities(storage)
    .filter((item) => Boolean(item.deletedAt))
    .sort((left, right) =>
      (right.deletedAt ?? "").localeCompare(left.deletedAt ?? ""),
    );
}
export function addThreadMessage(
  storage: Pick<Storage, "getItem" | "setItem">,
  id: string,
  text: string,
  actor: ActivityActor,
  expectedActivityVersion: number | null,
): Result {
  return update(storage, id, (item) => {
    if (!text.trim()) return "Escribe un mensaje.";
    if (item.status !== "Entregada")
      return "La conversación se habilita cuando la actividad está entregada.";
    const first = !item.threadOpenedAt;
    if (actor.roleId === "burson")
      return "Burson no puede acceder a esta conversación.";
    if (
      actor.roleId === "operario" &&
      item.responsibleAccountId !== actor.accountId
    )
      return "Solo Admin y el responsable pueden conversar.";
    if (first && actor.roleId !== "admin")
      return "Admin debe iniciar la conversación.";
    if (
      first &&
      (expectedActivityVersion === null ||
        item.version !== expectedActivityVersion)
    )
      return "La actividad cambió; recarga antes de iniciar la conversación.";
    if (!first && expectedActivityVersion !== null)
      return "La conversación cambió; recarga antes de publicar.";
    const now = new Date().toISOString();
    return {
      ...item,
      threadOpenedAt: item.threadOpenedAt ?? now,
      thread: [
        ...item.thread,
        {
          id: `message-${globalThis.crypto.randomUUID()}`,
          text: text.trim(),
          author: actor,
          createdAt: now,
          version: 1,
          opensThread: first,
        },
      ],
      audit: audit(
        item,
        first
          ? "Admin inició la conversación y bloqueó la entrega"
          : "Mensaje agregado",
        actor,
      ),
    };
  }, expectedActivityVersion !== null);
}
export function editThreadMessage(
  storage: Pick<Storage, "getItem" | "setItem">,
  id: string,
  messageId: string,
  text: string,
  actor: ActivityActor,
  expectedMessageVersion: number,
): Result {
  return update(storage, id, (item) => {
    if (
      actor.roleId === "burson" ||
      (actor.roleId === "operario" &&
        item.responsibleAccountId !== actor.accountId)
    )
      return "Solo Admin y el responsable pueden conversar.";
    const target = item.thread.find(
      (message) => message.id === messageId && !message.deletedAt,
    );
    if (!target || target.author.accountId !== actor.accountId)
      return "Solo el autor puede editar este mensaje.";
    if (target.version !== expectedMessageVersion)
      return "El mensaje cambió; recarga antes de editarlo.";
    if (!text.trim()) return "El mensaje no puede quedar vacío.";
    return {
      ...item,
      thread: item.thread.map((message) =>
        message.id === messageId
          ? {
              ...message,
              text: text.trim(),
              version: message.version + 1,
              editedAt: new Date().toISOString(),
            }
          : message,
      ),
      audit: audit(item, "Mensaje editado", actor),
    };
  }, false);
}
export function deleteThreadMessage(
  storage: Pick<Storage, "getItem" | "setItem">,
  id: string,
  messageId: string,
  actor: ActivityActor,
  expectedMessageVersion: number,
): Result {
  return update(storage, id, (item) => {
    if (
      actor.roleId === "burson" ||
      (actor.roleId === "operario" &&
        item.responsibleAccountId !== actor.accountId)
    )
      return "Solo Admin y el responsable pueden conversar.";
    const target = item.thread.find(
      (message) => message.id === messageId && !message.deletedAt,
    );
    if (!target || target.author.accountId !== actor.accountId)
      return "Solo el autor puede eliminar este mensaje.";
    if (target.version !== expectedMessageVersion)
      return "El mensaje cambió; recarga antes de eliminarlo.";
    return {
      ...item,
      thread: item.thread.map((message) =>
        message.id === messageId
          ? {
              ...message,
              version: message.version + 1,
              deletedAt: new Date().toISOString(),
            }
          : message,
      ),
      audit: audit(item, "Mensaje eliminado", actor, `Mensaje ${messageId}`),
    };
  }, false);
}
export function reassignOpenBursonActivities(
  storage: Pick<Storage, "getItem" | "setItem">,
  previousAccountId: string,
  nextAccountId: string,
  nextName: string,
  actor: ActivityActor,
) {
  const current = readActivities(storage);
  const now = new Date().toISOString();
  const changed = current.map((item) =>
    item.origin === "burson" &&
    item.responsibleAccountId === previousAccountId &&
    item.status !== "Entregada" &&
    !item.deletedAt
      ? {
          ...item,
          responsibleAccountId: nextAccountId,
          responsible: nextName,
          version: item.version + 1,
          updatedAt: now,
          audit: audit(
            item,
            "Responsable Burson reasignado",
            actor,
            `${nextName} asume el encargo`,
          ),
        }
      : item,
  );
  save(storage, changed);
  return changed.filter(
    (item) =>
      item.origin === "burson" &&
      item.responsibleAccountId === nextAccountId &&
      item.status !== "Entregada" &&
      !item.deletedAt,
  ).length;
}
export function isOverdue(
  item: Pick<SimulatedActivity, "status" | "spans">,
  today: Date | string = new Date(),
) {
  if (item.status === "Entregada") return false;
  const end = lastDate(item);
  const todayDate =
    typeof today === "string" ? today : calendarDateInLima(today);
  return Boolean(end) && end < todayDate;
}
export function useSimulatedActivities(enabled = true) {
  const subscribe = useCallback((notify: () => void) => {
    if (!enabled) return () => undefined;
    const handler = () => notify();
    window.addEventListener("storage", handler);
    window.addEventListener(changedEvent, handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener(changedEvent, handler);
    };
  }, [enabled]);
  const snapshot = useCallback(
    () =>
      enabled
        ? window.localStorage.getItem(activityStoreKey) ?? seedSnapshot
        : "[]",
    [enabled],
  );
  const initialSnapshot = useCallback(
    () => (enabled ? serverSnapshot() : "[]"),
    [enabled],
  );
  const raw = useSyncExternalStore(subscribe, snapshot, initialSnapshot);
  return useMemo(
    () =>
      parseActivityStore(raw).map((activity) => ({
        ...activity,
        thread: activity.thread.filter((message) => !message.deletedAt),
      })),
    [raw],
  );
}
export function useActivityStoreHealth() {
  return { corrupt: false };
}
