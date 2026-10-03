import type { AunorWorkspace } from "./aunor";
import { activityContractPeriod, contractPeriodForMonth, indexContractWorkspace } from "./contract-calendar";
import { contractProgress } from "./contract-progress";
import { contractReferences } from "./contract-reference";

export function contractOverview(w: AunorWorkspace, month: string) {
  const index = indexContractWorkspace(w);
  const entries = w.services.map(service => {
    const period = contractPeriodForMonth(w, service.id, month, index);
    return { service, period, cadence: period?.cadence ?? contractReferences[service.id]?.cadence,
      progress: contractProgress(w, service.id, period, index) };
  });
  const services = new Set(w.services.map(s => s.id));
  return { entries, replaced: index.replaced,
    needsReview: w.activities.filter(a => a.service_id && services.has(a.service_id) && !a.not_performed_reason && !index.replaced.has(a.id) && !activityContractPeriod(w, a, index)),
    unlinked: w.activities.filter(a => !a.service_id || !services.has(a.service_id)) };
}

/** A real, currently computable delivery, not a fabricated global update time.
 * Publication/creation dates do not establish when delivery happened. */
export function latestContractDelivery(entries: ReturnType<typeof contractOverview>["entries"], cadence: "monthly" | "annual") {
  let latest: { id: string; title: string; service: string; deliveredAt: string; timestamp: number } | undefined;
  for (const entry of entries) if (entry.cadence === cadence) {
    for (const a of entry.progress.delivered) {
      const timestamp = a.delivered_at ? Date.parse(a.delivered_at) : NaN;
      if (Number.isFinite(timestamp) && (!latest || timestamp > latest.timestamp))
        latest = { id: a.id, title: a.title, service: entry.service.label, deliveredAt: a.delivered_at!, timestamp };
    }
  }
  return latest;
}
