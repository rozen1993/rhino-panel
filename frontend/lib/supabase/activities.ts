import "server-only";

import type { ActivityType, DateSpan } from "@/lib/activities";
import type {
  AuditEntry,
  SimulatedActivity,
  ThreadMessage,
} from "@/lib/activity-simulation";
import type { BursonRequestView } from "@/lib/burson";
import type { Database, Json } from "@/lib/supabase/database.types";
import {
  advanceNumericCursor,
  advanceStringCursor,
  chunkValues,
  mapWithConcurrency,
  supabaseBatchConcurrency,
  supabaseFilterBatchSize,
  supabasePageSize,
} from "@/lib/supabase/pagination";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/uuid";

type ActivityRow = Database["public"]["Tables"]["activities"]["Row"];
type ActivitySpanRow =
  Database["public"]["Tables"]["activity_date_spans"]["Row"];
type ActivityAuditRow =
  Database["public"]["Tables"]["audit_events"]["Row"];
type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

type BursonRequestRow = Pick<
  Database["public"]["Tables"]["activities"]["Row"],
  | "id"
  | "type"
  | "title"
  | "responsible_name"
  | "status"
  | "description"
  | "place"
  | "material_link"
  | "reference_link"
  | "created_at"
  | "updated_at"
  | "delivered_at"
>;
type BursonSpanRow = Pick<
  Database["public"]["Tables"]["activity_date_spans"]["Row"],
  "id" | "activity_id" | "position" | "start_date" | "end_date"
>;
type ActivityMessageRow = Pick<
  Database["public"]["Tables"]["activity_messages"]["Row"],
  | "id"
  | "activity_id"
  | "author_id"
  | "author_name"
  | "author_role"
  | "body"
  | "opens_thread"
  | "version"
  | "created_at"
  | "edited_at"
>;

type DeletionActorRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "display_name" | "role"
>;

type ActivityScope = "active" | "trashed";

function compareIsoDescending(left: string | null, right: string | null) {
  return (right ?? "").localeCompare(left ?? "");
}

function compareActivityRows(scope: ActivityScope) {
  return (left: ActivityRow, right: ActivityRow) =>
    compareIsoDescending(
      scope === "trashed" ? left.deleted_at : left.updated_at,
      scope === "trashed" ? right.deleted_at : right.updated_at,
    ) || left.id.localeCompare(right.id);
}

async function fetchActivityRows(
  id?: string,
  scope: ActivityScope = "active",
) {
  const supabase = await createSupabaseServerClient();
  const query = (cursor?: string) => {
    let request = supabase
      .from("activities")
      .select("*");
    request =
      scope === "active"
        ? request.is("deleted_at", null)
        : request.not("deleted_at", "is", null);
    if (id) return request.eq("id", id);
    if (cursor) request = request.gt("id", cursor);
    return request.order("id", { ascending: true });
  };

  if (id) {
    const { data, error } = await query().limit(1);
    if (error)
      throw new Error(`No se pudo leer la actividad: ${error.message}`);
    return data ?? [];
  }

  const rows: ActivityRow[] = [];
  let cursor: string | null = null;
  for (;;) {
    const { data, error } = await query(cursor ?? undefined).limit(
      supabasePageSize,
    );
    if (error)
      throw new Error(
        `No se pudieron leer las actividades: ${error.message}`,
      );
    const page = (data ?? []) as ActivityRow[];
    if (!page.length) break;
    rows.push(...page);
    cursor = advanceStringCursor(page, cursor, "actividades");
  }
  return rows.sort(compareActivityRows(scope));
}

async function fetchBursonRequestRows(id?: string) {
  const supabase = await createSupabaseServerClient();
  const query = (cursor?: string) => {
    let request = supabase
      .from("activities")
      .select(
        "id, type, title, responsible_name, status, description, place, material_link, reference_link, created_at, updated_at, delivered_at",
      )
      .eq("origin", "burson")
      .is("deleted_at", null);
    if (id) return request.eq("id", id);
    if (cursor) request = request.gt("id", cursor);
    return request.order("id", { ascending: true });
  };

  if (id) {
    const { data, error } = await query().eq("id", id).limit(1);
    if (error)
      throw new Error(
        `No se pudo leer el encargo Burson: ${error.message}`,
      );
    return (data ?? []) as BursonRequestRow[];
  }

  const rows: BursonRequestRow[] = [];
  let cursor: string | null = null;
  for (;;) {
    const { data, error } = await query(cursor ?? undefined).limit(
      supabasePageSize,
    );
    if (error)
      throw new Error(
        `No se pudieron leer los encargos Burson: ${error.message}`,
      );
    const page = (data ?? []) as BursonRequestRow[];
    if (!page.length) break;
    rows.push(...page);
    cursor = advanceStringCursor(page, cursor, "encargos Burson");
  }
  return rows.sort(
    (left, right) =>
      compareIsoDescending(left.updated_at, right.updated_at) ||
      left.id.localeCompare(right.id),
  );
}

function detailText(value: Json) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const entry = value as Record<string, Json | undefined>;
  if (typeof entry.mensaje_id === "string")
    return `Mensaje ${entry.mensaje_id}`;
  const candidate =
    entry.detalle ?? entry.motivo ?? entry.estado ?? entry.responsable;
  return typeof candidate === "string" ? candidate : undefined;
}

export async function listSupabaseActivities(): Promise<SimulatedActivity[]> {
  const rows = await fetchActivityRows();
  return hydrateActivities(rows, "summary");
}

export async function getSupabaseActivity(
  id: string,
): Promise<SimulatedActivity | null> {
  if (!isUuid(id)) return null;
  const rows = await fetchActivityRows(id);
  const hydrated = await hydrateActivities(rows, "complete");
  return hydrated[0] ?? null;
}

export async function listSupabaseTrashedActivities(): Promise<
  SimulatedActivity[]
> {
  return hydrateActivities(
    await fetchActivityRows(undefined, "trashed"),
    "summary",
  );
}

export async function listSupabaseBursonRequests(): Promise<
  BursonRequestView[]
> {
  return hydrateBursonRequests(await fetchBursonRequestRows());
}

export async function getSupabaseBursonRequest(
  id: string,
): Promise<BursonRequestView | null> {
  if (!isUuid(id)) return null;
  const hydrated = await hydrateBursonRequests(await fetchBursonRequestRows(id));
  return hydrated[0] ?? null;
}

async function hydrateBursonRequests(
  rows: BursonRequestRow[],
): Promise<BursonRequestView[]> {
  if (!rows.length) return [];
  const supabase = await createSupabaseServerClient();
  const ids = rows.map((row) => row.id);
  const spanPages = await mapWithConcurrency(
    chunkValues(ids, supabaseFilterBatchSize),
    supabaseBatchConcurrency,
    async (batchIds) => {
      const batchRows: BursonSpanRow[] = [];
      let cursor = 0;
      for (;;) {
        const { data, error } = await supabase
          .from("activity_date_spans")
          .select("id, activity_id, position, start_date, end_date")
          .in("activity_id", batchIds)
          .gt("id", cursor)
          .order("id", { ascending: true })
          .limit(supabasePageSize);
        if (error)
          throw new Error(
            `No se pudieron leer las jornadas Burson: ${error.message}`,
          );
        const page = (data ?? []) as BursonSpanRow[];
        if (!page.length) break;
        batchRows.push(...page);
        cursor = advanceNumericCursor(page, cursor, "jornadas Burson");
      }
      return batchRows;
    },
  );
  const spans = spanPages.flat();
  const spansByActivity = new Map<string, BursonSpanRow[]>();
  spans.forEach((span) => {
    const current = spansByActivity.get(span.activity_id) ?? [];
    current.push(span);
    spansByActivity.set(span.activity_id, current);
  });

  return rows.map((row) => ({
    id: row.id,
    type: row.type as ActivityType,
    title: row.title,
    responsible: row.responsible_name,
    status: row.status,
    spans: (spansByActivity.get(row.id) ?? [])
      .sort(
        (left, right) =>
          left.position - right.position || left.id - right.id,
      )
      .map((span) => ({ start: span.start_date, end: span.end_date })),
    description: row.description,
    place: row.place,
    materialLink: row.material_link,
    referenceLink: row.reference_link,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deliveredAt: row.delivered_at ?? undefined,
  }));
}

function roleLabel(role: Database["public"]["Enums"]["app_role"]) {
  return role === "admin" ? "Admin" : role === "burson" ? "Burson" : "Operario";
}

async function fetchActivitySpans(
  supabase: SupabaseServerClient,
  ids: string[],
) {
  const pages = await mapWithConcurrency(
    chunkValues(ids, supabaseFilterBatchSize),
    supabaseBatchConcurrency,
    async (batchIds) => {
      const rows: ActivitySpanRow[] = [];
      let cursor = 0;
      for (;;) {
        const { data, error } = await supabase
          .from("activity_date_spans")
          .select("*")
          .in("activity_id", batchIds)
          .gt("id", cursor)
          .order("id", { ascending: true })
          .limit(supabasePageSize);
        if (error)
          throw new Error(
            `No se pudieron leer las jornadas: ${error.message}`,
          );
        const page = (data ?? []) as ActivitySpanRow[];
        if (!page.length) break;
        rows.push(...page);
        cursor = advanceNumericCursor(page, cursor, "jornadas");
      }
      return rows;
    },
  );
  return pages.flat();
}

async function fetchActivityAudits(
  supabase: SupabaseServerClient,
  ids: string[],
) {
  const pages = await mapWithConcurrency(
    chunkValues(ids, supabaseFilterBatchSize),
    supabaseBatchConcurrency,
    async (batchIds) => {
      const rows: ActivityAuditRow[] = [];
      let cursor = 0;
      for (;;) {
        const { data, error } = await supabase
          .from("audit_events")
          .select("*")
          .in("activity_id", batchIds)
          .gt("id", cursor)
          .order("id", { ascending: true })
          .limit(supabasePageSize);
        if (error)
          throw new Error(
            `No se pudo leer la auditoria: ${error.message}`,
          );
        const page = (data ?? []) as ActivityAuditRow[];
        if (!page.length) break;
        rows.push(...page);
        cursor = advanceNumericCursor(page, cursor, "auditoria de actividades");
      }
      return rows;
    },
  );
  return pages.flat();
}

async function fetchActivityMessages(
  supabase: SupabaseServerClient,
  ids: string[],
) {
  const pages = await mapWithConcurrency(
    chunkValues(ids, supabaseFilterBatchSize),
    supabaseBatchConcurrency,
    async (batchIds) => {
      const rows: ActivityMessageRow[] = [];
      let cursor: string | null = null;
      for (;;) {
        let query = supabase
          .from("activity_messages")
          .select(
            "id, activity_id, author_id, author_name, author_role, body, opens_thread, version, created_at, edited_at",
          )
          .in("activity_id", batchIds)
          .is("deleted_at", null);
        if (cursor !== null) query = query.gt("id", cursor);
        const { data, error } = await query
          .order("id", { ascending: true })
          .limit(supabasePageSize);
        if (error)
          throw new Error(
            `No se pudo leer la conversacion: ${error.message}`,
          );
        const page = (data ?? []) as ActivityMessageRow[];
        if (!page.length) break;
        rows.push(...page);
        cursor = advanceStringCursor(page, cursor, "mensajes de actividades");
      }
      return rows;
    },
  );
  return pages.flat();
}

async function fetchDeletionActors(
  supabase: SupabaseServerClient,
  ids: string[],
) {
  if (!ids.length) return [];
  const pages = await mapWithConcurrency(
    chunkValues(ids, supabaseFilterBatchSize),
    supabaseBatchConcurrency,
    async (batchIds) => {
      const rows: DeletionActorRow[] = [];
      let cursor: string | null = null;
      for (;;) {
        let query = supabase
          .from("profiles")
          .select("id, display_name, role")
          .in("id", batchIds);
        if (cursor !== null) query = query.gt("id", cursor);
        const { data, error } = await query
          .order("id", { ascending: true })
          .limit(supabasePageSize);
        if (error)
          throw new Error(
            `No se pudieron leer los responsables de la baja: ${error.message}`,
          );
        const page = (data ?? []) as DeletionActorRow[];
        if (!page.length) break;
        rows.push(...page);
        cursor = advanceStringCursor(page, cursor, "responsables de la baja");
      }
      return rows;
    },
  );
  return pages.flat();
}

function groupByActivity<T extends { activity_id: string }>(rows: T[]) {
  const grouped = new Map<string, T[]>();
  rows.forEach((row) => {
    const current = grouped.get(row.activity_id) ?? [];
    current.push(row);
    grouped.set(row.activity_id, current);
  });
  return grouped;
}

async function hydrateActivities(
  rows: ActivityRow[],
  detailHydration: SimulatedActivity["detailHydration"],
) {
  if (!rows.length) return [];
  const supabase = await createSupabaseServerClient();
  const ids = rows.map((row) => row.id);
  const deletionActorIds = [
    ...new Set(
      rows
        .map((row) => row.deleted_by)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const [spans, audits, messages, deletionActors] = await Promise.all([
    fetchActivitySpans(supabase, ids),
    detailHydration === "complete"
      ? fetchActivityAudits(supabase, ids)
      : Promise.resolve([] as ActivityAuditRow[]),
    detailHydration === "complete"
      ? fetchActivityMessages(supabase, ids)
      : Promise.resolve([] as ActivityMessageRow[]),
    fetchDeletionActors(supabase, deletionActorIds),
  ]);
  const spansByActivity = groupByActivity(spans);
  const auditsByActivity = groupByActivity(audits);
  const messagesByActivity = groupByActivity(messages);
  const deletionActorsById = new Map(
    deletionActors.map((profile) => [profile.id, profile]),
  );

  return rows.map((row): SimulatedActivity => {
    const activitySpans: DateSpan[] = (spansByActivity.get(row.id) ?? [])
      .sort(
        (left, right) =>
          left.position - right.position || left.id - right.id,
      )
      .map((span) => ({ start: span.start_date, end: span.end_date }));
    const audit: AuditEntry[] = (auditsByActivity.get(row.id) ?? [])
      .sort(
        (left, right) =>
          compareIsoDescending(left.created_at, right.created_at) ||
          right.id - left.id,
      )
      .map((entry) => ({
        action: entry.action,
        actor: {
          accountId: entry.actor_id,
          name: entry.actor_name,
          roleId: entry.actor_role,
          roleLabel: roleLabel(entry.actor_role),
        },
        moment: entry.created_at,
        detail: detailText(entry.detail),
      }));
    const thread: ThreadMessage[] = (messagesByActivity.get(row.id) ?? [])
      .sort(
        (left, right) =>
          left.created_at.localeCompare(right.created_at) ||
          left.id.localeCompare(right.id),
      )
      .map((message) => ({
        id: message.id,
        text: message.body,
        author: {
          accountId: message.author_id,
          name: message.author_name,
          roleId: message.author_role,
          roleLabel: roleLabel(message.author_role),
        },
        createdAt: message.created_at,
        version: message.version,
        opensThread: message.opens_thread,
        editedAt: message.edited_at ?? undefined,
      }));
    const deletionActor = row.deleted_by
      ? deletionActorsById.get(row.deleted_by)
      : undefined;
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
      detailHydration,
      createdByAccountId: row.created_by,
      createdByRoleId: row.created_by_role,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      version: row.version,
      idempotencyKey: row.idempotency_key ?? undefined,
      threadOpenedAt: row.thread_opened_at ?? undefined,
      deliveredAt: row.delivered_at ?? undefined,
      deletedAt: row.deleted_at ?? undefined,
      deletedBy:
        row.deleted_by && deletionActor
          ? {
              accountId: deletionActor.id,
              name: deletionActor.display_name,
              roleId: deletionActor.role,
              roleLabel: roleLabel(deletionActor.role),
            }
          : undefined,
      deletionReason: row.deletion_reason ?? undefined,
      thread,
      audit,
    };
  });
}
