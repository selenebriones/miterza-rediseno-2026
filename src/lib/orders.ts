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
      subtotal: true,
      shippingCost: true,
      total: true,
      createdAt: true,
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
    total: Number(order.total),
    items: order.items.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
    })),
  };
}
