import "server-only";

import { db } from "@/lib/db";

// Lecturas del panel: sin caché, para que altas y cambios de acceso aparezcan de inmediato.
export async function listAdministrators() {
  return db.user.findMany({
    where: { role: "ADMIN" },
    orderBy: [{ isActive: "desc" }, { name: "asc" }, { email: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      permissions: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
}

export async function getAdministrator(id: string) {
  if (!/^[a-z0-9]{20,40}$/.test(id)) return null;
  return db.user.findFirst({
    where: { id, role: "ADMIN" },
    select: { id: true, name: true, email: true, permissions: true, isActive: true },
  });
}

export type AdministratorRow = Awaited<ReturnType<typeof listAdministrators>>[number];
export type AdministratorForEdit = NonNullable<Awaited<ReturnType<typeof getAdministrator>>>;
