import "server-only";

import type { Prisma, ProductStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";

// Lecturas del panel: sin caché (a diferencia de lib/products.ts, que sí cachea para la tienda pública).

export const PRODUCTS_PAGE_SIZE = 20;

function searchWhere(q: string): Prisma.ProductWhereInput | undefined {
  const query = q.trim();
  if (!query) return undefined;
  return {
    OR: [
      { name: { contains: query, mode: "insensitive" } },
      { slug: { contains: query, mode: "insensitive" } },
      { variants: { some: { sku: { contains: query, mode: "insensitive" } } } },
    ],
  };
}

export async function listProducts({
  status,
  categoryId,
  q,
  page,
}: {
  status: ProductStatus | null;
  categoryId: string | null;
  q: string;
  page: number;
}) {
  const where: Prisma.ProductWhereInput = {
    ...(status ? { status } : {}),
    ...(categoryId ? { categories: { some: { id: categoryId } } } : {}),
    ...searchWhere(q),
  };
  const total = await db.product.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / PRODUCTS_PAGE_SIZE));
  const current = Math.min(Math.max(1, page), pageCount);
  const products = await db.product.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    skip: (current - 1) * PRODUCTS_PAGE_SIZE,
    take: PRODUCTS_PAGE_SIZE,
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      price: true,
      updatedAt: true,
      images: { take: 1, orderBy: { position: "asc" }, select: { url: true, alt: true } },
      categories: { take: 1, select: { name: true } },
      _count: { select: { variants: true } },
    },
  });
  return {
    total,
    page: current,
    pageCount,
    products: products.map((p) => ({
      ...p,
      price: Number(p.price),
      categoryName: p.categories[0]?.name ?? null,
      image: p.images[0] ?? null,
      variantCount: p._count.variants,
    })),
  };
}

export async function getProductStatusCounts() {
  const groups = await db.product.groupBy({ by: ["status"], _count: { _all: true } });
  const counts = Object.fromEntries(groups.map((g) => [g.status, g._count._all])) as Partial<
    Record<ProductStatus, number>
  >;
  return { counts, all: groups.reduce((sum, g) => sum + g._count._all, 0) };
}

const isCuid = (id: string) => /^[a-z0-9]{20,40}$/.test(id);

export async function getProductForEdit(id: string) {
  if (!isCuid(id)) return null;
  const product = await db.product.findUnique({
    where: { id },
    include: {
      categories: { select: { id: true } },
      images: { orderBy: { position: "asc" } },
      options: { include: { values: { orderBy: { position: "asc" } } } },
      variants: { orderBy: { position: "asc" }, include: { optionValues: { select: { optionValueId: true } } } },
    },
  });
  if (!product) return null;

  // Hoy el catálogo usa cuando mucho un eje de opción (p. ej. "Medida"), 1 a 1 con la variante.
  const option = product.options[0] ?? null;
  const valueLabel = new Map(option?.values.map((v) => [v.id, v.value]) ?? []);

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    brand: product.brand ?? "",
    shortDescription: product.shortDescription ?? "",
    description: product.description ?? "",
    status: product.status,
    isFeatured: product.isFeatured,
    specs: (product.specs as { label: string; value: string }[] | null) ?? [],
    attributes: (product.attributes as Record<string, string> | null) ?? {},
    format: product.format ?? "",
    areaPerBox: product.areaPerBox ? Number(product.areaPerBox) : null,
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    seoTitle: product.seoTitle ?? "",
    seoDescription: product.seoDescription ?? "",
    categoryIds: product.categories.map((c) => c.id),
    images: product.images.map((img) => ({ url: img.url, alt: img.alt })),
    optionName: option?.name ?? "",
    variants: product.variants.map((v) => ({
      id: v.id,
      label: v.optionValues[0] ? (valueLabel.get(v.optionValues[0].optionValueId) ?? "") : "",
      sku: v.sku,
      price: Number(v.price),
      compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
      stock: v.stock,
      isActive: v.isActive,
    })),
  };
}

export type ProductForEdit = NonNullable<Awaited<ReturnType<typeof getProductForEdit>>>;
