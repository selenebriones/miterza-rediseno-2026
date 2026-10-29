"use server";

import { refresh, revalidateTag } from "next/cache";
import type { OrderStatus } from "@/generated/prisma/enums";
import { authorize } from "@/lib/admin/session";
import { CACHE_TAGS, db } from "@/lib/db";
import { NEXT_STATUSES, ORDER_STATUSES, STATUS_META } from "@/lib/order-status";

export type StatusFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: { carrier?: string; trackingNumber?: string; confirm?: string };
};

// Error esperado: su mensaje se muestra tal cual.
class StatusChangeError extends Error {}

const asStatus = (value: FormDataEntryValue | null) => ORDER_STATUSES.find((s) => s === value) ?? null;

export async function updateOrderStatus(_prev: StatusFormState, formData: FormData): Promise<StatusFormState> {
  const admin = await authorize("MANAGE_ORDERS");
  if (!admin)
    return { status: "error", message: "Tu sesión ya no tiene permiso para actualizar pedidos. Vuelve a entrar." };

  const orderId = String(formData.get("orderId") ?? "");
  const expected = asStatus(formData.get("expectedStatus"));
  const next = asStatus(formData.get("toStatus"));
  const note =
    String(formData.get("note") ?? "")
      .trim()
      .slice(0, 1000) || null;
  const carrier = String(formData.get("carrier") ?? "")
    .trim()
    .slice(0, 80);
  const trackingNumber = String(formData.get("trackingNumber") ?? "")
    .trim()
    .slice(0, 80);

  if (!expected || !next) return { status: "error", message: "Elige el nuevo estado del pedido." };
  if (!NEXT_STATUSES[expected].includes(next)) {
    return { status: "error", message: "Ese cambio de estado no es válido para este pedido." };
  }

  const fieldErrors: StatusFormState["fieldErrors"] = {};
  if (next === "SHIPPED") {
    if (!carrier) fieldErrors.carrier = "Escribe la paquetería.";
    if (!trackingNumber) fieldErrors.trackingNumber = "Escribe el número de guía.";
  }
  if (next === "CANCELLED" && formData.get("confirm") !== "on") {
    fieldErrors.confirm = "Confirma la cancelación.";
  }
  if (Object.keys(fieldErrors).length > 0)
    return { status: "error", message: "Revisa los datos marcados.", fieldErrors };

  try {
    await db.$transaction(async (tx) => {
      // Solo se actualiza si el pedido sigue en el estado que vio quien hace el cambio:
      // si otra persona lo movió mientras tanto, no se pisa su trabajo.
      const updated = await tx.order.updateMany({
        where: { id: orderId, status: expected },
        data: { status: next, ...(next === "SHIPPED" ? { shippingCarrier: carrier, trackingNumber } : {}) },
      });
      if (updated.count === 0) {
        const current = await tx.order.findUnique({ where: { id: orderId }, select: { status: true } });
        throw new StatusChangeError(
          current
            ? `Este pedido cambió a «${STATUS_META[current.status].label}» mientras tanto. Recarga para ver su estado actual.`
            : "No encontramos este pedido.",
        );
      }

      await tx.orderStatusChange.create({
        data: { orderId, fromStatus: expected, toStatus: next, note, userId: admin.id },
      });

      // Cancelar regresa las piezas al inventario (si la variante todavía existe).
      if (next === "CANCELLED") {
        const items = await tx.orderItem.findMany({
          where: { orderId, variantId: { not: null } },
          select: { variantId: true, quantity: true },
        });
        for (const item of items) {
          await tx.productVariant.update({
            where: { id: item.variantId! },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
    });
  } catch (error) {
    if (error instanceof StatusChangeError) return { status: "error", message: error.message };
    console.error("Error al actualizar el pedido", error);
    return { status: "error", message: "No pudimos guardar el cambio. Intenta de nuevo." };
  }

  if (next === "CANCELLED") revalidateTag(CACHE_TAGS.catalog, "max"); // cambió el inventario
  refresh(); // vuelve a pintar el detalle con el nuevo estado e historial
  return { status: "success", message: `Pedido actualizado a «${STATUS_META[next as OrderStatus].label}».` };
}
