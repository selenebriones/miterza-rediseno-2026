// Lectura del estado real de las variantes del carrito. Sin "use cache": las existencias
// y los precios tienen que ser los actuales al validar el carrito o crear el pedido.

import type { Prisma } from "@/generated/prisma/client";
import type { CartLineInput, ValidatedLine } from "./cart-types";
import { db } from "./db";

export const variantForCartSelect = {
  id: true,
  sku: true,
  price: true,
  stock: true,
  isActive: true,
  product: {
    select: {
      name: true,
      slug: true,
      status: true,
      images: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
    },
  },
  optionValues: {
    orderBy: { optionValue: { option: { position: "asc" } } },
    select: { optionValue: { select: { value: true } } },
  },
} satisfies Prisma.ProductVariantSelect;

export type VariantForCart = Prisma.ProductVariantGetPayload<{ select: typeof variantForCartSelect }>;

export const variantLabelOf = (variant: VariantForCart) =>
  variant.optionValues.map((ov) => ov.optionValue.value).join(" · ") || null;

export function toValidatedLine(variant: VariantForCart): ValidatedLine {
  return {
    variantId: variant.id,
    available: variant.isActive && variant.product.status === "ACTIVE",
    stock: variant.stock,
    price: Number(variant.price),
    name: variant.product.name,
    slug: variant.product.slug,
    variantLabel: variantLabelOf(variant),
    imageUrl: variant.product.images[0]?.url ?? null,
  };
}

// Normaliza lo que manda el navegador: ids únicos, cantidades enteras entre 1 y 10, máximo 50 líneas.
export function parseCartLines(raw: unknown): CartLineInput[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 50) return null;
  const lines = new Map<string, number>();
  for (const entry of raw) {
    const variantId = typeof entry?.variantId === "string" ? entry.variantId.slice(0, 40) : "";
    const quantity = Number(entry?.quantity);
    if (!variantId || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) return null;
    lines.set(variantId, (lines.get(variantId) ?? 0) + quantity);
  }
  return [...lines].map(([variantId, quantity]) => ({ variantId, quantity: Math.min(quantity, 10) }));
}

export async function validateCartLines(lines: CartLineInput[]): Promise<ValidatedLine[]> {
  const variants = await db.productVariant.findMany({
    where: { id: { in: lines.map((l) => l.variantId) } },
    select: variantForCartSelect,
  });
  return lines.map((line) => {
    const variant = variants.find((v) => v.id === line.variantId);
    return variant
      ? toValidatedLine(variant)
      : { variantId: line.variantId, available: false, stock: 0, price: 0, name: "", slug: "", variantLabel: null, imageUrl: null };
  });
}
