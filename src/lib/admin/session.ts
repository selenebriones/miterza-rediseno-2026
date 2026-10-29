import "server-only";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { AdminPermission } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { hasPermission } from "./permissions";

export type AdminUser = { id: string; name: string | null; email: string; permissions: AdminPermission[] };

// Capa de acceso del panel. Lee la sesión y vuelve a consultar al usuario en la base:
// si se le quita el rol, un permiso o se desactiva, surte efecto en la siguiente petición.
export async function getAdminUser(): Promise<AdminUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, permissions: true, role: true, isActive: true },
  });
  if (!user || user.role !== "ADMIN" || !user.isActive) return null;
  return { id: user.id, name: user.name, email: user.email, permissions: user.permissions };
}

// Para páginas: sin sesión → login; sin rol o permiso → "sin acceso".
export async function requirePermission(permission: AdminPermission): Promise<AdminUser> {
  const session = await auth();
  if (!session?.user?.id) redirect("/admin/login");
  const user = await getAdminUser();
  if (!user || !hasPermission(user.permissions, permission)) redirect("/admin/sin-acceso");
  return user;
}

// Para acciones: devuelve null en lugar de redirigir, para responder con un error claro.
export async function authorize(permission: AdminPermission): Promise<AdminUser | null> {
  const user = await getAdminUser();
  return user && hasPermission(user.permissions, permission) ? user : null;
}
