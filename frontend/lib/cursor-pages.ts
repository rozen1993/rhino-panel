export async function collectCursorPages<T>(
  fetchPage: (last: T | undefined) => PromiseLike<{ data: T[] | null; error: unknown; count?: number | null }>,
  key: (row: T) => string,
) {
  const rows: T[] = [];
  let last: T | undefined;
  const seen = new Set<string>();
  while (rows.length <= 50_000) {
    const { data, error, count } = await fetchPage(last);
    if (error) throw new Error("No se pudo cargar la información. Vuelve a intentarlo.");
    if (!data?.length) return rows;
    for (const row of data) {
      const value = key(row);
      if (seen.has(value)) throw new Error("La paginación no pudo avanzar.");
      seen.add(value); rows.push(row);
    }
    last = data.at(-1);
    // Exact count of this cursor's remaining rows, not an assumed API page cap.
    // A short server-capped page must still continue when more rows exist.
    if (rows.length > 50_000) break;
    if (typeof count === "number" && count >= 0 && count === data.length) return rows;
  }
  throw new Error("El espacio supera el límite de lectura segura. Contacta al administrador.");
}
