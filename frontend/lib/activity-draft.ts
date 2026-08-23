import type { ActivityType, DateSpan } from "@/lib/activities";
import type { DataSource } from "@/lib/data-source";
import type { RoleId } from "@/lib/roles";
import { isUuid } from "@/lib/uuid";
export type ActivityDraftFields = { type: ActivityType; title: string; description: string; placeName: string; spans: DateSpan[]; materialLink: string; notes: string; referenceLink: string };
export type ActivityDraft = { version: 3; idempotencyKey: string; savedAt: string; fields: ActivityDraftFields };
export function activityDraftStorageKey(roleId: RoleId, activityId?: string, dataSource: DataSource = "demo") { return `rhino:borrador-actividad:v3:${dataSource}:${roleId}:${activityId ?? "nueva"}`; }
export function createIdempotencyKey() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const tail = `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`
    .replace(/[^a-f0-9]/g, "")
    .padEnd(12, "0")
    .slice(0, 12);
  return `00000000-0000-4000-8000-${tail}`;
}
export function parseActivityDraft(raw: string | null): ActivityDraft | null { if (!raw) return null; try { const value = JSON.parse(raw) as ActivityDraft; return value.version === 3 && isUuid(value.idempotencyKey) && Array.isArray(value.fields?.spans) ? value : null; } catch { return null; } }
export function readActivityDraft(storage: Storage, key: string) { const value = parseActivityDraft(storage.getItem(key)); if (!value) storage.removeItem(key); return value; }
export function writeActivityDraft(storage: Storage, key: string, draft: ActivityDraft) { storage.setItem(key, JSON.stringify(draft)); }
