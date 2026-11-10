"use client";

import Link from "next/link";
import { ImageIcon, MinusIcon, PlusIcon, ShoppingBagIcon, Trash2Icon } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatPrice } from "@/lib/store-config";
import { cartLineKey, useCart } from "./cart-provider";
import { FreeShippingProgress } from "./free-shipping-progress";

// Mini carrito lateral: revisar y pasar a pagar sin salir de la página actual.
export function CartSheet() {
  const { items, count, subtotal, isOpen, setOpen, updateQuantity, removeItem } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full gap-0 bg-white data-[side=right]:sm:max-w-md">
        <SheetHeader className="border-b border-line px-5 py-4">
          <SheetTitle className="text-lg font-semibold text-heading">
            Tu carrito {count > 0 && <span className="font-normal text-body">({count})</span>}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
            <span className="grid size-20 place-items-center rounded-full bg-surface">
              <ShoppingBagIcon className="size-9 text-brand" aria-hidden="true" />
            </span>
            <p className="text-lg font-semibold text-heading">Tu carrito está vacío</p>
            <p className="text-sm">Explora nuestros tapetes y persianas y encuentra el ideal para tu espacio.</p>
            <SheetClose asChild>
              <Link
                href="/productos"
                className="mt-2 inline-flex h-12 items-center rounded-pill bg-brand px-6 font-semibold text-white transition-colors hover:bg-accent hover:text-brand"
              >
                Explorar productos
              </Link>
            </SheetClose>
          </div>
        ) : (
          <>
            <FreeShippingProgress subtotal={subtotal} />

            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {items.map((item) => (
                <li key={cartLineKey(item)} className="flex gap-3 py-4">
                  <span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt="" className="size-full object-cover" />
                    ) : (
                      <ImageIcon className="size-6 text-brand/40" aria-hidden="true" />
                    )}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <SheetClose asChild>
                      <Link href={`/productos/${item.slug}`} className="font-medium text-heading hover:underline">
                        {item.name}
                      </Link>
                    </SheetClose>
                    {item.variantLabel && <span className="text-sm">{item.variantLabel}</span>}
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-pill border border-line">
                        <button
                          type="button"
                          aria-label={`Quitar una pieza de ${item.name}`}
                          onClick={() => updateQuantity(cartLineKey(item), item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="grid size-10 place-items-center rounded-full text-brand hover:bg-surface disabled:text-muted-foreground disabled:hover:bg-transparent"
                        >
                          <MinusIcon className="size-4" aria-hidden="true" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold text-heading" aria-label={`Cantidad: ${item.quantity}`}>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Agregar una pieza de ${item.name}`}
                          onClick={() => updateQuantity(cartLineKey(item), item.quantity + 1)}
                          className="grid size-10 place-items-center rounded-full text-brand hover:bg-surface"
                        >
                          <PlusIcon className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                      <span className="font-semibold text-heading">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={`Eliminar ${item.name} del carrito`}
                    onClick={() => removeItem(cartLineKey(item))}
                    className="-mt-2 -mr-2 grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-destructive"
                  >
                    <Trash2Icon className="size-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>

            <SheetFooter className="gap-3 border-t border-line px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="flex items-baseline justify-between">
                <span className="text-heading">Subtotal</span>
                <span className="text-xl font-bold text-heading">{formatPrice(subtotal)}</span>
              </div>
              <p className="-mt-2 text-xs">El envío se calcula en el siguiente paso.</p>
              <SheetClose asChild>
                <Link
                  href="/checkout"
                  className="inline-flex h-12 items-center justify-center rounded-pill bg-brand font-semibold text-white transition-colors hover:bg-accent hover:text-brand active:bg-accent-hover"
                >
                  Ir a pagar
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link href="/carrito" className="text-center text-sm font-medium text-brand underline-offset-2 hover:underline">
                  Ver carrito completo
                </Link>
              </SheetClose>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
