"use client";

import { useCallback } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";

const KEY = "miterza-wishlist";
const EMPTY: string[] = [];
const MAX_ITEMS = 50;

// Favoritos de invitado: slugs de producto en localStorage, compartidos entre componentes y pestañas.
// Cuando existan cuentas de cliente se sincronizarán con la base.
export function useWishlist() {
  const [slugs, setSlugs] = useLocalStorage(KEY, EMPTY);

  const has = useCallback((slug: string) => slugs.includes(slug), [slugs]);

  const toggle = useCallback(
    (slug: string) =>
      setSlugs((current) =>
        current.includes(slug) ? current.filter((s) => s !== slug) : [slug, ...current].slice(0, MAX_ITEMS),
      ),
    [setSlugs],
  );

  return { slugs, count: slugs.length, has, toggle };
}
