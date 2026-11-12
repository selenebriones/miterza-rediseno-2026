import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import type { Sort } from "@/lib/admin/table-params";

// Consultas del módulo Clientes del panel (cuentas con rol CUSTOMER), sin caché: altas, bloqueos
// y pedidos tienen que verse al momento.

export const CUSTOMERS_PAGE_SIZE = 20;

export type CustomerStatusFilter = "activos" | "inactivos" | null;

export function customerStatusFromParam(value: string): CustomerStatusFilter {
  return value === "activos" || value === "inactivos" ? value : null;
}

function customersWhere(q: string, status: CustomerStatusFilter): Prisma.UserWhereInput {
  const query = q.trim();
  const terms = query.split(/\s+/).filter(Boolean).slice(0, 5);
  return {
    role: "CUSTOMER",
    ...(status ? { isActive: status === "activos" } : {}),
    ...(query
      ? {
          OR: [
            { email: { contains: query, mode: "insensitive" } },
            { phone: { contains: query.replace(/\D/g, "") || query } },
            { AND: terms.map((term) => ({ name: { contains: term, mode: "insensitive" as const } })) },
          ],
        }
      : {}),
  };
}

export const CUSTOMER_SORT_KEYS = ["nombre", "correo", "desde", "estado"] as const;
export type CustomerSortKey = (typeof CUSTOMER_SORT_KEYS)[number];

function customersOrderBy(sort: Sort<CustomerSortKey>): Prisma.UserOrderByWithRelationInput[] {
  if (!sort) return [{ createdAt: "desc" }];
  const dir = sort.dir;
  const by: Record<CustomerSortKey, Prisma.UserOrderByWithRelationInput> = {
    nombre: { name: { sort: dir, nulls: "last" } },
    correo: { email: dir },
    desde: { createdAt: dir },
    estado: { isActive: dir },
  };
  return [by[sort.key], { createdAt: "desc" }];
}

export async function listCustomers({
  q,
  status,
  page,
  pageSize = CUSTOMERS_PAGE_SIZE,
  sort = null,
}: {
  q: string;
  status: CustomerStatusFilter;
  page: number;
  pageSize?: number;
  sort?: Sort<CustomerSortKey>;
}) {
  const where = customersWhere(q, status);
  const total = await db.user.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  const customers = await db.user.findMany({
    where,
    orderBy: customersOrderBy(sort),
    skip: (current - 1) * pageSize,
    take: pageSize,
    select: { id: true, name: true, email: true, isActive: true, createdAt: true },
  });
  return { total, page: current, pageCount, customers };
}

// Conteo para las pestañas (sin aplicar la búsqueda).
export async function getCustomerCounts() {
  const groups = await db.user.groupBy({ by: ["isActive"], where: { role: "CUSTOMER" }, _count: { _all: true } });
  const active = groups.find((g) => g.isActive)?._count._all ?? 0;
  const inactive = groups.find((g) => !g.isActive)?._count._all ?? 0;
  return { all: active + inactive, active, inactive };
}

export async function getCustomer(id: string) {
  if (!/^[a-z0-9]{20,40}$/.test(id)) return null;
  const customer = await db.user.findFirst({
    where: { id, role: "CUSTOMER" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isActive: true,
      createdAt: true,
      lastLoginAt: true,
      _count: { select: { addresses: true } },
      orders: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          number: true,
          status: true,
          createdAt: true,
          firstName: true,
          lastName: true,
          phone: true,
          shippingStreet: true,
          shippingNeighborhood: true,
          shippingPostalCode: true,
          shippingCity: true,
          shippingState: true,
          shippingReferences: true,
          shippingCarrier: true,
          trackingNumber: true,
          subtotal: true,
          discount: true,
          couponCode: true,
          shippingCost: true,
          total: true,
          paymentMethod: { select: { name: true } },
          items: {
            orderBy: { id: "asc" },
            select: {
              id: true,
              productName: true,
              variantLabel: true,
              sku: true,
              imageUrl: true,
              unitPrice: true,
              quantity: true,
              lineTotal: true,
            },
          },
        },
      },
    },
  });
  if (!customer) return null;
  return {
    ...customer,
    orders: customer.orders.map((o) => {
      const subtotal = Number(o.subtotal);
      const discount = Number(o.discount);
      const shippingCost = Number(o.shippingCost);
      const total = Number(o.total);
      return {
        ...o,
        createdAt: o.createdAt.toISOString(),
        paymentMethod: o.paymentMethod.name,
        subtotal,
        discount,
        shippingCost,
        total,
        // El IVA no tiene columna: es lo que queda del total (0 en pedidos de antes del IVA).
        tax: Math.round((total - (subtotal - discount) - shippingCost) * 100) / 100,
        pieces: o.items.reduce((sum, i) => sum + i.quantity, 0),
        items: o.items.map((i) => ({ ...i, unitPrice: Number(i.unitPrice), lineTotal: Number(i.lineTotal) })),
      };
    }),
  };
}

export type CustomerDetail = NonNullable<Awaited<ReturnType<typeof getCustomer>>>;
export type CustomerOrder = CustomerDetail["orders"][number];
