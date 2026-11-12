// Permisos del panel. Sin dependencias de servidor: lo usa también el menú.

import type { AdminPermission } from "@/generated/prisma/enums";

export function hasPermission(granted: readonly AdminPermission[], needed: AdminPermission) {
  return granted.includes("SUPER_ADMIN") || granted.includes(needed);
}

export const ADMIN_NAV = [
  { href: "/admin/pedidos", label: "Pedidos", icon: "orders", permission: "MANAGE_ORDERS", ready: true },
  { href: "/admin/productos", label: "Productos", icon: "products", permission: "MANAGE_CATALOG", ready: true },
  { href: "/admin/contenido", label: "Contenido", icon: "content", permission: "MANAGE_CONTENT", ready: true },
  { href: "/admin/pagos", label: "Pagos", icon: "payments", permission: "MANAGE_PAYMENTS", ready: false },
  { href: "/admin/clientes", label: "Clientes", icon: "customers", permission: "MANAGE_CUSTOMERS", ready: false },
  { href: "/admin/usuarios", label: "Usuarios", icon: "admins", permission: "SUPER_ADMIN", ready: true },
] as const satisfies readonly {
  href: string;
  label: string;
  icon: string;
  permission: AdminPermission;
  ready: boolean;
}[];
