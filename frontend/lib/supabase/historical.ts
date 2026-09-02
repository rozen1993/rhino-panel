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
  | "type"
  | "title"
  | "responsible_name"
  | "status"
  | "origin"
  | "description"
  | "material_link"
  | "operator_opinion"
>;

type HistoricalSpanRow = Pick<
  Database["public"]["Tables"]["activity_date_spans"]["Row"],
  "id" | "activity_id" | "position" | "start_date" | "end_date"
>;

export async function listSupabaseHistoricalActivities(
  year: number,
): Promise<HistoricalActivity[]> {
  const bounds = historicalYearBounds(year);
  const supabase = await createSupabaseServerClient();
  const candidateIds = new Set<string>();

  let cursor = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("activity_date_spans")
      .select("id, activity_id, position, start_date, end_date")
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

  if (!candidateIds.size) return [];

  const activityPages = await mapWithConcurrency(
    chunkValues([...candidateIds], supabaseFilterBatchSize),
    supabaseBatchConcurrency,
    async (ids) => {
      const batchRows: HistoricalActivityRow[] = [];
      let activityCursor: string | null = null;
      for (;;) {
        let query = supabase
          .from("activities")
          .select(
            "id, type, title, responsible_name, status, origin, description, material_link, operator_opinion",
          )
          .in("id", ids)
          .is("deleted_at", null);
        if (activityCursor !== null) {
          query = query.gt("id", activityCursor);
        }
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
        activityCursor = advanceStringCursor(
          page,
          activityCursor,
          "actividades del Histórico",
        );
      }
      return batchRows;
    },
  );
  const rows = activityPages.flat();

  if (!rows.length) return [];

  const activeIds = rows.map((row) => row.id);
  const spanPages = await mapWithConcurrency(
    chunkValues(activeIds, supabaseFilterBatchSize),
    supabaseBatchConcurrency,
    async (ids) => {
      const batchRows: HistoricalSpanRow[] = [];
      let spanCursor = 0;
      // El max_rows remoto puede ser menor que supabasePageSize. Solo una página
      // vacía demuestra que el keyset quedó agotado sin omitir filas.
      for (;;) {
        const { data, error } = await supabase
          .from("activity_date_spans")
          .select("id, activity_id, position, start_date, end_date")
          .in("activity_id", ids)
          .gt("id", spanCursor)
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
        spanCursor = advanceNumericCursor(
          page,
          spanCursor,
          "jornadas del Histórico",
        );
      }
      return batchRows;
    },
  );
  const spanRows = spanPages.flat();

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
        .map((span) => ({ start: span.start_date, end: span.end_date }));
      return {
        id: row.id,
        type: row.type,
        title: row.title,
        responsible: row.responsible_name,
        status: row.status,
        origin: row.origin,
        spans,
        description: row.description,
        materialLink: row.material_link,
        operatorOpinion: row.operator_opinion,
      };
    })
    .filter((activity) => activityOverlapsYear(activity, year))
    .sort(compareHistoricalActivities);
}
