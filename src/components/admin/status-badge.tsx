import type { OrderStatus } from "@/generated/prisma/enums";
import { STATUS_META } from "@/lib/order-status";
import { cn } from "@/lib/utils";

// Color y texto siempre juntos: el estado se entiende sin depender del color.
export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-semibold whitespace-nowrap ring-1 ring-inset",
        meta.badge,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", meta.dot)} aria-hidden="true" />
      {meta.label}
    </span>
  );
}
