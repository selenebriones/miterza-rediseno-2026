import "server-only";

import { connection } from "next/server";
import { auth } from "@/auth";

// Sesión del visitante en páginas de la tienda. `connection()` marca el render como de petición
// antes de que Auth.js use crypto; sin eso, Cache Components lo trata como valor inestable.
export async function getSession() {
  await connection();
  return auth();
}
