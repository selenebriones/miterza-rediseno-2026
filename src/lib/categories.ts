import { cacheLife, cacheTag } from "next/cache";
import type { CategoryNode } from "./catalog-params";
import { CACHE_TAGS, db } from "./db";

// Árbol de dos niveles (categoría → líneas) con las categorías visibles.
export async function getCategoryTree(): Promise<CategoryNode[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalog);

  const parents = await db.category.findMany({
    where: { parentId: null, isVisible: true },
    orderBy: { position: "asc" },
    select: {
      slug: true,
      name: true,
      description: true,
      children: { where: { isVisible: true }, orderBy: { position: "asc" }, select: { slug: true, name: true } },
    },
  });
  return parents;
}
