// Lectura de productos desde la base. Las funciones están cacheadas ("use cache") con la
// etiqueta `catalog`; el panel la invalidará al guardar cambios.

import { cacheLife, cacheTag } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { CACHE_TAGS, db } from "./db";

// Días desde la publicación en los que un producto se marca como "Nuevo".
const NEW_PRODUCT_DAYS = 30;

export type ProductSummary = {
  slug: string;
  name: string;
  line: string;
  lineSlug: string;
  category: string;
  price: number; // precio mínimo entre variantes
  compareAtPrice: number | null;
  hasPriceRange: boolean; // variantes con precios distintos → "Desde"
  imageUrl: string | null;
  imageAlt: string;
  stock: number;
  lowStockAlert: number;
  isNew: boolean;
  isFeatured: boolean;
};

export type ProductImage = { url: string; alt: string; variantOption?: string };
export type ProductOption = { name: string; values: { value: string; swatch?: string }[] };
export type ProductVariant = {
  id: string;
  sku: string;
  options: Record<string, string>; // { Color: "Gris", Medida: "120 × 160 cm" }
  price: number;
  compareAtPrice: number | null;
  stock: number;
  lowStockAlert: number;
};

export type ProductDetail = ProductSummary & {
  description: string[];
  features: { label: string; value: string }[];
  images: ProductImage[];
  options: ProductOption[];
  variants: ProductVariant[];
  installVideoUrl: string | null;
};

export const productSummarySelect = {
  slug: true,
  name: true,
  price: true,
  compareAtPrice: true,
  isFeatured: true,
  publishedAt: true,
  categories: { select: { slug: true, name: true, installVideoUrl: true, parent: { select: { slug: true, name: true } } } },
  images: { orderBy: { position: "asc" }, take: 1, select: { url: true, alt: true } },
  variants: { where: { isActive: true }, select: { price: true, stock: true, lowStockAlert: true } },
} satisfies Prisma.ProductSelect;

type SummaryRow = Prisma.ProductGetPayload<{ select: typeof productSummarySelect }>;

const toNumber = (value: Prisma.Decimal | null) => (value === null ? null : Number(value));

// La línea es la categoría con padre (Optima); la categoría, su padre (Persianas).
export function toSummary(row: SummaryRow, now = Date.now()): ProductSummary {
  const line = row.categories.find((c) => c.parent) ?? row.categories[0];
  const prices = row.variants.map((v) => Number(v.price));
  return {
    slug: row.slug,
    name: row.name,
    line: line?.name ?? "",
    lineSlug: line?.slug ?? "",
    category: line?.parent?.name ?? line?.name ?? "",
    price: prices.length ? Math.min(...prices) : Number(row.price),
    compareAtPrice: toNumber(row.compareAtPrice),
    hasPriceRange: new Set(prices).size > 1,
    imageUrl: row.images[0]?.url ?? null,
    imageAlt: row.images[0]?.alt ?? "",
    stock: row.variants.reduce((sum, v) => sum + v.stock, 0),
    lowStockAlert: row.variants.length ? Math.min(...row.variants.map((v) => v.lowStockAlert)) : 0,
    isNew: row.publishedAt ? now - row.publishedAt.getTime() < NEW_PRODUCT_DAYS * 86_400_000 : false,
    isFeatured: row.isFeatured,
  };
}

export async function getFeaturedProducts(limit = 8) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalog);

  const rows = await db.product.findMany({
    where: { status: "ACTIVE", isFeatured: true },
    orderBy: [{ publishedAt: "desc" }],
    take: limit,
    select: productSummarySelect,
  });
  const now = Date.now();
  return rows.map((row) => toSummary(row, now));
}

export async function getProductSlugs() {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalog);

  const rows = await db.product.findMany({ where: { status: "ACTIVE" }, select: { slug: true } });
  return rows.map((r) => r.slug);
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalog);

  const row = await db.product.findUnique({
    where: { slug, status: "ACTIVE" },
    select: {
      ...productSummarySelect,
      description: true,
      specs: true,
      images: {
        orderBy: { position: "asc" },
        select: { url: true, alt: true, variant: { select: { optionValues: { select: { optionValue: { select: { value: true } } } } } } },
      },
      options: {
        orderBy: { position: "asc" },
        select: { name: true, values: { orderBy: { position: "asc" }, select: { value: true, swatch: true } } },
      },
      variants: {
        where: { isActive: true },
        orderBy: { position: "asc" },
        select: {
          id: true,
          sku: true,
          price: true,
          compareAtPrice: true,
          stock: true,
          lowStockAlert: true,
          optionValues: { select: { optionValue: { select: { value: true, option: { select: { name: true } } } } } },
        },
      },
    },
  });
  if (!row) return null;

  const summary = toSummary({ ...row, images: row.images.slice(0, 1) });
  const line = row.categories.find((c) => c.parent);

  return {
    ...summary,
    description: (row.description ?? "").split(/\n{2,}/).filter(Boolean),
    features: Array.isArray(row.specs) ? (row.specs as { label: string; value: string }[]) : [],
    images: row.images.map((img) => ({
      url: img.url,
      alt: img.alt,
      // Si la imagen es de una variante, se asocia a su primer valor (p. ej. el color).
      variantOption: img.variant?.optionValues[0]?.optionValue.value,
    })),
    options: row.options.map((o) => ({
      name: o.name,
      values: o.values.map((v) => ({ value: v.value, swatch: v.swatch ?? undefined })),
    })),
    variants: row.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      options: Object.fromEntries(v.optionValues.map((ov) => [ov.optionValue.option.name, ov.optionValue.value])),
      price: Number(v.price),
      compareAtPrice: toNumber(v.compareAtPrice),
      stock: v.stock,
      lowStockAlert: v.lowStockAlert,
    })),
    installVideoUrl: line?.installVideoUrl ?? null,
  };
}

// Misma línea primero; si no alcanza, misma categoría. Sin agotados.
export async function getRelatedProducts(product: ProductSummary, limit = 4) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalog);

  const base = {
    status: "ACTIVE",
    slug: { not: product.slug },
    variants: { some: { isActive: true, stock: { gt: 0 } } },
  } satisfies Prisma.ProductWhereInput;

  const sameLine = await db.product.findMany({
    where: { ...base, categories: { some: { slug: product.lineSlug } } },
    orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
    take: limit,
    select: productSummarySelect,
  });
  const rest =
    sameLine.length < limit
      ? await db.product.findMany({
          where: {
            ...base,
            slug: { notIn: [product.slug, ...sameLine.map((p) => p.slug)] },
            categories: { some: { parent: { name: product.category } } },
          },
          orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
          take: limit - sameLine.length,
          select: productSummarySelect,
        })
      : [];
  const now = Date.now();
  return [...sameLine, ...rest].map((row) => toSummary(row, now));
}
