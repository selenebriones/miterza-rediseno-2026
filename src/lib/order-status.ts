// Estados de pedido: etiqueta, color, slug para la URL y transiciones válidas.
// Sin dependencias de servidor (lo usan el listado, el detalle y el formulario de cambio).

import type { OrderStatus } from "@/generated/prisma/enums";

export const ORDER_STATUSES: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PAID",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

// `badge` es el color en la tienda (Mi cuenta); `tone` el del panel (clase .insignia de admin.css, colores UBold).
// Panel: la etiqueta (tone) y el punto del historial (dot) usan los colores de UBold / terza-sitio: naranja,
// azul, morado, verde, gris y rojo. La etiqueta lleva el fondo claro de ese color.
export type BadgeTone = "naranja" | "azul" | "morado" | "verde" | "gris-pedido" | "rojo";

export const STATUS_META: Record<
  OrderStatus,
  { label: string; slug: string; badge: string; dot: string; tone: BadgeTone }
> = {
  PENDING_PAYMENT: {
    label: "Por pagar",
    slug: "por-pagar",
    badge: "bg-amber-50 text-amber-800 ring-amber-200",
    dot: "bg-[#f7b84b]",
    tone: "naranja",
  },
  PAID: {
    label: "Pagado",
    slug: "pagados",
    badge: "bg-sky-50 text-sky-800 ring-sky-200",
    dot: "bg-[#4fc6e1]",
    tone: "azul",
  },
  PREPARING: {
    label: "Preparando",
    slug: "preparando",
    badge: "bg-violet-50 text-violet-800 ring-violet-200",
    dot: "bg-[#6658dd]",
    tone: "morado",
  },
  SHIPPED: {
    label: "Enviado",
    slug: "enviados",
    badge: "bg-brand-50 text-brand ring-brand-100",
    dot: "bg-[#1abc9c]",
    tone: "verde",
  },
  DELIVERED: {
    label: "Entregado",
    slug: "entregados",
    badge: "bg-zinc-100 text-zinc-700 ring-zinc-200",
    dot: "bg-[#6c757d]",
    tone: "gris-pedido",
  },
  CANCELLED: {
    label: "Cancelado",
    slug: "cancelados",
    badge: "bg-red-50 text-red-800 ring-red-200",
    dot: "bg-[#f1556c]",
    tone: "rojo",
  },
};

export function statusFromSlug(slug: string | undefined): OrderStatus | null {
  return ORDER_STATUSES.find((s) => STATUS_META[s].slug === slug) ?? null;
}

// Solo se puede avanzar al siguiente paso o cancelar mientras no se haya enviado.
// Entregado y Cancelado son finales.
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["PAID", "CANCELLED"],
  PAID: ["PREPARING", "CANCELLED"],
  PREPARING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export const adminDateFormat = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Mexico_City",
});
