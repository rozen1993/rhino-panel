import {
  activityTypes,
  type ActivityType,
  type DateSpan,
} from "@/lib/activities";
import type { DataSource } from "@/lib/data-source";
import type { RoleId } from "@/lib/roles";
import { isUuid } from "@/lib/uuid";

export type ActivityDraftFields = {
  type: ActivityType;
  title: string;
  description: string;
  placeName: string;
  responsibleAccountId: string;
  spans: DateSpan[];
  materialLink: string;
  notes: string;
  referenceLink: string;
};

export type ActivityDraft = {
  version: 5;
  idempotencyKey: string;
  savedAt: string;
  fields: ActivityDraftFields;
};

export function activityDraftStorageKey(
  roleId: RoleId,
  accountId: string,
  activityId?: string,
  dataSource: DataSource = "demo",
) {
  return `rhino:borrador-actividad:v5:${dataSource}:${roleId}:${accountId}:${activityId ?? "nueva"}`;
}

export function createIdempotencyKey() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const tail = `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`
    .replace(/[^a-f0-9]/g, "")
    .padEnd(12, "0")
    .slice(0, 12);
  return `00000000-0000-4000-8000-${tail}`;
}

function isActivityDraftFields(value: unknown): value is ActivityDraftFields {
  if (!value || typeof value !== "object") return false;
  const fields = value as Partial<ActivityDraftFields>;
  return (
    activityTypes.includes(fields.type as ActivityType) &&
    typeof fields.title === "string" &&
    typeof fields.description === "string" &&
    typeof fields.placeName === "string" &&
    typeof fields.responsibleAccountId === "string" &&
    typeof fields.materialLink === "string" &&
    typeof fields.notes === "string" &&
    typeof fields.referenceLink === "string" &&
    Array.isArray(fields.spans) &&
    fields.spans.every(
      (span) =>
        Boolean(span) &&
        typeof span === "object" &&
        typeof span.start === "string" &&
        typeof span.end === "string" &&
        (span.place === undefined ||
          (typeof span.place === "string" && span.place.length <= 300)),
    )
  );
}

export function parseActivityDraft(raw: string | null): ActivityDraft | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as ActivityDraft;
    return value.version === 5 &&
      isUuid(value.idempotencyKey) &&
      typeof value.savedAt === "string" &&
      isActivityDraftFields(value.fields)
      ? value
      : null;
  } catch {
    return null;
  }
}

export function readActivityDraft(storage: Storage, key: string) {
  const value = parseActivityDraft(storage.getItem(key));
  if (!value) storage.removeItem(key);
  return value;
}

export function writeActivityDraft(
  storage: Storage,
  key: string,
  draft: ActivityDraft,
) {
  storage.setItem(key, JSON.stringify(draft));
}
