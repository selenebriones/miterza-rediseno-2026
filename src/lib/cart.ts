// Lectura del estado real de las variantes del carrito. Sin "use cache": las existencias
// y los precios tienen que ser los actuales al validar el carrito o crear el pedido.

import type { Prisma } from "@/generated/prisma/client";
import { blindSizeKey, parseBlindSize } from "./blind-size";
import { MAX_PER_LINE, type CartLineInput, type ValidatedLine } from "./cart-types";
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
      specs: true, // persianas: límites de ancho y alto para validar la medida
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

// Normaliza lo que manda el navegador: una línea por variante y medida (persianas), cantidades enteras
// entre 1 y MAX_PER_LINE, máximo 50 líneas. La medida se valida contra el producto al crear el pedido.
export function parseCartLines(raw: unknown): CartLineInput[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 50) return null;
  const lines = new Map<string, CartLineInput>();
  for (const entry of raw) {
    const variantId = typeof entry?.variantId === "string" ? entry.variantId.slice(0, 40) : "";
    const quantity = Number(entry?.quantity);
    if (!variantId || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_PER_LINE) return null;
    const size = entry?.size == null ? undefined : parseBlindSize(entry.size);
    if (size === null) return null;
    const key = `${variantId}:${blindSizeKey(size)}`;
    const current = lines.get(key);
    lines.set(key, { variantId, size, quantity: Math.min((current?.quantity ?? 0) + quantity, MAX_PER_LINE) });
  }
  return [...lines.values()];
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
