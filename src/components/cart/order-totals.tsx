import type { AppliedCoupon } from "@/components/cart/cart-provider";
import { computeTotals, formatPrice, storeConfig, taxLabel } from "@/lib/store-config";
import { cn } from "@/lib/utils";

// Subtotal, envío, descuento, IVA y total. El servidor usa el mismo cálculo (computeTotals) al crear
// el pedido. Estilo de la tarjeta "Información" de la ficha de terza-sitio: etiqueta verde en
// negritas, valor en negro y una línea bajo cada renglón.
const row = "flex justify-between gap-4 border-b border-black/10 pb-3 text-sm md:text-base";

type Props = { subtotal: number; coupon?: AppliedCoupon | null; className?: string };

export function OrderTotals({ subtotal, coupon, className }: Props) {
  const { shipping, discount, tax, total } = computeTotals(subtotal, coupon?.amount);
  return (
    <dl className={cn("space-y-3", className)}>
      <div className={row}>
        <dt className="font-bold text-brand">Subtotal:</dt>
        <dd className="text-black tabular-nums">{formatPrice(subtotal)}</dd>
      </div>
      {coupon && discount > 0 && (
        <div className={row}>
          <dt className="font-bold text-brand">Descuento ({coupon.code}):</dt>
          <dd className="text-black tabular-nums">−{formatPrice(discount)}</dd>
        </div>
      )}
      <div className={row}>
        <dt className="font-bold text-brand">Envío:</dt>
        <dd className="text-black tabular-nums">{shipping === 0 ? "Gratis" : formatPrice(shipping)}</dd>
      </div>
      {shipping > 0 && (
        <p className="text-xs">Envío gratis en compras desde {formatPrice(storeConfig.freeShippingThreshold)}.</p>
      )}
      <div className={row}>
        <dt className="font-bold text-brand">{taxLabel}:</dt>
        <dd className="text-black tabular-nums">{formatPrice(tax)}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-4 pt-1">
        <dt className="text-base font-bold text-brand md:text-lg">Total:</dt>
        <dd className="text-2xl font-bold text-black tabular-nums">{formatPrice(total)}</dd>
      </div>
    </dl>
  );
}
