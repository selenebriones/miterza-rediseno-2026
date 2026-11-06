import "server-only";

import type { OrderStatus, Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

// Consultas del panel, sin caché: los pedidos cambian constantemente.

export const ORDERS_PAGE_SIZE = 20;

function searchWhere(q: string): Prisma.OrderWhereInput | undefined {
  const query = q.trim();
  if (!query) return undefined;
  // "MT-000012", "mt12" o "12" buscan por número de pedido.
  const number = query.match(/^(?:mt-?)?0*(\d{1,9})$/i);
  if (number) return { number: Number(number[1]) };
  const terms = query.split(/\s+/).slice(0, 5);
  return {
    OR: [
      { email: { contains: query, mode: "insensitive" } },
      {
        AND: terms.map((term) => ({
          OR: [
            { firstName: { contains: term, mode: "insensitive" as const } },
            { lastName: { contains: term, mode: "insensitive" as const } },
          ],
        })),
      },
    ],
  };
}

export async function listOrders({ status, q, page }: { status: OrderStatus | null; q: string; page: number }) {
  const where: Prisma.OrderWhereInput = { ...(status ? { status } : {}), ...searchWhere(q) };
  const total = await db.order.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / ORDERS_PAGE_SIZE));
  const current = Math.min(Math.max(1, page), pageCount);
  const orders = await db.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (current - 1) * ORDERS_PAGE_SIZE,
    take: ORDERS_PAGE_SIZE,
    select: {
      id: true,
      number: true,
      status: true,
      firstName: true,
      lastName: true,
      email: true,
      total: true,
      createdAt: true,
      items: { select: { quantity: true } },
    },
  });
  return {
    total,
    page: current,
    pageCount,
    orders: orders.map((o) => ({
      ...o,
      total: Number(o.total),
      pieces: o.items.reduce((sum, i) => sum + i.quantity, 0),
    })),
  };
}

// Conteo por estado para las pestañas (sin aplicar la búsqueda).
export async function getStatusCounts() {
  const groups = await db.order.groupBy({ by: ["status"], _count: { _all: true } });
  const counts = Object.fromEntries(groups.map((g) => [g.status, g._count._all])) as Partial<
    Record<OrderStatus, number>
  >;
  return { counts, all: groups.reduce((sum, g) => sum + g._count._all, 0) };
}

export async function getOrderDetail(id: string) {
  if (!/^[a-z0-9]{20,40}$/.test(id)) return null;
  const order = await db.order.findUnique({
    where: { id },
    include: {
      paymentMethod: { select: { name: true } },
      items: { orderBy: { id: "asc" } },
      statusHistory: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });
  if (!order) return null;
  return {
    ...order,
    subtotal: Number(order.subtotal),
    shippingCost: Number(order.shippingCost),
    total: Number(order.total),
    discount: Number(order.discount),
    // El IVA no tiene columna: es lo que queda del total (0 en pedidos de antes del IVA).
    tax:
      Math.round(
        (Number(order.total) - (Number(order.subtotal) - Number(order.discount)) - Number(order.shippingCost)) * 100,
      ) / 100,
    items: order.items.map((i) => ({ ...i, unitPrice: Number(i.unitPrice), lineTotal: Number(i.lineTotal) })),
  };
}
