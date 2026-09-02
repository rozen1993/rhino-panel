import type { ActivityType, DateSpan } from "@/lib/activities";
import type { InternalStatus } from "@/components/status-pill";
import type { SimulatedActivity } from "@/lib/activity-simulation";

/**
 * Safe projection exposed by the Burson module. It deliberately omits actor
 * identifiers, optimistic-lock versions, idempotency data, deletion metadata,
 * operator opinion, conversation state and audit events.
 */
export type BursonRequestView = {
  id: string;
  type: ActivityType;
  title: string;
  responsible: string;
  status: InternalStatus;
  spans: DateSpan[];
  description: string;
  place: string;
  materialLink: string;
  referenceLink: string;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
};

export function bursonRequestViewFromActivity(
  item: SimulatedActivity,
): BursonRequestView {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    responsible: item.responsible,
    status: item.status,
    spans: item.spans,
    description: item.description,
    place: item.place,
    materialLink: item.materialLink,
    referenceLink: item.referenceLink,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    deliveredAt: item.deliveredAt,
  };
}
