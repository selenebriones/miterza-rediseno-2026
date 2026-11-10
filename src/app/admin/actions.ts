"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";

export type LoginState = { error?: string; email?: string };

// Solo se permite volver a rutas del panel (evita redirecciones abiertas a otros sitios).
function safeReturnPath(value: FormDataEntryValue | null) {
  const path = typeof value === "string" ? value : "";
  return path.startsWith("/admin") && !path.startsWith("//") && !path.startsWith("/admin/login")
    ? path
    : "/admin/pedidos";
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  try {
    await signIn("credentials", {
      email,
      password: formData.get("password"),
      area: "admin",
      redirectTo: safeReturnPath(formData.get("desde")),
    });
  } catch (error) {
    // Mensaje genérico: no revela si el correo existe.
    if (error instanceof AuthError) return { error: "Correo o contraseña incorrectos.", email };
    throw error; // la redirección de éxito también llega como excepción
  }
  return {};
}

export async function logout() {
  await signOut({ redirectTo: "/admin/login" });
}
