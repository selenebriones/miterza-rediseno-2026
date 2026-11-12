import type { OrderStatus } from "@/generated/prisma/enums";
import { STATUS_META } from "@/lib/order-status";
import { cn } from "@/lib/utils";

// Estado del pedido en el panel: fondo claro y texto del mismo color que su punto en el historial (admin.css).
export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const meta = STATUS_META[status];
  return <span className={cn("insignia pedido", meta.tone, className)}>{meta.label}</span>;
}
