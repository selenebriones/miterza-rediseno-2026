"use client";

import { useEffect, useState } from "react";
import { MAX_PER_LINE, reconcileCart, type ValidatedLine } from "@/lib/cart-types";
import { useCart } from "./cart-provider";

type Result = { key: string; notices: string[]; stock: Record<string, number>; error: boolean };

// Valida el carrito contra la base cuando cambian las variantes que contiene (no la cantidad).
// Aplica precios y existencias reales y devuelve avisos para mostrar al usuario.
export function useCartValidation() {
  const { items, replaceItems } = useCart();
  const [result, setResult] = useState<Result | null>(null);
  const key = items
    .map((i) => i.variantId)
    .sort()
    .join(",");

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/cart/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lines: items.map(({ variantId, quantity }) => ({ variantId, quantity })) }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(String(res.status));
        const { lines } = (await res.json()) as { lines: ValidatedLine[] };
        const reconciled = reconcileCart(items, lines);
        if (reconciled.changed) replaceItems(reconciled.items);
        // Quitar una variante cambia la lista y provoca otra validación sin cambios:
        // en ese caso se conservan los avisos anteriores para que el usuario alcance a leerlos.
        setResult((prev) => ({
          key: reconciled.items.map((i) => i.variantId).sort().join(","),
          notices: reconciled.changed ? reconciled.notices : (prev?.notices ?? []),
          stock: Object.fromEntries(lines.map((l) => [l.variantId, l.stock])),
          error: false,
        }));
      } catch (error) {
        if ((error as Error).name !== "AbortError") setResult({ key, notices: [], stock: {}, error: true });
      }
    })();
    return () => controller.abort();
    // Solo cuando cambia el conjunto de variantes; `items` se lee en el momento de validar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return {
    validating: Boolean(key) && result?.key !== key && !result?.error,
    notices: result?.notices ?? [],
    error: result?.error ?? false,
    // Tope de cantidad por variante: existencias reales (máximo MAX_PER_LINE por compra).
    maxFor: (variantId: string) => Math.min(result?.stock[variantId] ?? MAX_PER_LINE, MAX_PER_LINE),
  };
}
