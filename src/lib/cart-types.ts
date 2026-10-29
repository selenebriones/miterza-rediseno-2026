// Validación del carrito: tipos y conciliación. Sin dependencias de servidor (lo usa el cliente).

import { formatPrice } from "./store-config";
import type { CartItem } from "@/components/cart/cart-provider";

export const MAX_PER_LINE = 10;

export type CartLineInput = { variantId: string; quantity: number };

// Estado real de una variante en la base, sin caché.
export type ValidatedLine = {
  variantId: string;
  available: boolean; // existe, está activa y su producto está publicado
  stock: number;
  price: number;
  name: string;
  slug: string;
  variantLabel: string | null;
  imageUrl: string | null;
};

// Aplica el estado real al carrito: quita lo que ya no existe o se agotó, ajusta cantidades
// al stock y actualiza precios. Devuelve avisos en lenguaje claro para mostrarlos al usuario.
export function reconcileCart(items: CartItem[], lines: ValidatedLine[]) {
  const notices: string[] = [];
  const next: CartItem[] = [];

  for (const item of items) {
    const line = lines.find((l) => l.variantId === item.variantId);
    if (!line || !line.available) {
      notices.push(`${item.name} ya no está disponible y lo quitamos de tu carrito.`);
      continue;
    }
    if (line.stock === 0) {
      notices.push(`${line.name} se agotó y lo quitamos de tu carrito.`);
      continue;
    }
    let quantity = Math.min(item.quantity, MAX_PER_LINE);
    if (quantity > line.stock) {
      quantity = line.stock;
      notices.push(
        `${line.stock === 1 ? "Solo queda 1 pieza" : `Solo quedan ${line.stock} piezas`} de ${line.name}; ajustamos la cantidad.`,
      );
    }
    if (line.price !== item.price) {
      notices.push(`El precio de ${line.name} cambió de ${formatPrice(item.price)} a ${formatPrice(line.price)}.`);
    }
    next.push({
      ...item,
      name: line.name,
      slug: line.slug,
      variantLabel: line.variantLabel ?? undefined,
      imageUrl: line.imageUrl,
      price: line.price,
      quantity,
    });
  }

  const changed = notices.length > 0 || next.some((item, i) => item.imageUrl !== items[i]?.imageUrl);
  return { items: next, notices, changed };
}
