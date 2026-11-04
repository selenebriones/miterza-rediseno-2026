"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HeartIcon, Loader2Icon } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import type { ProductSummary } from "@/lib/products";
import { useWishlist } from "./use-wishlist";

type Loaded = { key: string; products: ProductSummary[]; error: boolean };

export function WishlistPage() {
  const { slugs } = useWishlist();
  const key = slugs.join(",");
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    fetch(`/api/products?slugs=${encodeURIComponent(key)}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: { products: ProductSummary[] }) => setLoaded({ key, products: data.products, error: false }))
      .catch((error) => {
        if ((error as Error).name !== "AbortError") setLoaded({ key, products: [], error: true });
      });
    return () => controller.abort();
  }, [key]);

  // Al quitar un favorito de la lista se oculta de inmediato, sin esperar otra consulta.
  const products = (loaded?.products ?? []).filter((p) => slugs.includes(p.slug));
  const loading = slugs.length > 0 && loaded?.key !== key && products.length === 0;

  return (
    <div className="container pt-6 pb-16 lg:pt-10 lg:pb-24">
      <h1 className="text-[1.75rem] leading-tight font-bold lg:text-[2.5rem]">
        Favoritos {slugs.length > 0 && <span className="font-normal text-body">({slugs.length})</span>}
      </h1>

      {slugs.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-card bg-surface px-6 py-14 text-center">
          <span className="grid size-20 place-items-center rounded-full bg-white">
            <HeartIcon className="size-9 text-brand" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-xl font-bold">Aún no tienes favoritos</h2>
          <p className="mt-2 max-w-sm">Toca el corazón de un producto para guardarlo y encontrarlo aquí después.</p>
          <Link
            href="/productos"
            className="mt-6 inline-flex h-12 items-center rounded-pill bg-brand px-6 font-semibold text-white transition-colors hover:bg-accent hover:text-brand"
          >
            Explorar productos
          </Link>
        </div>
      ) : loading ? (
        <div className="mt-10 grid place-items-center" role="status" aria-label="Cargando favoritos">
          <Loader2Icon className="size-8 animate-spin text-brand" aria-hidden="true" />
        </div>
      ) : loaded?.error ? (
        <p role="alert" className="mt-8 rounded-card bg-muted p-4 text-sm">
          No pudimos cargar tus favoritos en este momento. Intenta de nuevo.
        </p>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {products.map((product) => (
            <li key={product.slug} className="flex">
              <ProductCard product={product} sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
