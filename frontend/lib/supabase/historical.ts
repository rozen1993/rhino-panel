import "server-only";

import type { DateSpan } from "@/lib/activities";
import {
  activityOverlapsYear,
  compareHistoricalActivities,
  historicalYearBounds,
  type HistoricalActivity,
} from "@/lib/historical";
import type { Database } from "@/lib/supabase/database.types";
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

type HistoricalActivityRow = Pick<
  Database["public"]["Tables"]["activities"]["Row"],
  | "id"
  | "version"
  | "type"
  | "title"
  | "responsible_name"
  | "status"
  | "origin"
  | "description"
  | "place"
  | "material_link"
  | "operator_opinion"
>;

type HistoricalSpanRow = Pick<
  Database["public"]["Tables"]["activity_date_spans"]["Row"],
  "id" | "activity_id" | "position" | "start_date" | "end_date" | "place"
>;

type HistoricalVersionRow = Pick<HistoricalActivityRow, "id" | "version">;
type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

const historicalReadAttempts = 3;

async function locateCandidateIds(
  supabase: SupabaseServerClient,
  bounds: ReturnType<typeof historicalYearBounds>,
) {
  const candidateIds = new Set<string>();
  let cursor = 0;

  for (;;) {
    const { data, error } = await supabase
      .from("activity_date_spans")
      .select("id, activity_id, position, start_date, end_date, place")
      .lte("start_date", bounds.end)
      .gte("end_date", bounds.start)
      .gt("id", cursor)
      .order("id", { ascending: true })
      .limit(supabasePageSize);
    if (error) {
      throw new Error(
        `No se pudieron localizar las actividades del año: ${error.message}`,
      );
    }
    const page = (data ?? []) as HistoricalSpanRow[];
    if (!page.length) break;
    page.forEach((span) => candidateIds.add(span.activity_id));
    cursor = advanceNumericCursor(page, cursor, "jornadas del Histórico");
  }

  return [...candidateIds];
}

async function fetchHistoricalActivityRows(
  supabase: SupabaseServerClient,
  candidateIds: readonly string[],
) {
  const pages = await mapWithConcurrency(
    chunkValues(candidateIds, supabaseFilterBatchSize),
    supabaseBatchConcurrency,
    async (ids) => {
      const batchRows: HistoricalActivityRow[] = [];
      let cursor: string | null = null;
      for (;;) {
        let query = supabase
          .from("activities")
          .select(
            "id, version, type, title, responsible_name, status, origin, description, place, material_link, operator_opinion",
          )
          .in("id", ids)
          .is("deleted_at", null);
        if (cursor !== null) query = query.gt("id", cursor);
        const { data, error } = await query
          .order("id", { ascending: true })
          .limit(supabasePageSize);
        if (error) {
          throw new Error(
            `No se pudieron leer las actividades del Histórico: ${error.message}`,
          );
        }
        const page = (data ?? []) as HistoricalActivityRow[];
        if (!page.length) break;
        batchRows.push(...page);
        cursor = advanceStringCursor(
          page,
          cursor,
          "actividades del Histórico",
        );
      }
      return batchRows;
    },
  );
  return pages.flat();
}

async function fetchHistoricalSpans(
  supabase: SupabaseServerClient,
  activeIds: readonly string[],
) {
  const pages = await mapWithConcurrency(
    chunkValues(activeIds, supabaseFilterBatchSize),
    supabaseBatchConcurrency,
    async (ids) => {
      const batchRows: HistoricalSpanRow[] = [];
      let cursor = 0;
      // El max_rows remoto puede ser menor que supabasePageSize. Solo una página
      // vacía demuestra que el keyset quedó agotado sin omitir filas.
      for (;;) {
        const { data, error } = await supabase
          .from("activity_date_spans")
          .select("id, activity_id, position, start_date, end_date, place")
          .in("activity_id", ids)
          .gt("id", cursor)
          .order("id", { ascending: true })
          .limit(supabasePageSize);
        if (error) {
          throw new Error(
            `No se pudieron completar las jornadas del Histórico: ${error.message}`,
          );
        }
        const page = (data ?? []) as HistoricalSpanRow[];
        if (!page.length) break;
        batchRows.push(...page);
        cursor = advanceNumericCursor(page, cursor, "jornadas del Histórico");
      }
      return batchRows;
    },
  );
  return pages.flat();
}

async function fetchCurrentVersions(
  supabase: SupabaseServerClient,
  activeIds: readonly string[],
) {
  const pages = await mapWithConcurrency(
    chunkValues(activeIds, supabaseFilterBatchSize),
    supabaseBatchConcurrency,
    async (ids) => {
      const batchRows: HistoricalVersionRow[] = [];
      let cursor: string | null = null;
      for (;;) {
        let query = supabase
          .from("activities")
          .select("id, version")
          .in("id", ids)
          .is("deleted_at", null);
        if (cursor !== null) query = query.gt("id", cursor);
        const { data, error } = await query
          .order("id", { ascending: true })
          .limit(supabasePageSize);
        if (error) {
          throw new Error(
            `No se pudo consolidar la versión del Histórico: ${error.message}`,
          );
        }
        const page = (data ?? []) as HistoricalVersionRow[];
        if (!page.length) break;
        batchRows.push(...page);
        cursor = advanceStringCursor(
          page,
          cursor,
          "versiones del Histórico",
        );
      }
      return batchRows;
    },
  );
  return pages.flat();
}

function versionsRemainStable(
  rows: readonly HistoricalActivityRow[],
  currentVersions: readonly HistoricalVersionRow[],
) {
  const versionsById = new Map(
    currentVersions.map((row) => [row.id, row.version]),
  );
  return (
    versionsById.size === rows.length &&
    rows.every((row) => versionsById.get(row.id) === row.version)
  );
}

function buildHistoricalActivities(
  rows: readonly HistoricalActivityRow[],
  spanRows: readonly HistoricalSpanRow[],
  year: number,
) {
  const spansByActivity = new Map<string, HistoricalSpanRow[]>();
  spanRows.forEach((span) => {
    const current = spansByActivity.get(span.activity_id) ?? [];
    current.push(span);
    spansByActivity.set(span.activity_id, current);
  });

  return rows
    .map((row): HistoricalActivity => {
      const spans: DateSpan[] = (spansByActivity.get(row.id) ?? [])
        .sort(
          (left, right) =>
            left.position - right.position || left.id - right.id,
        )
        .map((span) => ({ start: span.start_date, end: span.end_date, place: span.place }));
      return {
        id: row.id,
        type: row.type,
        title: row.title,
        responsible: row.responsible_name,
        status: row.status,
        origin: row.origin,
        spans,
        description: row.description,
        place: row.place,
        materialLink: row.material_link,
        operatorOpinion: row.operator_opinion,
      };
    })
    .filter((activity) => activityOverlapsYear(activity, year))
    .sort(compareHistoricalActivities);
}

async function readHistoricalAttempt(
  supabase: SupabaseServerClient,
  year: number,
  bounds: ReturnType<typeof historicalYearBounds>,
): Promise<HistoricalActivity[] | null> {
  const candidateIds = await locateCandidateIds(supabase, bounds);
  if (!candidateIds.length) return [];

  const rows = await fetchHistoricalActivityRows(supabase, candidateIds);
  if (!rows.length) return [];

  const activeIds = rows.map((row) => row.id);
  const spanRows = await fetchHistoricalSpans(supabase, activeIds);

  // Toda mutación de jornadas incrementa activities.version en la misma
  // transacción. Revalidarla después de paginar impide combinar dos versiones.
  const currentVersions = await fetchCurrentVersions(supabase, activeIds);
  if (!versionsRemainStable(rows, currentVersions)) return null;

  return buildHistoricalActivities(rows, spanRows, year);
}

export async function listSupabaseHistoricalActivities(
  year: number,
): Promise<HistoricalActivity[]> {
  const bounds = historicalYearBounds(year);
  const supabase = await createSupabaseServerClient();

  for (let attempt = 0; attempt < historicalReadAttempts; attempt += 1) {
    const result = await readHistoricalAttempt(supabase, year, bounds);
    if (result !== null) return result;
  }

  throw new Error(
    `El Histórico cambió durante la lectura y no pudo consolidarse tras ${historicalReadAttempts} intentos.`,
  );
}
