import type { AunorActivityRow } from "@/lib/aunor";

export const AUNOR_DELIVERY_WINDOW_MS = 72 * 60 * 60 * 1000;

export function aunorVisibleUntil(activity: AunorActivityRow): number | null {
  if (activity.status !== "Entregada" || !activity.delivered_at) return null;
  const delivered = Date.parse(activity.delivered_at);
  return Number.isFinite(delivered) ? delivered + AUNOR_DELIVERY_WINDOW_MS : null;
}

/** Unknown legacy delivery dates remain in History; never invent an expiry. */
export function isCurrentAunorActivity(activity: AunorActivityRow, now: number): boolean {
  if (activity.status !== "Entregada") return true;
  const until = aunorVisibleUntil(activity);
  return until !== null && now < until;
}
