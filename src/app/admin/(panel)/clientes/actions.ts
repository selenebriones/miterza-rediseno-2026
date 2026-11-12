"use server";

import { refresh } from "next/cache";
import { authorize } from "@/lib/admin/session";
import { db } from "@/lib/db";

// Acciones del módulo Clientes. Solo tocan cuentas con rol CUSTOMER: un administrador nunca se
// bloquea ni se borra desde aquí (eso es del módulo Administradores).

export type CustomerActionResult = { ok: true; message: string } | { ok: false; message: string };

const ID = /^[a-z0-9]{20,40}$/;

export async function setCustomerActive(id: string, active: boolean): Promise<CustomerActionResult> {
  const admin = await authorize("MANAGE_CUSTOMERS");
  if (!admin) return { ok: false, message: "Tu sesión ya no puede administrar clientes." };
  if (!ID.test(id)) return { ok: false, message: "Cliente no válido." };

  const updated = await db.user.updateMany({ where: { id, role: "CUSTOMER" }, data: { isActive: active } });
  if (updated.count === 0) return { ok: false, message: "No encontramos a este cliente." };
  refresh();
  return {
    ok: true,
    message: active ? "El cliente ya puede entrar a su cuenta." : "Cliente bloqueado: ya no puede entrar a su cuenta.",
  };
}

// Borra la cuenta, sus direcciones y sesiones. Sus pedidos se conservan (quedan como compra sin
// cuenta, con el nombre, correo y dirección que tenían) porque son registro de ventas. El carrito vive
// en el navegador del cliente: se vacía la próxima vez que abra la tienda (DeletedAccountCleanup).
export async function deleteCustomer(id: string): Promise<CustomerActionResult> {
  const admin = await authorize("MANAGE_CUSTOMERS");
  if (!admin) return { ok: false, message: "Tu sesión ya no puede administrar clientes." };
  if (!ID.test(id)) return { ok: false, message: "Cliente no válido." };

  // Antes de borrar se marcan sus pedidos: así el panel los muestra como "Cliente borrado".
  const deleted = await db.$transaction(async (tx) => {
    const own = await tx.user.findFirst({ where: { id, role: "CUSTOMER" }, select: { id: true } });
    if (!own) return 0;
    await tx.order.updateMany({ where: { userId: id }, data: { customerDeletedAt: new Date() } });
    await tx.user.delete({ where: { id } });
    return 1;
  });
  if (deleted === 0) return { ok: false, message: "No encontramos a este cliente." };
  refresh();
  return { ok: true, message: "Cliente eliminado." };
}
