// Filtros del catálogo y su representación en la URL. Sin dependencias de datos:
// lo usan tanto el servidor como los componentes de cliente.

export const PAGE_SIZE = 12;

export const SORT_OPTIONS = [
  { value: "relevancia", label: "Más relevantes", searchOnly: true },
  { value: "recomendados", label: "Recomendados", searchOnly: false },
  { value: "precio-asc", label: "Precio: menor a mayor", searchOnly: false },
  { value: "precio-desc", label: "Precio: mayor a menor", searchOnly: false },
  { value: "nuevos", label: "Más nuevos", searchOnly: false },
  { value: "nombre", label: "Nombre A–Z", searchOnly: false },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]["value"];

export type CatalogFilters = {
  q: string;
  categories: string[]; // slugs de categoría o línea
  minPrice: number | null;
  maxPrice: number | null;
  onSale: boolean;
  inStock: boolean;
  attributes: Record<string, string[]>; // { estilo: ["Bilbao"], tono: ["Gris", "Beige"] }
  sort: SortKey;
  page: number;
};

// Filtros por atributo (los mismos de terza-sitio). Cada categoría usa solo algunos; el panel muestra
// los que tienen valores en los productos de las categorías elegidas. La clave es también el
// parámetro de la URL (?estilo=Bilbao,Castle).
export const ATTRIBUTE_FILTERS = [
  { key: "linea", label: "Línea" },
  { key: "coleccion", label: "Colección" },
  { key: "tipo", label: "Tipo" },
  { key: "estilo", label: "Estilo" },
  { key: "especie", label: "Especie" },
  { key: "tono", label: "Tono" },
  { key: "color", label: "Color" },
  { key: "uso", label: "Uso" },
  { key: "unidad", label: "Presentación" },
] as const;

// Lo que dejan "Limpiar" y "Limpiar filtros" (conserva la búsqueda y el orden).
export const CLEARED_FILTERS: Partial<CatalogFilters> = {
  categories: [],
  minPrice: null,
  maxPrice: null,
  onSale: false,
  inStock: false,
  attributes: {},
};

export const PRICE_RANGES = [
  { label: "Hasta $1,500", min: null, max: 1500 },
  { label: "$1,500 – $2,500", min: 1500, max: 2500 },
  { label: "$2,500 – $4,000", min: 2500, max: 4000 },
  { label: "Más de $4,000", min: 4000, max: null },
] as const;

// Árbol de categorías (padre → líneas). Lo arma getCategoryTree() desde la base y se pasa
// a los componentes; estas funciones solo lo recorren.
export type CategoryNode = {
  slug: string;
  name: string;
  description: string | null;
  children: { slug: string; name: string }[];
};

export function findCategory(tree: CategoryNode[], slug: string) {
  for (const parent of tree) {
    if (parent.slug === slug) return { ...parent, parent: null };
    const child = parent.children.find((c) => c.slug === slug);
    if (child) return { ...child, description: null, children: [], parent };
  }
  return null;
}

// Los filtros de atributo solo aplican con una sola categoría final elegida (una subcategoría, o una
// sección sin subcategorías como Accesorios): cada una tiene sus propios estilos, tonos, etc. y en una
// sección como Pisos se mezclarían los de alfombras con los de pisos vinílicos.
export function attributesApply(tree: CategoryNode[], categories: string[]) {
  if (categories.length !== 1) return false;
  const found = findCategory(tree, categories[0]);
  return Boolean(found && (found.parent || found.children.length === 0));
}

// Quita de los filtros los atributos que no aplican a la categoría elegida (p. ej. una URL vieja).
export function scopeAttributes(filters: CatalogFilters, tree: CategoryNode[]): CatalogFilters {
  return attributesApply(tree, filters.categories) || Object.keys(filters.attributes).length === 0
    ? filters
    : { ...filters, attributes: {} };
}

// Marcar una categoría completa sustituye a sus líneas; desmarcar una línea cuando
// la categoría completa estaba marcada deja marcadas las demás líneas.
export function toggleCategory(tree: CategoryNode[], selected: string[], slug: string): string[] {
  const parent = tree.find((p) => p.slug === slug);
  if (parent) {
    const childSlugs = parent.children.map((c) => c.slug);
    const withoutFamily = selected.filter((s) => s !== slug && !childSlugs.includes(s));
    return selected.includes(slug) ? withoutFamily : [...withoutFamily, slug];
  }

  const owner = tree.find((p) => p.children.some((c) => c.slug === slug));
  if (!owner) return selected;
  const siblings = owner.children.map((c) => c.slug);

  if (selected.includes(owner.slug)) {
    return [...selected.filter((s) => s !== owner.slug), ...siblings.filter((s) => s !== slug)];
  }
  const next = selected.includes(slug) ? selected.filter((s) => s !== slug) : [...selected, slug];
  // Todas las líneas marcadas = la categoría completa.
  return siblings.every((s) => next.includes(s)) ? [...next.filter((s) => !siblings.includes(s)), owner.slug] : next;
}

// ─── URL ⇄ filtros ───────────────────────────────────────────

type RawParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

function toPrice(value: string) {
  const n = Number(value);
  return value !== "" && Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

export function parseCatalogParams(params: RawParams): CatalogFilters {
  const q = first(params.q).trim().slice(0, 80);
  // Solo se validan el formato y la cantidad; un slug inexistente simplemente no da resultados.
  const categories = [...new Set(first(params.categoria).split(","))]
    .filter((slug) => /^[a-z0-9-]{1,60}$/.test(slug))
    .slice(0, 20);
  const sortValue = first(params.orden);
  const defaultSort: SortKey = q ? "relevancia" : "recomendados";
  const sort = SORT_OPTIONS.some((o) => o.value === sortValue && (!o.searchOnly || q))
    ? (sortValue as SortKey)
    : defaultSort;
  const page = Math.max(1, Math.floor(Number(first(params.pagina)) || 1));
  const attributes: Record<string, string[]> = {};
  for (const { key } of ATTRIBUTE_FILTERS) {
    const values = [...new Set(first(params[key]).split(","))]
      .map((v) => v.trim().slice(0, 60))
      .filter(Boolean)
      .slice(0, 30);
    if (values.length) attributes[key] = values;
  }

  return {
    q,
    categories,
    minPrice: toPrice(first(params.min)),
    maxPrice: toPrice(first(params.max)),
    onSale: first(params.ofertas) === "1",
    inStock: first(params.disponible) === "1",
    attributes,
    sort,
    page,
  };
}

// Construye la URL omitiendo los valores por defecto. Cualquier cambio de filtro
// regresa a la página 1, salvo que se indique `page`.
export function catalogHref(filters: CatalogFilters, changes: Partial<CatalogFilters> = {}) {
  const next = { ...filters, page: 1, ...changes };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.categories.length) params.set("categoria", next.categories.join(","));
  if (next.minPrice !== null) params.set("min", String(next.minPrice));
  if (next.maxPrice !== null) params.set("max", String(next.maxPrice));
  if (next.onSale) params.set("ofertas", "1");
  if (next.inStock) params.set("disponible", "1");
  for (const { key } of ATTRIBUTE_FILTERS) {
    const values = next.attributes[key];
    if (values?.length) params.set(key, values.join(","));
  }
  if (next.sort !== (next.q ? "relevancia" : "recomendados")) params.set("orden", next.sort);
  if (next.page > 1) params.set("pagina", String(next.page));
  const query = params.toString().replace(/%2C/g, ",").replace(/\+/g, "%20");
  return query ? `/productos?${query}` : "/productos";
}

export function countActiveFilters(filters: CatalogFilters) {
  return (
    filters.categories.length +
    (filters.minPrice !== null || filters.maxPrice !== null ? 1 : 0) +
    (filters.onSale ? 1 : 0) +
    (filters.inStock ? 1 : 0) +
    Object.values(filters.attributes).reduce((sum, values) => sum + values.length, 0)
  );
}
