// Parámetros de los listados del panel (como el datatable de terza-sitio): cuántos resultados por página y el
// orden por columna. Viven en la URL (?por=50&orden=fecha-asc) para que se puedan recargar y compartir.

export const PAGE_SIZES = [10, 20, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 20;

export type SortDir = "asc" | "desc";
export type Sort<K extends string> = { key: K; dir: SortDir } | null;

export function parsePageSize(value: string): number {
  const n = Number(value);
  return (PAGE_SIZES as readonly number[]).includes(n) ? n : DEFAULT_PAGE_SIZE;
}

// "fecha-asc" → { key: "fecha", dir: "asc" }; solo columnas permitidas. Sin orden → null (el orden por omisión).
export function parseSort<K extends string>(value: string, keys: readonly K[]): Sort<K> {
  const match = /^([a-z]+)-(asc|desc)$/.exec(value);
  if (!match || !(keys as readonly string[]).includes(match[1])) return null;
  return { key: match[1] as K, dir: match[2] as SortDir };
}

export const sortParam = <K extends string>(sort: Sort<K>) => (sort ? `${sort.key}-${sort.dir}` : "");

// Al tocar un encabezado: si ya ordena por esa columna, invierte; si no, empieza por `firstDir`.
export function nextSort<K extends string>(current: Sort<K>, key: K, firstDir: SortDir = "asc"): Sort<K> {
  if (current?.key === key) return { key, dir: current.dir === "asc" ? "desc" : "asc" };
  return { key, dir: firstDir };
}

// Números del paginador: primera, última, la actual y sus vecinas; lo demás se resume con "…" (null).
export function pageNumbers(page: number, pageCount: number): (number | null)[] {
  const numbers = [...new Set([1, page - 1, page, page + 1, pageCount])]
    .filter((n) => n >= 1 && n <= pageCount)
    .sort((a, b) => a - b);
  const out: (number | null)[] = [];
  numbers.forEach((n, i) => {
    if (i > 0 && n - numbers[i - 1] > 1) out.push(null);
    out.push(n);
  });
  return out;
}
