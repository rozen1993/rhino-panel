export async function collectCursorPages<T>(
  fetchPage: (last: T | undefined) => PromiseLike<{ data: T[] | null; error: unknown }>,
  key: (row: T) => string,
) {
  const rows: T[] = [];
  let last: T | undefined;
  const seen = new Set<string>();
  while (rows.length <= 50_000) {
    const { data, error } = await fetchPage(last);
    if (error) throw new Error("No se pudo cargar la información. Vuelve a intentarlo.");
    if (!data?.length) return rows;
    for (const row of data) {
      const value = key(row);
      if (seen.has(value)) throw new Error("La paginación no pudo avanzar.");
      seen.add(value); rows.push(row);
    }
    last = data.at(-1);
  }
  throw new Error("El espacio supera el límite de lectura segura. Contacta al administrador.");
}
