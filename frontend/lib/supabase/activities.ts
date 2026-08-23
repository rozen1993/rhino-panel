import "server-only";

import type { ActivityType, DateSpan } from "@/lib/activities";
import type {
  AuditEntry,
  SimulatedActivity,
} from "@/lib/activity-simulation";
import type { Json } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/uuid";

type ActivityRow = Awaited<
  ReturnType<typeof fetchActivityRows>
>[number];

async function fetchActivityRows(id?: string) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("activities")
    .select("*")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  if (id) query = query.eq("id", id);
  const { data, error } = await query;
  if (error) throw new Error(`No se pudieron leer las actividades: ${error.message}`);
  return data;
}

function detailText(value: Json) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const entry = value as Record<string, Json | undefined>;
  const candidate = entry.detalle ?? entry.estado;
  return typeof candidate === "string" ? candidate : undefined;
}

export async function listSupabaseActivities(): Promise<SimulatedActivity[]> {
  const rows = await fetchActivityRows();
  return hydrateActivities(rows);
}

export async function getSupabaseActivity(
  id: string,
): Promise<SimulatedActivity | null> {
  if (!isUuid(id)) return null;
  const rows = await fetchActivityRows(id);
  const hydrated = await hydrateActivities(rows);
  return hydrated[0] ?? null;
}

async function hydrateActivities(rows: ActivityRow[]) {
  if (!rows.length) return [];
  const supabase = await createSupabaseServerClient();
  const ids = rows.map((row) => row.id);
  const [{ data: spans, error: spansError }, { data: audits, error: auditsError }] =
    await Promise.all([
      supabase
        .from("activity_date_spans")
        .select("*")
        .in("activity_id", ids)
        .order("position"),
      supabase
        .from("audit_events")
        .select("*")
        .in("activity_id", ids)
        .order("created_at", { ascending: false }),
    ]);
  if (spansError || auditsError) {
    throw new Error(
      `No se pudo completar el detalle: ${spansError?.message ?? auditsError?.message}`,
    );
  }

  return rows.map((row): SimulatedActivity => {
    const activitySpans: DateSpan[] = (spans ?? [])
      .filter((span) => span.activity_id === row.id)
      .map((span) => ({ start: span.start_date, end: span.end_date }));
    const audit: AuditEntry[] = (audits ?? [])
      .filter((entry) => entry.activity_id === row.id)
      .map((entry) => ({
        action: entry.action,
        actor: {
          accountId: entry.actor_id,
          name: entry.actor_name,
          roleId: entry.actor_role,
          roleLabel:
            entry.actor_role === "admin"
              ? "Admin"
              : entry.actor_role === "burson"
                ? "Burson"
                : "Operario",
        },
        moment: entry.created_at,
        detail: detailText(entry.detail),
      }));
    return {
      id: row.id,
      type: row.type as ActivityType,
      title: row.title,
      responsible: row.responsible_name,
      responsibleAccountId: row.responsible_id,
      status: row.status,
      origin: row.origin,
      spans: activitySpans,
      description: row.description,
      place: row.place,
      materialLink: row.material_link,
      operatorOpinion: row.operator_opinion,
      referenceLink: row.reference_link,
      createdByAccountId: row.created_by,
      createdByRoleId: row.created_by_role,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      version: row.version,
      idempotencyKey: row.idempotency_key ?? undefined,
      threadOpenedAt: row.thread_opened_at ?? undefined,
      deliveredAt: row.delivered_at ?? undefined,
      deletedAt: row.deleted_at ?? undefined,
      deletionReason: row.deletion_reason ?? undefined,
      thread: [],
      audit,
    };
  });
}
