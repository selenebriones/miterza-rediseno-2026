// Pedidos. Sin caché: cada pedido se consulta en vivo.

import { db } from "./db";

export async function getOrderForConfirmation(id: string) {
  if (!/^[a-z0-9]{20,40}$/.test(id)) return null;
  const order = await db.order.findUnique({
    where: { id },
    select: {
      number: true,
      status: true,
      email: true,
      phone: true,
      firstName: true,
      lastName: true,
      shippingStreet: true,
      shippingNeighborhood: true,
      shippingPostalCode: true,
      shippingCity: true,
      shippingState: true,
      shippingReferences: true,
      shippingLat: true,
      shippingLng: true,
      subtotal: true,
      shippingCost: true,
      discount: true,
      couponCode: true,
      total: true,
      createdAt: true,
      shippingCarrier: true,
      trackingNumber: true,
      // Fecha de cada cambio de estado (sin las notas internas del equipo).
      statusHistory: { orderBy: { createdAt: "asc" }, select: { toStatus: true, createdAt: true } },
      paymentMethod: { select: { name: true, instructions: true } },
      items: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          productName: true,
          productSlug: true,
          variantLabel: true,
          imageUrl: true,
          unitPrice: true,
          quantity: true,
          lineTotal: true,
        },
      },
    },
  });
  if (!order) return null;
  return {
    ...order,
    subtotal: Number(order.subtotal),
    shippingCost: Number(order.shippingCost),
    shippingLat: order.shippingLat === null ? null : Number(order.shippingLat),
    shippingLng: order.shippingLng === null ? null : Number(order.shippingLng),
    total: Number(order.total),
    discount: Number(order.discount),
    // El IVA no tiene columna: es lo que queda del total (0 en pedidos de antes del IVA).
    tax:
      Math.round(
        (Number(order.total) - (Number(order.subtotal) - Number(order.discount)) - Number(order.shippingCost)) * 100,
      ) / 100,
    items: order.items.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
    })),
  };
}
