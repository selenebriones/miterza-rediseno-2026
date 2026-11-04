"use client";

import { useState } from "react";
import { EyeIcon, HeartIcon, ShoppingBagIcon } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { useWishlist } from "@/components/wishlist/use-wishlist";
import type { ProductSummary } from "@/lib/products";
import { boxLabel } from "@/lib/unit-price";
import { cn } from "@/lib/utils";
import { QuickView } from "./quick-view";

// Tres botones redondos arriba a la derecha de la tarjeta (vista rápida, carrito y favoritos).
// En pantallas con cursor aparecen al pasar por la tarjeta o al enfocarla con teclado;
// en pantallas táctiles están siempre visibles.
const buttonClass =
  "grid size-10 place-items-center rounded-full bg-white text-heading shadow-[0_0_8px_rgba(0,0,0,0.08)] transition-all duration-300 hover:bg-brand hover:text-white focus-visible:bg-brand focus-visible:text-white disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:bg-white disabled:hover:text-muted-foreground " +
  "[@media(hover:hover)]:translate-x-3 [@media(hover:hover)]:opacity-0 " +
  "group-hover/card:translate-x-0 group-hover/card:opacity-100 group-focus-within/card:translate-x-0 group-focus-within/card:opacity-100";

export function CardActions({ product }: { product: ProductSummary }) {
  const { addItem, setOpen } = useCart();
  const wishlist = useWishlist();
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const wished = wishlist.has(product.slug);
  const soldOut = product.stock === 0;
  const canAddDirectly = product.singleVariantId !== null;

  function addToCart() {
    if (!product.singleVariantId) {
      setQuickViewOpen(true); // hay que elegir color o medida
      return;
    }
    addItem({
      variantId: product.singleVariantId,
      slug: product.slug,
      name: product.name,
      variantLabel: product.areaPerBox ? boxLabel(product.areaPerBox) : undefined,
      price: product.price,
      imageUrl: product.imageUrl,
    });
    setOpen(true);
  }

  return (
    <>
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={() => setQuickViewOpen(true)}
          aria-label={`Vista rápida de ${product.name}`}
          title="Vista rápida"
          aria-haspopup="dialog"
          className={buttonClass}
          style={{ transitionDelay: "0ms" }}
        >
          <EyeIcon className="size-[1.125rem]" strokeWidth={1.5} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={addToCart}
          disabled={soldOut}
          aria-label={
            soldOut
              ? `${product.name}: agotado`
              : canAddDirectly
                ? `Agregar ${product.name} al carrito`
                : `Elegir opciones de ${product.name}`
          }
          title={soldOut ? "Agotado" : canAddDirectly ? "Agregar al carrito" : "Elegir opciones"}
          className={buttonClass}
          style={{ transitionDelay: "60ms" }}
        >
          <ShoppingBagIcon className="size-[1.125rem]" strokeWidth={1.5} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => wishlist.toggle(product.slug)}
          aria-pressed={wished}
          aria-label={wished ? `Quitar ${product.name} de favoritos` : `Agregar ${product.name} a favoritos`}
          title={wished ? "Quitar de favoritos" : "Agregar a favoritos"}
          className={cn(buttonClass, wished && "text-destructive")}
          style={{ transitionDelay: "120ms" }}
        >
          <HeartIcon className={cn("size-[1.125rem]", wished && "fill-current")} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>

      {quickViewOpen && <QuickView slug={product.slug} open={quickViewOpen} onOpenChange={setQuickViewOpen} />}
    </>
  );
}
