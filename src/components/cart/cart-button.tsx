"use client";

import { ShoppingBagIcon } from "lucide-react";
import { useCart } from "./cart-provider";

export function CartButton() {
  const { count, setOpen, bumpKey } = useCart();
  const label = count === 0 ? "Carrito vacío" : `Carrito, ${count} ${count === 1 ? "producto" : "productos"}`;

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={label}
      aria-haspopup="dialog"
      className="relative inline-flex h-tap min-w-tap items-center justify-center gap-2 rounded-pill text-white transition-colors hover:bg-brand-hover active:bg-brand-active lg:px-3"
    >
      <ShoppingBagIcon className="size-6" aria-hidden="true" />
      <span className="hidden font-medium lg:inline">Carrito</span>
      {count > 0 && (
        <span
          key={bumpKey}
          aria-hidden="true"
          className="absolute top-0.5 right-0 grid h-5 min-w-5 animate-cart-bump place-items-center rounded-pill bg-accent px-1 text-xs font-bold text-brand lg:static"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
