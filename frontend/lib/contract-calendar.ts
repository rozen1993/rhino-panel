import type { AunorActivityRow, AunorWorkspace } from "./aunor";
import type { ContractPeriod } from "./contract-progress";
import { annualReportingCycle, contractReferences, contractStartMonth, referenceMonthlyPeriod } from "./contract-reference";

/** Read-only reporting reference. Never insert these IDs or change stored dates. */
export function contractPeriodForMonth(w: AunorWorkspace, serviceId: string, month: string): ContractPeriod | undefined {
  if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month)) return;
  const stored = (w.contractPeriods ?? []).filter(p => p.service_id === serviceId);
  const matches = stored.filter(p => p.starts_on.slice(0, 7) <= month && p.ends_on.slice(0, 7) >= month);
  if (matches.length) return matches.length === 1 ? matches[0] : undefined;
  if (month < contractStartMonth) return;
  const ref = contractReferences[serviceId];
  if (!ref) return;
  const range = ref.cadence === "monthly" ? referenceMonthlyPeriod(serviceId, month)
    : month >= annualReportingCycle.starts_on.slice(0,7) && month <= annualReportingCycle.ends_on.slice(0,7)
      ? { ...annualReportingCycle, service_id: serviceId, cadence: ref.cadence, target: ref.target } : null;
  // A partial/different configured range cannot be silently overlaid by a reference.
  if (!range || stored.some(p => p.starts_on <= range.ends_on && p.ends_on >= range.starts_on)) return;
  return { ...range, id: `calendar:${serviceId}:${range.starts_on}`, version: 0 };
}

function validDate(value: string) {
  return /^20\d{2}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value + "T12:00:00Z")) &&
    new Date(value + "T12:00:00Z").toISOString().slice(0,10) === value;
}

/** Explicit assignments win. Missing dates/cross-period work need Admin review. */
export function activityContractPeriod(w: AunorWorkspace, activity: AunorActivityRow): ContractPeriod | undefined {
  if (!activity.service_id) return;
  if (activity.contract_period_id) return w.contractPeriods?.find(p => p.id === activity.contract_period_id && p.service_id === activity.service_id);
  const ranges = activity.delivery_due_on
    ? [{start_date: activity.delivery_due_on, end_date: activity.delivery_due_on}]
    : w.journeys.filter(j => j.activity_id === activity.id);
  if (!ranges.length || ranges.some(r => !validDate(r.start_date) || !validDate(r.end_date) || r.start_date > r.end_date)) return;
  const start = ranges.map(r => r.start_date).sort()[0];
  const end = ranges.map(r => r.end_date).sort().at(-1)!;
  const period = contractPeriodForMonth(w, activity.service_id, start.slice(0,7));
  return period && start >= period.starts_on && end <= period.ends_on ? period : undefined;
}
