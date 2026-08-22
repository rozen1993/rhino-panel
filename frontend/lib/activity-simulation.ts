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
import { readAccounts } from "@/lib/account-store";
import { safeMaterialUrl, safeReferenceUrl } from "@/lib/external-link";
import { activityTypes, roleIds, type Role, type RoleId } from "@/lib/roles";

export const activityStoreKey = "rhino:actividades-simuladas:v3";
const changedEvent = "rhino:actividades-simuladas-cambio-v3";
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
  referenceLink: string;
  threadOpenedAt?: string;
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
  creator = responsibleAccountId,
): SimulatedActivity {
  const actor: ActivityActor = {
    accountId: creator,
    name: origin === "burson" ? "Equipo Burson" : responsible,
    roleId: origin === "burson" ? "burson" : "operario",
    roleLabel: origin === "burson" ? "Burson" : "Operario",
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
function validDate(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
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
    isActor(value.author) &&
    (value.editedAt === undefined || typeof value.editedAt === "string") &&
    (value.deletedAt === undefined || typeof value.deletedAt === "string")
  );
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
    Array.isArray(value.spans) &&
    validSpans(value.spans as DateSpan[]) &&
    Array.isArray(value.thread) &&
    value.thread.every(isThreadMessage) &&
    Array.isArray(value.audit) &&
    value.audit.every(isAuditEntry) &&
    (value.deletedAt === undefined || typeof value.deletedAt === "string")
  );
}
export function parseActivityStore(raw: string | null): SimulatedActivity[] {
  if (!raw) return seed;
  try {
    const value: unknown = JSON.parse(raw);
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
): Result {
  const current = readActivities(storage);
  const found = current.find((item) => item.id === id);
  if (!found || found.deletedAt)
    return { ok: false, error: "La actividad no existe." };
  const changed = change(found);
  if (typeof changed === "string") return { ok: false, error: changed };
  const next = {
    ...changed,
    version: changed.version + 1,
    updatedAt: new Date().toISOString(),
  };
  save(
    storage,
    current.map((item) => (item.id === id ? next : item)),
  );
  return { ok: true, activity: next };
}
function validSpans(spans: DateSpan[]) {
  return (
    spans.length > 0 &&
    spans.length <= 100 &&
    spans.every((span) => {
      if (
        !isRecord(span) ||
        !validDate(span.start) ||
        !validDate(span.end) ||
        span.end < span.start
      )
        return false;
      return (
        Date.parse(`${span.end}T00:00:00Z`) -
          Date.parse(`${span.start}T00:00:00Z`) <=
        3660 * 86_400_000
      );
    })
  );
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
  if (role.id === "admin") return true;
  if (role.id === "burson")
    return (
      item.origin === "burson" && item.createdByAccountId === role.accountId
    );
  return (
    item.responsibleAccountId === role.accountId ||
    Boolean(role.bursonLinked && item.origin === "burson")
  );
}
export function canEditActivity(item: SimulatedActivity, role: Role) {
  const responsible =
    role.id === "operario" && item.responsibleAccountId === role.accountId;
  const bursonCreator =
    role.id === "burson" &&
    item.origin === "burson" &&
    item.createdByAccountId === role.accountId &&
    item.status === "Programada";
  return responsible || bursonCreator;
}
export function createOwnActivity(
  storage: Pick<Storage, "getItem" | "setItem">,
  fields: ActivityDraftFields,
  role: Role,
  idempotencyKey?: string,
) {
  if (role.id !== "operario")
    return {
      ok: false as const,
      error: "Solo un operario puede registrar una actividad propia.",
    };
  if (
    !fields.title.trim() ||
    !fields.description.trim() ||
    !validSpans(fields.spans)
  )
    return {
      ok: false as const,
      error: "Completa título, descripción y fechas válidas.",
    };
  if (fields.referenceLink && !safeReferenceUrl(fields.referenceLink))
    return {
      ok: false as const,
      error: "Usa un enlace de referencia HTTPS válido.",
    };
  if (fields.materialLink && !safeMaterialUrl(fields.materialLink))
    return {
      ok: false as const,
      error: "Usa un enlace HTTPS válido de OneDrive o SharePoint.",
    };
  const current = readActivities(storage);
  const duplicate =
    idempotencyKey &&
    current.find((item) => item.idempotencyKey === idempotencyKey);
  if (duplicate) return { ok: true as const, activity: duplicate };
  const actor = actorFromRole(role);
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
    materialLink: fields.materialLink.trim(),
    operatorOpinion: fields.notes.trim(),
    referenceLink: "",
    createdByAccountId: actor.accountId,
    createdByRoleId: actor.roleId,
    createdAt: now,
    updatedAt: now,
    version: 1,
    idempotencyKey,
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
) {
  if (role.id !== "burson")
    return {
      ok: false as const,
      error: "Solo Burson puede crear encargos Burson.",
    };
  const special = readAccounts(accountStorage).find(
    (item) => item.active && item.roleId === "operario" && item.bursonLinked,
  );
  if (!special)
    return {
      ok: false as const,
      error: "No existe un operario activo vinculado a Burson.",
    };
  if (
    !fields.title.trim() ||
    !fields.description.trim() ||
    !validSpans(fields.spans)
  )
    return {
      ok: false as const,
      error: "Completa título, descripción y fechas válidas.",
    };
  const actor = actorFromRole(role);
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
    referenceLink: fields.referenceLink.trim(),
    createdByAccountId: actor.accountId,
    createdByRoleId: "burson",
    createdAt: now,
    updatedAt: now,
    version: 1,
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
  save(storage, [next, ...readActivities(storage)]);
  return { ok: true as const, activity: next };
}
export function editActivity(
  storage: Pick<Storage, "getItem" | "setItem">,
  id: string,
  fields: ActivityDraftFields,
  actor: ActivityActor,
  expectedVersion: number,
): Result {
  return update(storage, id, (item) => {
    if (item.version !== expectedVersion)
      return "La actividad cambió; recarga antes de guardar.";
    const responsible =
      item.responsibleAccountId === actor.accountId &&
      actor.roleId === "operario";
    const bursonCreator =
      item.origin === "burson" &&
      item.createdByAccountId === actor.accountId &&
      actor.roleId === "burson" &&
      item.status === "Programada";
    if (!responsible && !bursonCreator)
      return "No tienes permiso para editar esta actividad.";
    if (
      !validSpans(fields.spans) ||
      !fields.title.trim() ||
      !fields.description.trim()
    )
      return "Completa los datos obligatorios.";
    if (
      responsible &&
      !item.threadOpenedAt &&
      fields.materialLink &&
      !safeMaterialUrl(fields.materialLink)
    )
      return "Usa un enlace HTTPS válido de OneDrive o SharePoint.";
    if (
      bursonCreator &&
      fields.referenceLink &&
      !safeReferenceUrl(fields.referenceLink)
    )
      return "Usa un enlace de referencia HTTPS válido.";
    return {
      ...item,
      type: fields.type,
      title: fields.title.trim(),
      description: fields.description.trim(),
      spans: fields.spans,
      place: fields.placeName.trim(),
      referenceLink: bursonCreator
        ? fields.referenceLink.trim()
        : item.referenceLink,
      materialLink:
        responsible && !item.threadOpenedAt
          ? fields.materialLink.trim()
          : item.materialLink,
      operatorOpinion:
        responsible && !item.threadOpenedAt
          ? fields.notes.trim()
          : item.operatorOpinion,
      audit: audit(item, "Actividad editada", actor),
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
    if (item.threadOpenedAt)
      return "La actividad está bloqueada por la conversación con Admin.";
    const status: InternalStatus | null =
      item.status === "Programada"
        ? "En proceso"
        : item.status === "En proceso"
          ? "Entregada"
          : null;
    if (!status) return "La actividad ya fue entregada.";
    if (status === "Entregada" && !safeMaterialUrl(item.materialLink))
      return "Añade un enlace válido de OneDrive antes de entregar.";
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
): Result {
  return update(storage, id, (item) => {
    const ownBeforeAdmin =
      actor.roleId === "operario" &&
      item.responsibleAccountId === actor.accountId &&
      !item.threadOpenedAt;
    const admin = actor.roleId === "admin";
    const burson =
      actor.roleId === "burson" &&
      item.createdByAccountId === actor.accountId &&
      item.status === "Programada";
    if (!ownBeforeAdmin && !admin && !burson)
      return "No tienes permiso para eliminar esta actividad.";
    if (!reason.trim()) return "Escribe el motivo de eliminación.";
    return {
      ...item,
      deletedAt: new Date().toISOString(),
      deletedBy: actor,
      deletionReason: reason.trim(),
      audit: audit(
        item,
        "Actividad eliminada lógicamente",
        actor,
        reason.trim(),
      ),
    };
  });
}
export function addThreadMessage(
  storage: Pick<Storage, "getItem" | "setItem">,
  id: string,
  text: string,
  actor: ActivityActor,
): Result {
  return update(storage, id, (item) => {
    if (!text.trim()) return "Escribe un mensaje.";
    if (item.status !== "Entregada")
      return "La conversación se habilita cuando la actividad está entregada.";
    const first = !item.threadOpenedAt;
    if (first && actor.roleId !== "admin")
      return "Admin debe iniciar la conversación.";
    if (
      !first &&
      actor.roleId !== "admin" &&
      item.responsibleAccountId !== actor.accountId
    )
      return "Solo Admin y el responsable pueden conversar.";
    if (actor.roleId === "burson")
      return "Burson no puede acceder a esta conversación.";
    const now = new Date().toISOString();
    return {
      ...item,
      threadOpenedAt: item.threadOpenedAt ?? now,
      thread: [
        ...item.thread,
        {
          id: `message-${Date.now().toString(36)}`,
          text: text.trim(),
          author: actor,
          createdAt: now,
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
  });
}
export function editThreadMessage(
  storage: Pick<Storage, "getItem" | "setItem">,
  id: string,
  messageId: string,
  text: string,
  actor: ActivityActor,
): Result {
  return update(storage, id, (item) => {
    const target = item.thread.find(
      (message) => message.id === messageId && !message.deletedAt,
    );
    if (!target || target.author.accountId !== actor.accountId)
      return "Solo el autor puede editar este mensaje.";
    if (!text.trim()) return "El mensaje no puede quedar vacío.";
    return {
      ...item,
      thread: item.thread.map((message) =>
        message.id === messageId
          ? {
              ...message,
              text: text.trim(),
              editedAt: new Date().toISOString(),
            }
          : message,
      ),
      audit: audit(item, "Mensaje editado", actor),
    };
  });
}
export function deleteThreadMessage(
  storage: Pick<Storage, "getItem" | "setItem">,
  id: string,
  messageId: string,
  actor: ActivityActor,
): Result {
  return update(storage, id, (item) => {
    const target = item.thread.find(
      (message) => message.id === messageId && !message.deletedAt,
    );
    if (!target || target.author.accountId !== actor.accountId)
      return "Solo el autor puede eliminar este mensaje.";
    return {
      ...item,
      thread: item.thread.map((message) =>
        message.id === messageId
          ? { ...message, deletedAt: new Date().toISOString() }
          : message,
      ),
      audit: audit(item, "Mensaje eliminado", actor),
    };
  });
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
export function isOverdue(item: SimulatedActivity, today = new Date()) {
  if (item.status === "Entregada") return false;
  const end = new Date(`${lastDate(item)}T23:59:59`);
  return !Number.isNaN(end.getTime()) && today.getTime() > end.getTime();
}
export function useSimulatedActivities() {
  const subscribe = useCallback((notify: () => void) => {
    const handler = () => notify();
    window.addEventListener("storage", handler);
    window.addEventListener(changedEvent, handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener(changedEvent, handler);
    };
  }, []);
  const snapshot = useCallback(
    () => window.localStorage.getItem(activityStoreKey) ?? seedSnapshot,
    [],
  );
  const raw = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return useMemo(() => parseActivityStore(raw), [raw]);
}
export function useActivityStoreHealth() {
  return { corrupt: false };
}
