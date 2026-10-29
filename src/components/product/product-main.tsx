"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CheckIcon, MinusIcon, PhoneIcon, PlusIcon, RotateCcwIcon, ShieldCheckIcon, TruckIcon } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { useScrolledPast } from "@/hooks/use-scrolled-past";
import type { ProductDetail, ProductVariant } from "@/lib/products";
import { formatPrice, storeConfig } from "@/lib/store-config";
import { cn } from "@/lib/utils";
import { ProductGallery } from "./product-gallery";
import { VariantSelector } from "./variant-selector";

const MAX_PER_ORDER = 10;

export function ProductMain({ product }: { product: ProductDetail }) {
  const [variant, setVariant] = useState<ProductVariant>(
    () => product.variants.find((v) => v.stock > 0) ?? product.variants[0],
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);
  // Barra fija en móvil cuando el botón principal ya salió de la pantalla por arriba.
  const showStickyBar = useScrolledPast(ctaRef);
  const addedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const { addItem, setOpen } = useCart();

  const maxQuantity = Math.min(variant.stock, MAX_PER_ORDER);
  const inStock = variant.stock > 0;
  const lowStock = inStock && variant.stock <= variant.lowStockAlert;
  const discount =
    variant.compareAtPrice && variant.compareAtPrice > variant.price
      ? Math.round((1 - variant.price / variant.compareAtPrice) * 100)
      : null;
  const variantLabel = Object.values(variant.options).join(" · ");

  // Si el color elegido tiene foto propia, la galería salta a ella.
  const focusIndex = (() => {
    const index = product.images.findIndex((img) => img.variantOption && Object.values(variant.options).includes(img.variantOption));
    return index === -1 ? undefined : index;
  })();

  useEffect(() => () => clearTimeout(addedTimer.current), []);

  function selectVariant(next: ProductVariant) {
    setVariant(next);
    setQuantity((q) => Math.max(1, Math.min(q, Math.min(next.stock, MAX_PER_ORDER))));
  }

  function addToCart() {
    if (!inStock) return;
    addItem(
      {
        variantId: variant.id,
        slug: product.slug,
        name: product.name,
        variantLabel: variantLabel || undefined,
        price: variant.price,
        imageUrl: product.images[0]?.url ?? null,
      },
      quantity,
    );
    setAdded(true);
    clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(false), 2000);
    setOpen(true);
  }

  return (
    <div className="lg:grid lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-7">
        <ProductGallery images={product.images} productName={product.name} focusIndex={focusIndex} />
      </div>

      {/* Desktop: la columna queda fija al hacer scroll, el botón siempre está a la vista. */}
      <div className="mt-6 lg:col-span-5 lg:mt-0">
        <div className="lg:sticky lg:top-32">
          <Link
            href={`/productos?categoria=${product.line.toLowerCase()}`}
            className="text-xs font-semibold tracking-wide text-muted-foreground uppercase hover:text-brand"
          >
            {product.category} · {product.line}
          </Link>
          <h1 className="mt-1.5 text-2xl leading-tight font-bold text-balance lg:text-[2rem]">{product.name}</h1>

          <div aria-live="polite" className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-[1.75rem] font-bold text-heading transition-all">{formatPrice(variant.price)}</span>
            {discount && variant.compareAtPrice && (
              <>
                <s className="text-lg text-muted-foreground">
                  <span className="sr-only">Precio anterior: </span>
                  {formatPrice(variant.compareAtPrice)}
                </s>
                <span className="rounded-pill bg-accent px-2.5 py-1 text-xs font-bold text-brand">-{discount}%</span>
              </>
            )}
          </div>
          {product.options.length > 0 && (
            <p className="mt-1 text-sm">Precio para: {variantLabel}</p>
          )}

          {product.options.length > 0 && (
            <div className="mt-6 border-t border-line pt-6">
              <VariantSelector
                options={product.options}
                variants={product.variants}
                selected={variant}
                onSelect={selectVariant}
              />
            </div>
          )}

          <p aria-live="polite" className="mt-6 flex items-center gap-2 text-[0.9375rem] font-medium">
            <span
              aria-hidden="true"
              className={cn("size-2.5 rounded-full", !inStock ? "bg-muted-foreground" : lowStock ? "bg-warning" : "bg-success")}
            />
            {!inStock ? (
              <span className="text-body">Agotado en esta combinación. Prueba con otra medida o color.</span>
            ) : lowStock ? (
              <span className="text-warning">¡Últimas {variant.stock} piezas!</span>
            ) : (
              <span className="text-success">Disponible</span>
            )}
          </p>

          <div ref={ctaRef} className="mt-4 flex gap-3">
            <QuantityStepper value={quantity} max={maxQuantity} onChange={setQuantity} disabled={!inStock} />
            <AddButton inStock={inStock} added={added} onClick={addToCart} className="flex-1" />
          </div>

          <ul className="mt-6 space-y-3 rounded-card bg-surface p-4 text-sm">
            <li className="flex gap-3">
              <TruckIcon className="size-5 shrink-0 text-brand" aria-hidden="true" />
              <span>
                <strong className="text-heading">Envío gratis</strong> en compras desde{" "}
                {formatPrice(storeConfig.freeShippingThreshold)}
              </span>
            </li>
            <li className="flex gap-3">
              <ShieldCheckIcon className="size-5 shrink-0 text-brand" aria-hidden="true" />
              <span>
                <strong className="text-heading">Garantía Terza</strong> y más de 40 años de respaldo
              </span>
            </li>
            <li className="flex gap-3">
              <RotateCcwIcon className="size-5 shrink-0 text-brand" aria-hidden="true" />
              <span>
                Consulta nuestra{" "}
                <Link href="/politicas/devoluciones" className="font-medium text-brand underline underline-offset-2">
                  política de devoluciones
                </Link>
              </span>
            </li>
            <li className="flex gap-3">
              <PhoneIcon className="size-5 shrink-0 text-brand" aria-hidden="true" />
              <span>
                ¿Dudas con la medida?{" "}
                <a href={storeConfig.supportPhoneHref} className="font-medium whitespace-nowrap text-brand underline underline-offset-2">
                  {storeConfig.supportPhone}
                </a>
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Barra fija inferior (solo móvil). */}
      <div
        aria-hidden={!showStickyBar}
        className={cn(
          "fixed inset-x-0 bottom-0 z-header border-t border-line bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-sticky transition-transform duration-200 lg:hidden",
          showStickyBar ? "translate-y-0" : "pointer-events-none translate-y-full",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-lg leading-tight font-bold text-heading">{formatPrice(variant.price)}</p>
            <p className="truncate text-xs">{variantLabel || product.line}</p>
          </div>
          <AddButton
            inStock={inStock}
            added={added}
            onClick={addToCart}
            compact
            tabIndex={showStickyBar ? 0 : -1}
          />
        </div>
      </div>
    </div>
  );
}

function QuantityStepper({
  value,
  max,
  onChange,
  disabled,
}: {
  value: number;
  max: number;
  onChange: (update: (n: number) => number) => void;
  disabled: boolean;
}) {
  const buttonClass =
    "grid size-12 place-items-center rounded-full text-brand transition-colors hover:bg-surface disabled:text-muted-foreground disabled:hover:bg-transparent";
  return (
    <div className="flex items-center rounded-pill border border-input" role="group" aria-label="Cantidad">
      <button
        type="button"
        onClick={() => onChange((n) => Math.max(1, n - 1))}
        disabled={disabled || value <= 1}
        aria-label="Quitar una pieza"
        className={buttonClass}
      >
        <MinusIcon className="size-4" aria-hidden="true" />
      </button>
      <output aria-live="polite" className="w-8 text-center font-semibold text-heading tabular-nums">
        {value}
      </output>
      <button
        type="button"
        onClick={() => onChange((n) => Math.min(max, n + 1))}
        disabled={disabled || value >= max}
        aria-label="Agregar una pieza"
        className={buttonClass}
      >
        <PlusIcon className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function AddButton({
  inStock,
  added,
  onClick,
  compact,
  className,
  tabIndex,
}: {
  inStock: boolean;
  added: boolean;
  onClick: () => void;
  compact?: boolean;
  className?: string;
  tabIndex?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!inStock}
      tabIndex={tabIndex}
      className={cn(
        "inline-flex h-12 items-center justify-center gap-2 rounded-pill font-semibold whitespace-nowrap transition-colors",
        "px-6",
        !inStock
          ? "bg-line text-muted-foreground"
          : added
            ? "bg-accent text-brand"
            : "bg-brand text-white hover:bg-accent hover:text-brand active:bg-accent-hover",
        className,
      )}
    >
      {!inStock ? (
        "Agotado"
      ) : added ? (
        <>
          <CheckIcon className="size-5" aria-hidden="true" />
          Agregado
        </>
      ) : compact ? (
        "Agregar"
      ) : (
        "Agregar al carrito"
      )}
    </button>
  );
}
