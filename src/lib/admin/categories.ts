import "server-only";

import { db } from "@/lib/db";

// Lecturas del panel: sin caché, para ver cambios propios de inmediato.

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  parentName: string | null;
  position: number;
  isVisible: boolean;
  showInHome: boolean;
  productCount: number;
};

export async function listCategories(): Promise<CategoryRow[]> {
  const rows = await db.category.findMany({
    orderBy: [{ parentId: { sort: "asc", nulls: "first" } }, { position: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
      position: true,
      isVisible: true,
      showInHome: true,
      parent: { select: { name: true } },
      _count: { select: { products: true } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    parentId: row.parentId,
    parentName: row.parent?.name ?? null,
    position: row.position,
    isVisible: row.isVisible,
    showInHome: row.showInHome,
    productCount: row._count.products,
  }));
}

// Para el select de "categoría padre" y el de categorías del producto.
export async function listCategoryOptions(): Promise<{ id: string; label: string }[]> {
  const rows = await db.category.findMany({
    orderBy: [{ parentId: { sort: "asc", nulls: "first" } }, { position: "asc" }],
    select: { id: true, name: true, parent: { select: { name: true } } },
  });
  return rows.map((row) => ({ id: row.id, label: row.parent ? `${row.parent.name} / ${row.name}` : row.name }));
}

const isCuid = (id: string) => /^[a-z0-9]{20,40}$/.test(id);

export async function getCategory(id: string) {
  if (!isCuid(id)) return null;
  return db.category.findUnique({ where: { id } });
}
