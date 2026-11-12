"use client";

import { cn } from "@/lib/utils";
import { HeaderActionIcon } from "@/components/header/header-action-icon";
import type { HeaderIconKey } from "@/lib/header-actions";
import { useCart } from "./cart-provider";

// Círculo lima con el ícono de la bolsa y el contador, a juego con los demás botones del header.
export function CartButton({ icon = "shopping-bag", label: actionLabel = "Carrito" }: { icon?: HeaderIconKey; label?: string } = {}) {
  const { count, setOpen, bumpKey, hydrated } = useCart();
  const shown = hydrated ? count : 0;
  const label = shown === 0 ? `${actionLabel}, vacío` : `${actionLabel}, ${shown} ${shown === 1 ? "producto" : "productos"}`;

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={label}
      aria-haspopup="dialog"
      className={cn(
        "relative inline-flex size-11 items-center justify-center rounded-full bg-accent text-brand transition-colors hover:bg-accent-hover",
        "lg:size-12",
      )}
    >
      <HeaderActionIcon icon={icon} className="size-5 lg:size-[1.375rem]" />
      {shown > 0 && (
        <span
          key={bumpKey}
          aria-hidden="true"
          className="absolute -top-1 -right-1 grid h-5 min-w-5 animate-cart-bump place-items-center rounded-full bg-brand px-1 text-[0.6875rem] leading-none font-bold text-white "
        >
          {shown > 99 ? "99+" : shown}
        </span>
      )}
    </button>
  );
}
