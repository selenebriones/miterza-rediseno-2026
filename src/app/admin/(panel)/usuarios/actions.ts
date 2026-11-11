"use server";

import { redirect } from "next/navigation";
import type { AdminPermission } from "@/generated/prisma/enums";
import { ADMIN_NAV } from "@/lib/admin/permissions";
import { authorize } from "@/lib/admin/session";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export type AdministratorFormState = { status: "idle" | "error"; message?: string };

class AdministratorFormError extends Error {}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD = 8;
const ALLOWED_PERMISSIONS = new Set<AdminPermission>(ADMIN_NAV.map((item) => item.permission));

function parseCore(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 254);
  if (!name) throw new AdministratorFormError("Escribe el nombre del usuario.");
  if (!EMAIL.test(email)) throw new AdministratorFormError("Escribe un correo válido, por ejemplo nombre@correo.com.");

  const permissions = formData
    .getAll("permissions")
    .filter((value): value is AdminPermission => typeof value === "string" && ALLOWED_PERMISSIONS.has(value as AdminPermission));

  return { name, email, permissions: [...new Set(permissions)], isActive: formData.get("isActive") === "on" };
}

function saveErrorMessage(error: unknown) {
  if ((error as { code?: string } | null)?.code === "P2002") {
    return "Ya existe una cuenta con ese correo.";
  }
  console.error("Error al guardar el usuario del panel", error);
  return "No pudimos guardar el usuario. Intenta de nuevo.";
}

export async function createAdministrator(
  _prev: AdministratorFormState,
  formData: FormData,
): Promise<AdministratorFormState> {
  const admin = await authorize("SUPER_ADMIN");
  if (!admin) return { status: "error", message: "Tu sesión ya no puede administrar usuarios." };

  let data: ReturnType<typeof parseCore>;
  try {
    data = parseCore(formData);
  } catch (error) {
    if (error instanceof AdministratorFormError) return { status: "error", message: error.message };
    throw error;
  }

  const password = String(formData.get("password") ?? "");
  if (password.length < MIN_PASSWORD) {
    return { status: "error", message: `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.` };
  }
  if (password.length > 200) return { status: "error", message: "La contraseña es demasiado larga." };

  try {
    await db.user.create({
      data: { ...data, role: "ADMIN", passwordHash: await hashPassword(password) },
    });
  } catch (error) {
    return { status: "error", message: saveErrorMessage(error) };
  }

  redirect("/admin/usuarios");
}

export async function updateAdministrator(
  _prev: AdministratorFormState,
  formData: FormData,
): Promise<AdministratorFormState> {
  const admin = await authorize("SUPER_ADMIN");
  if (!admin) return { status: "error", message: "Tu sesión ya no puede administrar usuarios." };

  const userId = String(formData.get("userId") ?? "");
  if (!/^[a-z0-9]{20,40}$/.test(userId)) return { status: "error", message: "Usuario no válido." };

  let data: ReturnType<typeof parseCore>;
  try {
    data = parseCore(formData);
  } catch (error) {
    if (error instanceof AdministratorFormError) return { status: "error", message: error.message };
    throw error;
  }

  if (userId === admin.id && !data.isActive) {
    return { status: "error", message: "No puedes desactivar tu propia cuenta." };
  }
  if (userId === admin.id && !data.permissions.includes("SUPER_ADMIN")) {
    return { status: "error", message: "No puedes quitarte tu propio permiso de Superadministrador." };
  }

  try {
    const updated = await db.user.updateMany({ where: { id: userId, role: "ADMIN" }, data });
    if (updated.count === 0) return { status: "error", message: "No encontramos este usuario del panel." };
  } catch (error) {
    return { status: "error", message: saveErrorMessage(error) };
  }

  redirect("/admin/usuarios");
}
