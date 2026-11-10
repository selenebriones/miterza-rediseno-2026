"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { readReturnPath } from "@/lib/return-path";

// Solo se vuelve a rutas internas de la tienda (evita redirecciones abiertas y mandar al panel).
const safeReturnPath = (value: FormDataEntryValue | null) =>
  readReturnPath(typeof value === "string" ? value : undefined);

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD = 8;

export type AuthFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"firstName" | "lastName" | "email" | "password" | "terms", string>>;
  values?: { firstName?: string; lastName?: string; email?: string };
};

export async function customerLogin(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  try {
    await signIn("credentials", {
      email,
      password: formData.get("password"),
      area: "customer",
      redirectTo: safeReturnPath(formData.get("desde")),
    });
  } catch (error) {
    // Mensaje genérico: no revela si el correo existe.
    if (error instanceof AuthError) return { error: "Correo o contraseña incorrectos.", values: { email } };
    throw error; // la redirección de éxito también llega como excepción
  }
  return {};
}

export async function registerCustomer(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = {
    firstName: String(formData.get("firstName") ?? "").trim(),
    lastName: String(formData.get("lastName") ?? "").trim(),
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
  };
  const password = String(formData.get("password") ?? "");

  const fieldErrors: AuthFormState["fieldErrors"] = {};
  if (!values.firstName) fieldErrors.firstName = "Escribe tu nombre.";
  if (!values.lastName) fieldErrors.lastName = "Escribe tu apellido.";
  if (!EMAIL.test(values.email)) fieldErrors.email = "Escribe un correo válido, por ejemplo nombre@correo.com.";
  if (password.length < MIN_PASSWORD) fieldErrors.password = `Usa al menos ${MIN_PASSWORD} caracteres.`;
  else if (password.length > 200) fieldErrors.password = "La contraseña es demasiado larga.";
  if (formData.get("terms") !== "on") fieldErrors.terms = "Acepta el aviso de privacidad para crear tu cuenta.";
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, values };

  const existing = await db.user.findUnique({ where: { email: values.email }, select: { id: true } });
  if (existing) {
    return {
      fieldErrors: { email: "Ya existe una cuenta con este correo. Inicia sesión o recupera tu contraseña." },
      values,
    };
  }

  await db.user.create({
    data: {
      email: values.email,
      name: `${values.firstName} ${values.lastName}`,
      passwordHash: await hashPassword(password),
      role: "CUSTOMER",
    },
  });

  // Entra de una vez con la cuenta nueva y vuelve a donde estaba (p. ej. el checkout).
  await signIn("credentials", {
    email: values.email,
    password,
    area: "customer",
    redirectTo: safeReturnPath(formData.get("desde")),
  });
  return {};
}

export type RecoverState = { sent?: boolean; error?: string; email?: string };

// Pendiente: falta el servicio de correo. Cuando exista, aquí se crea un token de un solo uso
// (VerificationToken) y se envía el enlace. La respuesta es la misma exista o no el correo.
export async function requestPasswordReset(_prev: RecoverState, formData: FormData): Promise<RecoverState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!EMAIL.test(email)) return { error: "Escribe un correo válido, por ejemplo nombre@correo.com.", email };
  return { sent: true, email };
}

export async function customerLogout() {
  await signOut({ redirectTo: "/" });
}
