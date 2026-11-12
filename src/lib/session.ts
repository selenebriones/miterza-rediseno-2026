import "server-only";

import { connection } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// Sesión del visitante en páginas y acciones de la tienda. `connection()` marca el render como de petición
// antes de que Auth.js use crypto; sin eso, Cache Components lo trata como valor inestable.
// La sesión es un JWT que dura 8 horas: por eso se vuelve a revisar en la base que la cuenta siga
// existiendo y activa. Si el panel bloquea o elimina al cliente, pierde el acceso en la siguiente petición.
export async function getSessionState() {
  await connection();
  const session = await auth();
  if (!session?.user?.id) return { session, accountDeleted: false };
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { isActive: true } });
  // accountDeleted: la cookie es de una cuenta que el panel eliminó (no de una bloqueada).
  return { session: user?.isActive ? session : null, accountDeleted: !user };
}

export async function getSession() {
  return (await getSessionState()).session;
}
