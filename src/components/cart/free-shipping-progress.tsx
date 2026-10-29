import { TruckIcon } from "lucide-react";
import { formatPrice, storeConfig } from "@/lib/store-config";

export function FreeShippingProgress({ subtotal, className }: { subtotal: number; className?: string }) {
  const threshold = storeConfig.freeShippingThreshold;
  const remaining = Math.max(threshold - subtotal, 0);
  const progress = Math.min(subtotal / threshold, 1) * 100;

  return (
    <div className={className ?? "border-b border-line bg-surface px-5 py-3"}>
      <p className="flex items-center gap-2 text-sm text-heading">
        <TruckIcon className="size-4 text-brand" aria-hidden="true" />
        {remaining > 0 ? (
          <span>
            Te faltan <strong>{formatPrice(remaining)}</strong> para el envío gratis
          </span>
        ) : (
          <strong className="text-brand">¡Tu envío es gratis!</strong>
        )}
      </p>
      <div
        role="progressbar"
        aria-label="Avance hacia el envío gratis"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-2 h-2 overflow-hidden rounded-pill bg-white"
      >
        <div className="h-full rounded-pill bg-brand transition-[width] duration-300" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
