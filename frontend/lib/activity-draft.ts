import type { ActivityType } from "@/lib/activities";
import type { RoleId } from "@/lib/roles";

export type ActivityDraftFields = {
  date: string;
  type: ActivityType;
  title: string;
  responsible: string;
  responsibleAccountId?: string;
  status: string;
  progress: string;
  placeName: string;
  placeReference: string;
  placeKm: string;
  placeDirection: string;
  placeLatitude: string;
  placeLongitude: string;
  description: string;
  deliveryDate: string;
  materialLink: string;
  notes: string;
};

export type ActivityDraft = {
  version: 1;
  idempotencyKey: string;
  savedAt: string;
  fields: ActivityDraftFields;
};

export function activityDraftStorageKey(roleId: RoleId, activityId?: string) {
  return `rhino:borrador-actividad:${roleId}:${activityId ?? "nueva"}`;
}

export function createIdempotencyKey() {
  return globalThis.crypto?.randomUUID?.() ?? `rhino-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function parseActivityDraft(raw: string | null): ActivityDraft | null {
  if (!raw) return null;

  try {
    const candidate = JSON.parse(raw) as Partial<ActivityDraft>;
    if (candidate.version !== 1 || typeof candidate.idempotencyKey !== "string" || typeof candidate.savedAt !== "string" || !candidate.fields) {
      return null;
    }
    return candidate as ActivityDraft;
  } catch {
    return null;
  }
}

export function readActivityDraft(storage: Storage, key: string): ActivityDraft | null {
  const raw = storage.getItem(key);
  const draft = parseActivityDraft(raw);
  if (raw && !draft) storage.removeItem(key);
  return draft;
}

export function writeActivityDraft(storage: Storage, key: string, draft: ActivityDraft) {
  storage.setItem(key, JSON.stringify(draft));
}
