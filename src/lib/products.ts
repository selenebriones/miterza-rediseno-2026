// Lectura de productos desde la base. Las funciones están cacheadas ("use cache") con la
// etiqueta `catalog`; el panel la invalidará al guardar cambios.

import { blindSizeLimits } from "./blind-size";
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
  hoverImageUrl: string | null; // segunda foto: aparece al pasar el cursor por la tarjeta
  // Productos con una sola variante se agregan al carrito desde la tarjeta;
  // los que piden elegir color o medida abren la vista rápida.
  singleVariantId: string | null;
  stock: number;
  lowStockAlert: number;
  isNew: boolean;
  isFeatured: boolean;
  areaPerBox: number | null; // pisos: m² por caja (el precio es por caja)
  brandLine: string | null; // persianas: línea comercial (Optima, Select, Stylo…) del atributo `linea`
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
  format: string | null; // pisos: medida de la pieza
};

export const productSummarySelect = {
  slug: true,
  name: true,
  price: true,
  compareAtPrice: true,
  isFeatured: true,
  publishedAt: true,
  areaPerBox: true,
  attributes: true,
  specs: true,
  categories: {
    select: { slug: true, name: true, installVideoUrl: true, parent: { select: { slug: true, name: true } } },
  },
  images: { orderBy: { position: "asc" }, take: 2, select: { url: true, alt: true } },
  variants: { where: { isActive: true }, select: { id: true, price: true, stock: true, lowStockAlert: true } },
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
    hoverImageUrl: row.images[1]?.url ?? null,
    // Persianas: no se agregan directo desde la tarjeta porque antes hay que capturar la medida.
    singleVariantId:
      row.variants.length === 1 && !blindSizeLimits((row.specs ?? []) as { label: string; value: string }[])
        ? row.variants[0].id
        : null,
    stock: row.variants.reduce((sum, v) => sum + v.stock, 0),
    lowStockAlert: row.variants.length ? Math.min(...row.variants.map((v) => v.lowStockAlert)) : 0,
    isNew: row.publishedAt ? now - row.publishedAt.getTime() < NEW_PRODUCT_DAYS * 86_400_000 : false,
    isFeatured: row.isFeatured,
    areaPerBox: toNumber(row.areaPerBox),
    brandLine: (row.attributes as Record<string, string> | null)?.linea ?? null,
  };
}

// Productos del slider "Nuevos productos" del home: los más recientes de cada categoría (los marcados
// como nuevos primero), intercalados (uno de cada categoría por vuelta) para que aparezcan todas.
export async function getFeaturedProducts(limit = 12, selectedSlugs: string[] = []) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalog);

  if (selectedSlugs.length) {
    const rows = await db.product.findMany({
      where: { status: "ACTIVE", slug: { in: selectedSlugs } },
      select: productSummarySelect,
    });
    const order = new Map(selectedSlugs.map((slug, index) => [slug, index]));
    const now = Date.now();
    return rows
      .sort((a, b) => (order.get(a.slug) ?? 999) - (order.get(b.slug) ?? 999))
      .map((row) => toSummary(row, now));
  }

  // Categorías finales: las subcategorías y las secciones sin subcategorías (Accesorios).
  const categories = await db.category.findMany({
    where: { isVisible: true, children: { none: {} } },
    orderBy: [{ parent: { position: "asc" } }, { position: "asc" }],
    select: { slug: true },
  });
  const perCategory = Math.ceil(limit / Math.max(categories.length, 1)) + 1;
  const now = Date.now();

  const groups = (
    await Promise.all(
      categories.map((category) =>
        db.product.findMany({
          where: { status: "ACTIVE", categories: { some: { slug: category.slug } } },
          orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
          take: perCategory,
          select: productSummarySelect,
        }),
      ),
    )
  )
    .map((rows) => rows.map((row) => toSummary(row, now)))
    .filter((group) => group.length > 0)
    // Primero las categorías con novedades más recientes.
    .sort((a, b) => Number(b[0].isNew) - Number(a[0].isNew));

  const result: ProductSummary[] = [];
  for (let i = 0; result.length < limit && groups.some((g) => i < g.length); i++) {
    for (const group of groups) if (i < group.length && result.length < limit) result.push(group[i]);
  }
  return result;
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
      format: true,
      images: {
        orderBy: { position: "asc" },
        select: {
          url: true,
          alt: true,
          variant: { select: { optionValues: { select: { optionValue: { select: { value: true } } } } } },
        },
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
    format: row.format,
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

// Productos por slug, en el orden pedido (favoritos). Ignora los que ya no existen.
export async function getProductsBySlugs(slugs: string[]) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalog);

  const rows = await db.product.findMany({
    where: { status: "ACTIVE", slug: { in: slugs } },
    select: productSummarySelect,
  });
  const now = Date.now();
  const bySlug = new Map(rows.map((row) => [row.slug, toSummary(row, now)]));
  return slugs.flatMap((slug) => bySlug.get(slug) ?? []);
}
