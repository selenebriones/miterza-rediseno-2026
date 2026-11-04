// Consulta del catálogo con Prisma: filtros, orden, paginación y conteos por filtro (facetas).
// Cacheada por combinación de filtros con la etiqueta `catalog`.

import { cacheLife, cacheTag } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import {
  ATTRIBUTE_FILTERS,
  attributesApply,
  PAGE_SIZE,
  PRICE_RANGES,
  type CatalogFilters,
  type CategoryNode,
} from "./catalog-params";
import { CACHE_TAGS, db } from "./db";
import { productSummarySelect, toSummary, type ProductSummary } from "./products";

// `attr:<clave>` excluye un solo filtro de atributo; `attributes`, todos.
type FilterKey = "categories" | "price" | "onSale" | "inStock" | "attributes" | `attr:${string}`;

// `except` permite contar resultados ignorando un filtro (para las facetas).
function buildWhere(filters: CatalogFilters, except?: FilterKey): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [{ status: "ACTIVE" }];

  if (filters.q) {
    // Cada palabra debe aparecer en el nombre o en el nombre de alguna categoría.
    for (const term of filters.q.split(/\s+/).filter(Boolean)) {
      and.push({
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { categories: { some: { name: { contains: term, mode: "insensitive" } } } },
        ],
      });
    }
  }
  if (except !== "categories" && filters.categories.length > 0) {
    // El producto está ligado a su línea y a la categoría padre: un solo `in` cubre ambos casos.
    and.push({ categories: { some: { slug: { in: filters.categories } } } });
  }
  if (except !== "price") {
    if (filters.minPrice !== null) and.push({ price: { gte: filters.minPrice } });
    if (filters.maxPrice !== null) and.push({ price: { lte: filters.maxPrice } });
  }
  if (except !== "onSale" && filters.onSale) {
    and.push({ compareAtPrice: { gt: db.product.fields.price } });
  }
  if (except !== "inStock" && filters.inStock) {
    and.push({ variants: { some: { isActive: true, stock: { gt: 0 } } } });
  }
  if (except !== "attributes") {
    // Dentro de un atributo los valores se suman (O); entre atributos se combinan (Y).
    for (const [key, values] of Object.entries(filters.attributes)) {
      if (except === `attr:${key}` || values.length === 0) continue;
      and.push({ OR: values.map((value) => ({ attributes: { path: [key], equals: value } })) });
    }
  }
  return { AND: and };
}

function orderBy(filters: CatalogFilters): Prisma.ProductOrderByWithRelationInput[] {
  switch (filters.sort) {
    case "precio-asc":
      return [{ price: "asc" }, { name: "asc" }];
    case "precio-desc":
      return [{ price: "desc" }, { name: "asc" }];
    case "nuevos":
      return [{ publishedAt: "desc" }];
    case "nombre":
      return [{ name: "asc" }];
    // Recomendados y relevancia: destacados primero. La relevancia real llegará con búsqueda de texto completo.
    default:
      return [{ isFeatured: "desc" }, { name: "asc" }];
  }
}

export type CategoryFacet = {
  slug: string;
  name: string;
  count: number;
  children: { slug: string; name: string; count: number }[];
};

export type AttributeFacet = {
  key: string;
  label: string;
  values: { value: string; count: number }[];
};

export type CatalogResult = {
  products: ProductSummary[];
  total: number;
  page: number;
  pageCount: number;
  facets: {
    categories: CategoryFacet[];
    priceRanges: { label: string; min: number | null; max: number | null; count: number }[];
    onSale: number;
    inStock: number;
    // Solo con una categoría final elegida (ver attributesApply).
    attributes: AttributeFacet[];
  };
};

const collator = new Intl.Collator("es", { numeric: true, sensitivity: "base" });

// Valores de cada atributo con su conteo. Un atributo con selección se cuenta ignorando su propio
// filtro (para poder sumar más valores); los demás comparten una sola consulta.
async function attributeFacets(filters: CatalogFilters, tree: CategoryNode[]): Promise<AttributeFacet[]> {
  if (!attributesApply(tree, filters.categories)) return [];

  const attributesOf = (where: Prisma.ProductWhereInput) =>
    db.product
      .findMany({ where, select: { attributes: true } })
      .then((rows) => rows.map((r) => (r.attributes ?? {}) as Record<string, string>));

  const selectedKeys = Object.keys(filters.attributes).filter((k) => filters.attributes[k].length > 0);
  const [shared, ...own] = await Promise.all([
    attributesOf(buildWhere(filters)),
    ...selectedKeys.map((key) => attributesOf(buildWhere(filters, `attr:${key}`))),
  ]);

  return ATTRIBUTE_FILTERS.flatMap(({ key, label }) => {
    const index = selectedKeys.indexOf(key);
    const rows = index === -1 ? shared : own[index];
    const counts = new Map<string, number>();
    for (const attrs of rows) {
      const value = attrs[key];
      if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    // Los valores elegidos se muestran aunque ya no tengan resultados, para poder quitarlos.
    for (const value of filters.attributes[key] ?? []) if (!counts.has(value)) counts.set(value, 0);
    // Un atributo con un solo valor y sin selección no ayuda a filtrar.
    if (counts.size === 0 || (counts.size === 1 && index === -1)) return [];
    const values = [...counts]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => collator.compare(a.value, b.value));
    return [{ key, label, values }];
  });
}

export async function countCatalog(filters: CatalogFilters) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalog);

  return db.product.count({ where: buildWhere(filters) });
}

export async function queryCatalog(filters: CatalogFilters, tree: CategoryNode[]): Promise<CatalogResult> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalog);

  const where = buildWhere(filters);
  const total = await db.product.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(filters.page, pageCount); // página fuera de rango → la última válida

  const withCategory = (slug: string) =>
    db.product.count({ where: { AND: [buildWhere(filters, "categories"), { categories: { some: { slug } } }] } });
  const withPrice = (min: number | null, max: number | null) =>
    db.product.count({
      where: {
        AND: [
          buildWhere(filters, "price"),
          ...(min !== null ? [{ price: { gte: min } }] : []),
          ...(max !== null ? [{ price: { lte: max } }] : []),
        ],
      },
    });

  const [rows, categoryCounts, priceCounts, onSale, inStock, attributes] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: orderBy(filters),
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: productSummarySelect,
    }),
    Promise.all(
      tree.map(async (parent) => ({
        slug: parent.slug,
        name: parent.name,
        count: await withCategory(parent.slug),
        children: await Promise.all(
          parent.children.map(async (child) => ({ ...child, count: await withCategory(child.slug) })),
        ),
      })),
    ),
    Promise.all(PRICE_RANGES.map(async (range) => ({ ...range, count: await withPrice(range.min, range.max) }))),
    db.product.count({ where: buildWhere({ ...filters, onSale: true }) }),
    db.product.count({ where: buildWhere({ ...filters, inStock: true }) }),
    attributeFacets(filters, tree),
  ]);

  const now = Date.now();
  return {
    products: rows.map((row) => toSummary(row, now)),
    total,
    page,
    pageCount,
    facets: { categories: categoryCounts, priceRanges: priceCounts, onSale, inStock, attributes },
  };
}
