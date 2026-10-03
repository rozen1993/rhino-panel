import type { AunorActivityRow, AunorWorkspace } from "./aunor";
import type { ContractPeriod } from "./contract-progress";
import { annualReportingCycle, contractReferences, contractStartMonth, referenceMonthlyPeriod } from "./contract-reference";

/** Request/render-local index. Never cached across accounts or mutable snapshots. */
export function indexContractWorkspace(w: AunorWorkspace) {
  const journeys = new Map<string, AunorWorkspace["journeys"]>();
  const periods = new Map<string, ContractPeriod[]>();
  const byId = new Map<string, ContractPeriod>();
  const activities = new Map<string, Map<string, AunorActivityRow>>();
  for (const j of w.journeys) {
    const group = journeys.get(j.activity_id) ?? [];
    group.push(j); journeys.set(j.activity_id, group);
  }
  for (const p of w.contractPeriods ?? []) {
    const group = periods.get(p.service_id) ?? [];
    group.push(p); periods.set(p.service_id, group); byId.set(p.id, p);
  }
  for (const a of w.activities) if (a.service_id) {
    const group = activities.get(a.service_id) ?? new Map<string, AunorActivityRow>();
    group.set(a.id, a); activities.set(a.service_id, group);
  }
  return { journeys, periods, byId, activities,
    replaced: new Set(w.replacements.filter(r => r.is_current).map(r => r.original_activity_id)),
    monthPeriods: new Map<string, ContractPeriod | undefined>() };
}
export type ContractIndex = ReturnType<typeof indexContractWorkspace>;

/** Read-only reporting reference. Never insert these IDs or change stored dates. */
export function contractPeriodForMonth(w: AunorWorkspace, serviceId: string, month: string, index?: ContractIndex): ContractPeriod | undefined {
  const key = `${serviceId}:${month}`;
  if (index?.monthPeriods.has(key)) return index.monthPeriods.get(key);
  const result = resolveMonth(w, serviceId, month, index);
  index?.monthPeriods.set(key, result);
  return result;
}
function resolveMonth(w: AunorWorkspace, serviceId: string, month: string, index?: ContractIndex): ContractPeriod | undefined {
  if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month)) return;
  const stored = index ? index.periods.get(serviceId) ?? [] : (w.contractPeriods ?? []).filter(p => p.service_id === serviceId);
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
export function activityContractPeriod(w: AunorWorkspace, activity: AunorActivityRow, index?: ContractIndex): ContractPeriod | undefined {
  if (!activity.service_id) return;
  if (activity.contract_period_id) {
    const assigned = index ? index.byId.get(activity.contract_period_id) : w.contractPeriods?.find(p => p.id === activity.contract_period_id);
    return assigned?.service_id === activity.service_id ? assigned : undefined;
  }
  const ranges = activity.delivery_due_on
    ? [{start_date: activity.delivery_due_on, end_date: activity.delivery_due_on}]
    : index ? index.journeys.get(activity.id) ?? [] : w.journeys.filter(j => j.activity_id === activity.id);
  if (!ranges.length || ranges.some(r => !validDate(r.start_date) || !validDate(r.end_date) || r.start_date > r.end_date)) return;
  const start = ranges.map(r => r.start_date).sort()[0];
  const end = ranges.map(r => r.end_date).sort().at(-1)!;
  const period = contractPeriodForMonth(w, activity.service_id, start.slice(0,7), index);
  return period && start >= period.starts_on && end <= period.ends_on ? period : undefined;
}
