"use client";

import { useId, useState, useTransition } from "react";
import { CheckCircle2Icon, LoaderCircleIcon, XIcon } from "lucide-react";
import { checkCoupon } from "@/app/(tienda)/carrito/actions";
import { formatPrice } from "@/lib/store-config";
import { useCart } from "./cart-provider";

// "¿Tienes código de descuento?": el servidor valida el código; si es válido queda guardado en el
// carrito (y el resumen muestra la fila de descuento), si no, se avisa debajo del campo.
export function CouponForm() {
  const { coupon, setCoupon } = useCart();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputId = useId();
  const messageId = useId();

  if (coupon) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 text-sm">
        <span className="flex items-center gap-2 text-black">
          <CheckCircle2Icon className="size-5 shrink-0 text-success" aria-hidden="true" />
          <span>
            Código <strong className="font-bold">{coupon.code}</strong> aplicado: −{formatPrice(coupon.amount)}
          </span>
        </span>
        <button
          type="button"
          onClick={() => setCoupon(null)}
          aria-label={`Quitar el código ${coupon.code}`}
          className="grid size-8 shrink-0 place-items-center rounded-full text-body transition-colors hover:bg-mist hover:text-black"
        >
          <XIcon className="size-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  function apply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await checkCoupon(code);
      if (result.ok) {
        setCoupon(result.coupon);
        setCode("");
        setError(null);
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <form onSubmit={apply} noValidate>
      <label htmlFor={inputId} className="text-lg font-bold text-brand">
        ¿Tienes código de descuento?
      </label>
      <div className="mt-3 flex gap-3">
        <input
          id={inputId}
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(null);
          }}
          placeholder="Código de descuento"
          autoComplete="off"
          autoCapitalize="characters"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? messageId : undefined}
          className="h-12 min-w-0 flex-1 rounded-xl border border-input bg-white px-4 text-base text-black placeholder:text-muted-foreground focus-visible:outline-brand aria-invalid:border-danger"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-accent px-6 font-semibold text-brand transition-colors hover:bg-accent-hover disabled:opacity-70"
        >
          {pending && <LoaderCircleIcon className="size-4 animate-spin" aria-hidden="true" />}
          Agregar
        </button>
      </div>
      <p id={messageId} role="alert" className="mt-2 text-sm text-danger empty:hidden">
        {error}
      </p>
    </form>
  );
}
