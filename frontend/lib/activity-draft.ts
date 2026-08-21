import type { ActivityType, DateSpan } from "@/lib/activities";
import type { RoleId } from "@/lib/roles";
export type ActivityDraftFields = { type: ActivityType; title: string; description: string; placeName: string; spans: DateSpan[]; materialLink: string; notes: string; referenceLink: string };
export type ActivityDraft = { version: 2; idempotencyKey: string; savedAt: string; fields: ActivityDraftFields };
export function activityDraftStorageKey(roleId: RoleId, activityId?: string) { return `rhino:borrador-actividad:v2:${roleId}:${activityId ?? "nueva"}`; }
export function createIdempotencyKey() { return globalThis.crypto?.randomUUID?.() ?? `rhino-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
export function parseActivityDraft(raw: string | null): ActivityDraft | null { if (!raw) return null; try { const value = JSON.parse(raw) as ActivityDraft; return value.version === 2 && Array.isArray(value.fields?.spans) ? value : null; } catch { return null; } }
export function readActivityDraft(storage: Storage, key: string) { const value = parseActivityDraft(storage.getItem(key)); if (!value) storage.removeItem(key); return value; }
export function writeActivityDraft(storage: Storage, key: string, draft: ActivityDraft) { storage.setItem(key, JSON.stringify(draft)); }
