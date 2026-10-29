import { computeShipping, formatPrice, storeConfig } from "@/lib/store-config";
import { cn } from "@/lib/utils";

// Subtotal, envío y total. El envío se calcula igual en el servidor al crear el pedido.
export function OrderTotals({ subtotal, className }: { subtotal: number; className?: string }) {
  const shipping = computeShipping(subtotal);
  return (
    <dl className={cn("space-y-2 text-[0.9375rem]", className)}>
      <div className="flex justify-between">
        <dt>Subtotal</dt>
        <dd className="font-medium text-heading tabular-nums">{formatPrice(subtotal)}</dd>
      </div>
      <div className="flex justify-between">
        <dt>Envío</dt>
        <dd className="font-medium text-heading tabular-nums">{shipping === 0 ? "Gratis" : formatPrice(shipping)}</dd>
      </div>
      {shipping > 0 && (
        <p className="text-xs">Envío gratis en compras desde {formatPrice(storeConfig.freeShippingThreshold)}.</p>
      )}
      <div className="flex items-baseline justify-between border-t border-line pt-3">
        <dt className="font-semibold text-heading">Total</dt>
        <dd className="text-xl font-bold text-heading tabular-nums">{formatPrice(subtotal + shipping)}</dd>
      </div>
    </dl>
  );
}
