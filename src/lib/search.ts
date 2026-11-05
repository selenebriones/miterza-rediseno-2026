// Búsqueda del header (sugerencias) contra la base.
// Pendiente: búsqueda sin acentos y por relevancia (extensión unaccent o texto completo de Postgres).

import { cacheLife, cacheTag } from "next/cache";
import { CACHE_TAGS, db } from "./db";
import { getHomeCategories } from "./home";
import { productSummarySelect, toSummary } from "./products";
import type { SearchCategory, SearchResults } from "./search-types";

export async function searchCatalog(query: string): Promise<SearchResults> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalog);

  const terms = query.split(/\s+/).filter(Boolean);
  const [products, categories] = await Promise.all([
    db.product.findMany({
      where: {
        status: "ACTIVE",
        AND: terms.map((term) => ({
          OR: [
            { name: { contains: term, mode: "insensitive" as const } },
            { categories: { some: { name: { contains: term, mode: "insensitive" as const } } } },
          ],
        })),
      },
      orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
      take: 5,
      select: productSummarySelect,
    }),
    db.category.findMany({
      where: { isVisible: true, AND: terms.map((term) => ({ name: { contains: term, mode: "insensitive" as const } })) },
      orderBy: [{ parentId: { sort: "asc", nulls: "first" } }, { position: "asc" }],
      take: 3,
      select: { slug: true, name: true },
    }),
  ]);

  return {
    products: products.map((row) => {
      const p = toSummary(row);
      return { slug: p.slug, name: p.name, category: p.category, price: p.price, imageUrl: p.imageUrl };
    }),
    categories: categories.map((c) => ({ ...c, href: `/productos?categoria=${c.slug}` })),
  };
}

// "Búsquedas populares" antes de escribir: las primeras categorías del home.
export async function getPopularCategories(): Promise<SearchCategory[]> {
  const categories = await getHomeCategories();
  return categories.slice(0, 6).map(({ slug, name, href }) => ({ slug, name, href }));
}
