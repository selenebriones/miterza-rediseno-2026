import Image from "next/image";
import Link from "next/link";
import { ImageIcon } from "lucide-react";
import type { ProductSummary } from "@/lib/products";
import { formatPrice } from "@/lib/store-config";

// Tarjeta de producto del home y del catálogo. Toda la tarjeta lleva al detalle:
// casi todos los productos piden elegir medida o color antes de agregarlos.
// `eager`: para las primeras tarjetas visibles al cargar (mejora el LCP del listado).
export function ProductCard({ product, sizes, eager }: { product: ProductSummary; sizes: string; eager?: boolean }) {
  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round((1 - product.price / product.compareAtPrice) * 100)
      : null;
  const lowStock = product.stock > 0 && product.stock <= product.lowStockAlert;
  const outOfStock = product.stock === 0;

  return (
    <article className="group/card relative flex w-full flex-col rounded-card outline-offset-4 outline-brand has-[a:focus-visible]:outline-2">
      <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-surface shadow-card transition-shadow duration-300 group-hover/card:shadow-card-hover">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.imageAlt}
            fill
            sizes={sizes}
            loading={eager ? "eager" : undefined}
            className="object-cover transition-transform duration-300 group-hover/card:scale-105"
          />
        ) : (
          <span className="grid size-full place-items-center">
            <ImageIcon className="size-10 text-brand/30" aria-hidden="true" />
          </span>
        )}

        <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5">
          {discount && (
            <span className="rounded-pill bg-accent px-2.5 py-1 text-xs font-bold text-brand">-{discount}%</span>
          )}
          {product.isNew && (
            <span className="rounded-pill bg-white px-2.5 py-1 text-xs font-bold text-brand">Nuevo</span>
          )}
          {outOfStock && (
            <span className="rounded-pill bg-white px-2.5 py-1 text-xs font-bold text-body">Agotado</span>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-1 flex-col gap-1">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{product.line}</p>
        <h3 className="line-clamp-2 text-[0.9375rem] leading-snug font-medium text-heading transition-colors group-hover/card:text-brand">
          {/* Enlace estirado: el área clicable es toda la tarjeta. */}
          <Link href={`/productos/${product.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {product.name}
          </Link>
        </h3>
        <p className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-1">
          {product.hasPriceRange && <span className="text-xs">Desde</span>}
          <span className="text-lg font-bold text-heading">{formatPrice(product.price)}</span>
          {discount && product.compareAtPrice && (
            <s className="text-sm text-muted-foreground">
              <span className="sr-only">Precio anterior: </span>
              {formatPrice(product.compareAtPrice)}
            </s>
          )}
        </p>
        {lowStock && <p className="text-xs font-semibold text-warning">¡Últimas {product.stock} piezas!</p>}
      </div>
    </article>
  );
}
