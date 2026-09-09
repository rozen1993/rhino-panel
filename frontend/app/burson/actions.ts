"use server";
import type { ActivityDraftFields } from "@/lib/activity-draft";
import type { BursonRequestView } from "@/lib/burson";
export type BursonRequestServerResult = { ok: true; request: BursonRequestView; replayed: boolean } | { ok: false; error: string };
// Keep the old action signature so cached clients fail closed.
export async function createSupabaseBursonRequestAction(...input: [ActivityDraftFields, string]): Promise<BursonRequestServerResult> {
  void input;
  return { ok: false, error: "El canal Burson está retirado." };
}
