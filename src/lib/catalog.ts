// Consulta del catálogo con Prisma: filtros, orden, paginación y conteos por filtro (facetas).
// Cacheada por combinación de filtros con la etiqueta `catalog`.

import { cacheLife, cacheTag } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { PAGE_SIZE, PRICE_RANGES, type CatalogFilters, type CategoryNode } from "./catalog-params";
import { CACHE_TAGS, db } from "./db";
import { productSummarySelect, toSummary, type ProductSummary } from "./products";

type FilterKey = "categories" | "price" | "onSale" | "inStock";

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
  };
};

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

  const [rows, categoryCounts, priceCounts, onSale, inStock] = await Promise.all([
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
  ]);

  const now = Date.now();
  return {
    products: rows.map((row) => toSummary(row, now)),
    total,
    page,
    pageCount,
    facets: { categories: categoryCounts, priceRanges: priceCounts, onSale, inStock },
  };
}
