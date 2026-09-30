import type { AunorWorkspace } from "./aunor";
import { contractProgress } from "./contract-progress";
import { activityContractPeriod } from "./contract-calendar";
import { safeMaterialUrl } from "./external-link";

export type ContractRelationInput = {
  command: "relation";
  activityId: string;
  requestId: string;
  activityVersion: number;
  publicationVersion: number;
  serviceId: string;
  periodId: string | null;
  summary: string;
  notPerformedReason: string;
  confirmed: boolean;
};
export type CompactReplacementInput = {
  command: "replacement";
  activityId: string;
  requestId: string;
  activityVersion: number;
  originalId: string;
  agreementId: string;
  reason: string;
  channel: string;
  contactedAt: string;
  requesterDeclared: string;
  evidenceLink: string;
};
export type AdminActivityInput =
  | ContractRelationInput
  | CompactReplacementInput;

export function validAdminActivityInput(p: AdminActivityInput): boolean {
  if (
    !p ||
    !["relation", "replacement"].includes(p.command) ||
    typeof p.activityId !== "string" ||
    !/^[a-z0-9-]{1,100}$/i.test(p.activityId) ||
    !Number.isInteger(p.activityVersion) ||
    p.activityVersion < 1
  )
    return false;
  const text = (v: unknown, min: number, max: number) =>
    typeof v === "string" && v.trim().length >= min && v.trim().length <= max;
  if (p.command === "relation")
    return (
      p.confirmed === true &&
      Number.isInteger(p.publicationVersion) &&
      p.publicationVersion >= 0 &&
      text(p.summary, 1, 5000) &&
      text(p.notPerformedReason, 0, 3000) &&
      (p.serviceId === "" || /^[a-z-]{1,60}$/.test(p.serviceId)) &&
      (p.periodId === null || text(p.periodId, 1, 100)) &&
      (!p.periodId || Boolean(p.serviceId))
    );
  return (
    text(p.originalId, 1, 100) &&
    p.originalId !== p.activityId &&
    text(p.reason, 2, 3000) &&
    text(p.agreementId, 0, 100) &&
    text(p.evidenceLink, 0, 3000) &&
    (!p.evidenceLink || Boolean(safeMaterialUrl(p.evidenceLink))) &&
    (Boolean(p.agreementId) ||
      (["Llamada", "Reunión", "Acuerdo verbal"].includes(p.channel) &&
        text(p.requesterDeclared, 2, 180) &&
        Number.isFinite(Date.parse(p.contactedAt))))
  );
}

/** Derive preview using the same eligibility rules as the client contract. Never add twice. */
export function previewContractRelation(
  w: AunorWorkspace,
  id: string,
  serviceId: string,
  periodId: string,
  summary: string,
) {
  const candidate = w.activities.find(a => a.id === id);
  const period = periodId ? w.contractPeriods?.find(
    (p) => p.id === periodId && p.service_id === serviceId,
  ) : candidate ? activityContractPeriod(w, {...candidate, service_id: serviceId, contract_period_id: null}) : undefined;
  if (!period) return null;
  const before = contractProgress(w, serviceId, period);
  const after = contractProgress(
    {
      ...w,
      activities: w.activities.map((a) =>
        a.id === id
          ? {
              ...a,
              service_id: serviceId,
              contract_period_id: periodId || null,
              summary,
            }
          : a,
      ),
    },
    serviceId,
    period,
  );
  return {
    before: before.count,
    after: after.count,
    target: period.target,
    label: period,
    delta: after.count - before.count,
  };
}
