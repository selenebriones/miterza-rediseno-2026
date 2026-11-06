"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  ImageIcon,
  LockIcon,
  MinusIcon,
  PlusIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  Trash2Icon,
} from "lucide-react";
import { useCart, type CartItem } from "./cart-provider";
import { FreeShippingProgress } from "./free-shipping-progress";
import { CouponForm } from "./coupon-form";
import { OrderTotals } from "./order-totals";
import { useCartValidation } from "./use-cart-validation";
import { computeTotals, formatPrice } from "@/lib/store-config";

const UNDO_MS = 5000;

export function CartPage({ categories }: { categories: { slug: string; name: string }[] }) {
  const { items, count, subtotal, coupon, updateQuantity, removeItem, addItem, hydrated } = useCart();
  const { validating, notices, error, maxFor } = useCartValidation();
  const [removed, setRemoved] = useState<CartItem | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(undoTimer.current), []);

  // Quitar sin confirmar, con opción de deshacer durante 5 segundos.
  function remove(item: CartItem) {
    removeItem(item.variantId);
    setRemoved(item);
    clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setRemoved(null), UNDO_MS);
  }

  function undo() {
    if (!removed) return;
    const { quantity, ...item } = removed;
    addItem(item, quantity);
    setRemoved(null);
  }

  const { total } = computeTotals(subtotal, coupon?.amount);

  return (
    <div className="container pt-6 pb-32 lg:pt-10 lg:pb-24">
      <h1 className="text-[1.75rem] leading-tight font-bold lg:text-[2.5rem]">
        Tu carrito {count > 0 && <span className="font-normal text-body">({count})</span>}
      </h1>

      {notices.length > 0 && (
        <div role="status" className="mt-5 flex gap-3 rounded-card border border-warning/30 bg-warning/5 p-4 text-sm text-heading">
          <AlertCircleIcon className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
          <ul className="space-y-1">
            {notices.map((notice) => (
              <li key={notice}>{notice}</li>
            ))}
          </ul>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-5 rounded-card bg-muted p-4 text-sm">
          No pudimos confirmar precios y existencias en este momento. Se volverán a revisar al realizar el pedido.
        </p>
      )}

      {!hydrated ? (
        <div className="mt-8 space-y-4" aria-busy="true" aria-label="Cargando carrito">
          {[0, 1].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-card bg-muted" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyCart categories={categories} />
      ) : (
        <div className="mt-6 lg:mt-8 lg:grid lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7 xl:col-span-8">
            <FreeShippingProgress subtotal={subtotal} className="rounded-card bg-surface px-5 py-4" />

            <ul className="mt-4 divide-y divide-line border-y border-line" aria-busy={validating}>
              {items.map((item) => (
                <li key={item.variantId} className="flex gap-4 py-5">
                  <Link
                    href={`/productos/${item.slug}`}
                    className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface sm:size-28"
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt="" className="size-full object-cover" />
                    ) : (
                      <ImageIcon className="size-7 text-brand/40" />
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/productos/${item.slug}`} className="font-medium text-heading hover:text-brand hover:underline">
                          {item.name}
                        </Link>
                        {item.variantLabel && <p className="mt-0.5 text-sm">{item.variantLabel}</p>}
                        <p className="mt-0.5 text-sm">{formatPrice(item.price)} c/u</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(item)}
                        aria-label={`Quitar ${item.name} del carrito`}
                        className="-mt-2 -mr-2 grid size-tap shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                      >
                        <Trash2Icon className="size-4" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center rounded-pill border border-input" role="group" aria-label={`Cantidad de ${item.name}`}>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          aria-label="Quitar una pieza"
                          className="grid size-tap place-items-center rounded-full text-brand hover:bg-surface disabled:text-muted-foreground disabled:hover:bg-transparent"
                        >
                          <MinusIcon className="size-4" aria-hidden="true" />
                        </button>
                        <output aria-live="polite" className="w-8 text-center font-semibold text-heading tabular-nums">
                          {item.quantity}
                        </output>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          disabled={item.quantity >= maxFor(item.variantId)}
                          aria-label="Agregar una pieza"
                          className="grid size-tap place-items-center rounded-full text-brand hover:bg-surface disabled:text-muted-foreground disabled:hover:bg-transparent"
                        >
                          <PlusIcon className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                      <p className="text-lg font-bold text-heading tabular-nums">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <Link
              href="/productos"
              className="mt-5 inline-flex items-center gap-2 rounded-pill bg-mist px-5 py-2 text-sm font-bold text-brand transition-colors hover:bg-brand hover:text-white"
            >
              <ArrowLeftIcon className="size-4" aria-hidden="true" />
              Seguir comprando
            </Link>
          </div>

          <aside className="mt-8 lg:col-span-5 lg:mt-0 xl:col-span-4" aria-label="Resumen del pedido">
            <div className="rounded-[28px] bg-mist p-6 lg:sticky lg:top-32 md:p-8">
              <h2 className="text-2xl font-bold text-black">Resumen</h2>
              <div className="mt-5 border-b border-black/10 pb-5">
                <CouponForm />
              </div>
              <OrderTotals subtotal={subtotal} coupon={coupon} className="mt-5" />
              <Link
                href="/checkout"
                className="mt-5 hidden h-12 w-full items-center justify-center rounded-pill bg-brand font-semibold text-white transition-colors hover:bg-accent hover:text-brand active:bg-accent-hover lg:inline-flex"
              >
                Continuar al pago
              </Link>
              <ul className="mt-5 space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <LockIcon className="size-4 text-brand" aria-hidden="true" />
                  Compra segura
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheckIcon className="size-4 text-brand" aria-hidden="true" />
                  Garantía Terza
                </li>
              </ul>
            </div>
          </aside>
        </div>
      )}

      {/* Móvil: total y botón principal siempre visibles. */}
      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-header border-t border-line bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-sticky lg:hidden">
          <div className="flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs">Total</p>
              <p className="text-2xl leading-tight font-bold text-black tabular-nums">{formatPrice(total)}</p>
            </div>
            <Link
              href="/checkout"
              className="inline-flex h-12 flex-1 items-center justify-center rounded-pill bg-brand px-5 font-semibold whitespace-nowrap text-white active:bg-brand-active"
            >
              Continuar al pago
            </Link>
          </div>
        </div>
      )}

      {/* Aviso para deshacer el último producto quitado. */}
      <div aria-live="polite" className="fixed inset-x-4 bottom-24 z-toast flex justify-center lg:bottom-8">
        {removed && (
          <div className="flex items-center gap-4 rounded-pill bg-heading py-2 pr-2 pl-5 text-sm text-white shadow-card-hover">
            <span className="line-clamp-1">Quitamos {removed.name}</span>
            <button
              type="button"
              onClick={undo}
              className="h-9 shrink-0 rounded-pill bg-accent px-4 font-semibold text-brand hover:bg-accent-hover"
            >
              Deshacer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyCart({ categories }: { categories: { slug: string; name: string }[] }) {
  return (
    <div className="mt-8 flex flex-col items-center rounded-card bg-surface px-6 py-14 text-center">
      <span className="grid size-20 place-items-center rounded-full bg-white">
        <ShoppingBagIcon className="size-9 text-brand" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-xl font-bold">Tu carrito está vacío</h2>
      <p className="mt-2 max-w-sm">Explora nuestros pisos, muros y persianas y encuentra el ideal para tu espacio.</p>
      <Link
        href="/productos"
        className="mt-6 inline-flex h-12 items-center rounded-pill bg-brand px-6 font-semibold text-white transition-colors hover:bg-accent hover:text-brand"
      >
        Explorar productos
      </Link>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/productos?categoria=${c.slug}`}
            className="inline-flex h-9 items-center rounded-pill bg-white px-4 text-sm font-medium text-brand hover:bg-brand-50"
          >
            {c.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
