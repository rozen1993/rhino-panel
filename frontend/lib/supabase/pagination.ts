export const supabasePageSize = 1000;

// Cien UUID mantienen los filtros `in` de PostgREST lejos del límite habitual
// de URL de varios proxies, sin depender del `max_rows` remoto.
export const supabaseFilterBatchSize = 100;
export const supabaseBatchConcurrency = 4;

export function chunkValues<T>(values: readonly T[], size: number) {
  if (!Number.isInteger(size) || size < 1)
    throw new Error("El tamaño del lote debe ser un entero positivo.");
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

export async function mapWithConcurrency<T, R>(
  values: readonly T[],
  concurrency: number,
  task: (value: T) => Promise<R>,
) {
  if (!Number.isInteger(concurrency) || concurrency < 1)
    throw new Error("La concurrencia debe ser un entero positivo.");
  const results = new Array<R>(values.length);
  let nextIndex = 0;

  async function worker() {
    for (;;) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= values.length) return;
      results[index] = await task(values[index]);
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(concurrency, values.length) },
      () => worker(),
    ),
  );
  return results;
}

export function advanceNumericCursor<T extends { id: number }>(
  page: readonly T[],
  cursor: number,
  label: string,
) {
  const next = page.at(-1)?.id ?? cursor;
  if (page.length && next <= cursor) {
    throw new Error(`La paginación de ${label} no pudo avanzar.`);
  }
  return next;
}

export function advanceStringCursor<T extends { id: string }>(
  page: readonly T[],
  cursor: string | null,
  label: string,
) {
  const next = page.at(-1)?.id ?? cursor;
  if (page.length && (!next || (cursor !== null && next <= cursor))) {
    throw new Error(`La paginación de ${label} no pudo avanzar.`);
  }
  return next;
}
