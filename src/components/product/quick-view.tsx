"use client";

import { blindSizeLimits } from "@/lib/blind-size";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircleIcon, ImageIcon, Loader2Icon } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { ProductDetail, ProductVariant } from "@/lib/products";
import { formatPrice, formatProductPrice } from "@/lib/store-config";
import { boxLabel, formatArea, pricePerArea } from "@/lib/unit-price";
import { cn } from "@/lib/utils";
import { VariantSelector } from "./variant-selector";

type Props = { slug: string; open: boolean; onOpenChange: (open: boolean) => void };

type Loaded = { slug: string; product: ProductDetail | null };

// Vista rápida: elegir color o medida y agregar al carrito sin salir del listado.
export function QuickView({ slug, open, onOpenChange }: Props) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const product = loaded?.slug === slug ? loaded.product : undefined; // undefined = cargando

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/products/${slug}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : { product: null }))
      .then((data: { product: ProductDetail | null }) => setLoaded({ slug, product: data.product }))
      .catch((error) => {
        if ((error as Error).name !== "AbortError") setLoaded({ slug, product: null });
      });
    return () => controller.abort();
  }, [slug]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] gap-0 overflow-y-auto p-0 sm:max-w-3xl">
        <DialogTitle className="sr-only">{product ? product.name : "Vista rápida"}</DialogTitle>
        {product === undefined ? (
          <div className="grid min-h-80 place-items-center" role="status" aria-label="Cargando producto">
            <Loader2Icon className="size-8 animate-spin text-brand" aria-hidden="true" />
          </div>
        ) : product === null ? (
          <p role="alert" className="flex min-h-48 items-center justify-center gap-2 p-8 text-center">
            <AlertCircleIcon className="size-5 text-destructive" aria-hidden="true" />
            No pudimos cargar este producto. Intenta de nuevo.
          </p>
        ) : (
          <QuickViewContent product={product} onDone={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function QuickViewContent({ product, onDone }: { product: ProductDetail; onDone: () => void }) {
  const { addItem, setOpen } = useCart();
  const [chosen, setChosen] = useState<ProductVariant | null>(null);
  const variant = chosen ?? product.variants.find((v) => v.stock > 0) ?? product.variants[0];
  const image = product.images[0];
  const inStock = variant.stock > 0;
  const lowStock = inStock && variant.stock <= variant.lowStockAlert;
  const discount =
    variant.compareAtPrice && variant.compareAtPrice > variant.price
      ? Math.round((1 - variant.price / variant.compareAtPrice) * 100)
      : null;
  const label = Object.values(variant.options).join(" · ");
  const area = product.areaPerBox;
  // Persianas: la medida se captura en la ficha, así que desde aquí se lleva a ella.
  const needsSize = blindSizeLimits(product.features) !== null;

  function add() {
    addItem({
      variantId: variant.id,
      slug: product.slug,
      name: product.name,
      variantLabel: (area ? boxLabel(area) : label) || undefined,
      price: variant.price,
      imageUrl: image?.url ?? null,
    });
    onDone();
    setOpen(true);
  }

  return (
    <div className="grid sm:grid-cols-2">
      <div className="relative aspect-square bg-surface sm:aspect-auto sm:min-h-[26rem]">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt}
            fill
            sizes="(min-width: 640px) 384px, 100vw"
            className="object-cover"
          />
        ) : (
          <span className="grid size-full place-items-center">
            <ImageIcon className="size-12 text-brand/30" aria-hidden="true" />
          </span>
        )}
      </div>

      <div className="flex flex-col p-5 sm:p-7">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {product.category} · {product.line}
        </p>
        <h2 className="mt-1 text-xl leading-tight font-bold text-heading">{product.name}</h2>

        <div aria-live="polite" className="mt-3 flex flex-wrap items-baseline gap-x-3">
          <span className="text-2xl font-bold text-heading">
            {formatProductPrice(pricePerArea(variant.price, area))}
            {area && <span className="text-sm">/m²</span>}
          </span>
          {discount && variant.compareAtPrice && (
            <s className="text-muted-foreground">
              <span className="sr-only">Precio anterior: </span>
              {formatPrice(pricePerArea(variant.compareAtPrice, area))}
            </s>
          )}
          {discount && (
            <span className="self-center rounded-pill bg-sale px-2.5 py-1 text-xs font-bold text-white">
              -{discount}%
            </span>
          )}
        </div>
        {area && (
          <p className="mt-1 text-sm font-semibold text-heading">
            {formatArea(area)} m² x caja: {formatPrice(variant.price)}
          </p>
        )}

        {product.description[0] && <p className="mt-3 line-clamp-3 text-sm">{product.description[0]}</p>}

        {product.options.length > 0 && (
          <div className="mt-5">
            <VariantSelector
              options={product.options}
              variants={product.variants}
              selected={variant}
              onSelect={setChosen}
            />
          </div>
        )}

        <p
          aria-live="polite"
          className={cn("mt-4 flex items-center gap-2 text-sm font-medium", inStock && lowStock && "text-danger")}
        >
          <span
            aria-hidden="true"
            className={cn(
              "size-2.5 rounded-full",
              !inStock ? "bg-muted-foreground" : lowStock ? "bg-danger" : "bg-success",
            )}
          />
          {!inStock ? "Agotado en esta combinación" : lowStock ? `¡Últimas ${variant.stock} piezas!` : "Disponible"}
        </p>

        <div className="mt-auto pt-5">
          {needsSize && inStock ? (
            <Link
              href={`/productos/${product.slug}`}
              onClick={onDone}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-pill bg-brand font-semibold text-white transition-colors hover:bg-accent hover:text-brand"
            >
              Agregar medidas
            </Link>
          ) : (
            <button
              type="button"
              onClick={add}
              disabled={!inStock}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-pill bg-brand font-semibold text-white transition-colors hover:bg-accent hover:text-brand disabled:bg-line disabled:text-muted-foreground"
            >
              {inStock ? "Agregar al carrito" : "Agotado"}
            </button>
          )}
          <Link
            href={`/productos/${product.slug}`}
            onClick={onDone}
            className="mt-3 block text-center text-sm font-semibold text-brand underline-offset-4 hover:underline"
          >
            Ver detalles completos
          </Link>
        </div>
      </div>
    </div>
  );
}
