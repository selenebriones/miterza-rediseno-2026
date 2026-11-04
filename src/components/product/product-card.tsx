import Image from "next/image";
import Link from "next/link";
import { ImageIcon } from "lucide-react";
import type { ProductSummary } from "@/lib/products";
import { formatPrice } from "@/lib/store-config";
import { lineLogo } from "@/lib/line-logos";
import { pricePerArea } from "@/lib/unit-price";
import { cn } from "@/lib/utils";
import { CardActions } from "./card-actions";

type Variant = "card" | "swatch";

// Tarjeta de producto del home, el catálogo y los favoritos. Al pasar el cursor la foto se acerca y
// cambia a la segunda imagen, y aparecen los botones de vista rápida, carrito y favoritos. Toda la
// tarjeta lleva al detalle (enlace estirado en el nombre).
// `eager`: para las primeras tarjetas visibles al cargar (mejora el LCP del listado).
// Estilo terza-sitio: tarjeta blanca de esquinas amplias con sombra suave, foto cuadrada, etiquetas en
// píldora lima y texto a la izquierda.
// `variant`:
//  - "card": la tarjeta sola (catálogo, relacionados y favoritos).
//  - "swatch": además, un cuadrito con el detalle de la textura montado sobre el borde de la foto (home).
export function ProductCard({
  product,
  sizes,
  eager,
  variant = "card",
}: {
  product: ProductSummary;
  sizes: string;
  eager?: boolean;
  variant?: Variant;
}) {
  const swatch = variant === "swatch";
  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round((1 - product.price / product.compareAtPrice) * 100)
      : null;
  const lowStock = product.stock > 0 && product.stock <= product.lowStockAlert;
  const outOfStock = product.stock === 0;

  const badge = "rounded-full px-3 py-1 text-[0.6875rem] font-bold tracking-wide uppercase";

  const image = product.imageUrl ? (
    <>
      <Image
        src={product.imageUrl}
        alt={product.imageAlt}
        fill
        sizes={sizes}
        loading={eager ? "eager" : undefined}
        className={cn(
          "object-cover transition-[opacity,transform] duration-700 ease-out group-hover/card:scale-[1.09]",
          product.hoverImageUrl && "group-hover/card:opacity-0",
        )}
      />
      {product.hoverImageUrl && (
        <Image
          src={product.hoverImageUrl}
          alt=""
          fill
          sizes={sizes}
          className="object-cover opacity-0 transition-[opacity,transform] duration-700 ease-out group-hover/card:scale-[1.09] group-hover/card:opacity-100"
        />
      )}
    </>
  ) : (
    <span className="grid size-full place-items-center">
      <ImageIcon className="size-10 text-brand/30" aria-hidden="true" />
    </span>
  );

  const badges = (
    <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
      {product.isNew && <span className={cn(badge, "bg-accent text-brand")}>Nuevo</span>}
      {outOfStock && <span className={cn(badge, "bg-white text-body")}>Agotado</span>}
    </div>
  );

  // Persianas: logo de su línea (Optima, Select, Stylo) abajo a la derecha de la foto.
  const logo = lineLogo(product.brandLine);
  const lineBadge = logo && (
    <span className="absolute right-3 bottom-3 block h-[21px] w-[55px] overflow-hidden rounded shadow-[0_2px_6px_rgba(0,0,0,0.15)] sm:h-[27px] sm:w-[70px]">
      <Image src={logo} alt={`Línea ${product.brandLine}`} fill sizes="70px" className="object-cover" />
    </span>
  );

  const price = (
    <p className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-1">
      {product.hasPriceRange && <span className="text-xs">Desde</span>}
      {/* Precio final primero; en oferta, el anterior tachado y la píldora del descuento a la derecha. */}
      <span className="text-lg font-bold text-heading">
        {formatPrice(pricePerArea(product.price, product.areaPerBox))}
        {product.areaPerBox && <span className="text-xs font-semibold">/m²</span>}
      </span>
      {discount && product.compareAtPrice && (
        <s className="text-sm text-muted-foreground">
          <span className="sr-only">Precio anterior: </span>
          {formatPrice(pricePerArea(product.compareAtPrice, product.areaPerBox))}
        </s>
      )}
      {discount && (
        <span className="self-center rounded-pill bg-sale px-2 py-0.5 text-[0.6875rem] font-bold text-white">
          -{discount}%
        </span>
      )}
    </p>
  );

  return (
    <article
      className={cn(
        "group/card relative flex w-full flex-col rounded-[24px] bg-white outline-offset-4 outline-brand has-[a:focus-visible]:outline-2",
        "shadow-[0_4px_18px_rgba(0,0,0,0.08)] transition-shadow duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.14)]",
      )}
    >
      {/* El cuadrito de textura sobresale del borde de la foto, por eso va fuera del recorte. */}
      <div className="relative">
        <div className="relative aspect-square overflow-hidden rounded-t-[24px] bg-surface">
          {image}
          {badges}
          {lineBadge}
        </div>
        {swatch && product.imageUrl && (
          <span
            aria-hidden="true"
            className="absolute -bottom-8 left-4 size-14 overflow-hidden rounded-xl border-[3px] border-white bg-surface shadow-[0_2px_8px_rgba(0,0,0,0.12)] sm:left-5 sm:size-16"
          >
            {/* Acercamiento al centro de la foto: simula la muestra de la textura. */}
            <Image src={product.imageUrl} alt="" fill sizes="64px" className="scale-[2.4] object-cover" />
          </span>
        )}
      </div>

      <CardActions product={product} />

      <div
        className={cn(
          "flex flex-1 flex-col items-start gap-1 px-4 pb-4 text-left sm:px-5 sm:pb-5",
          swatch ? "pt-11 sm:pt-12" : "pt-4 sm:pt-5",
        )}
      >
        <h3 className="line-clamp-2 text-base leading-snug font-semibold text-heading transition-colors group-hover/card:text-brand sm:text-lg">
          {/* Enlace estirado: el área clicable es toda la tarjeta. */}
          <Link href={`/productos/${product.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {product.name}
          </Link>
        </h3>
        <p className="text-xs font-bold tracking-widest text-brand uppercase">{product.line}</p>
        {price}
        {lowStock && <p className="text-xs font-semibold text-danger">¡Últimas {product.stock} piezas!</p>}
      </div>
    </article>
  );
}
