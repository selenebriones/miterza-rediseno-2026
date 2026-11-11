"use server";

import { refresh } from "next/cache";
import {
  ADDRESS_FIELDS,
  MAX_ADDRESSES,
  cleanPhone,
  validateAddress,
  type AddressErrors,
  type AddressValues,
} from "@/lib/addresses";
import { db } from "@/lib/db";
import { parseLocation } from "@/lib/location";
import { getSession } from "@/lib/session";

// Libreta de direcciones. Cada acción trabaja solo con las direcciones del cliente de la sesión.

export type AddressFormState = {
  status?: "saved" | "error";
  message?: string;
  fieldErrors?: AddressErrors;
  values?: AddressValues;
};

async function getCustomerId() {
  const session = await getSession();
  return session?.user?.role === "CUSTOMER" ? session.user.id : null;
}

export async function saveAddress(_prev: AddressFormState, formData: FormData): Promise<AddressFormState> {
  const userId = await getCustomerId();
  if (!userId) return { status: "error", message: "Tu sesión terminó. Inicia sesión de nuevo." };

  const values = Object.fromEntries(
    ADDRESS_FIELDS.map((f) => [f, String(formData.get(f) ?? "").trim()]),
  ) as AddressValues;
  const fieldErrors = validateAddress(values);
  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Revisa los datos marcados.", fieldErrors, values };
  }

  const id = String(formData.get("id") ?? "");
  const location = parseLocation(formData.get("lat"), formData.get("lng"));
  const data = {
    label: values.label,
    firstName: values.firstName,
    lastName: values.lastName,
    phone: cleanPhone(values.phone),
    street: values.street,
    neighborhood: values.neighborhood,
    postalCode: values.postalCode,
    city: values.city,
    state: values.state,
    references: values.references || null,
    lat: location?.lat ?? null,
    lng: location?.lng ?? null,
  };

  const count = await db.address.count({ where: { userId } });
  // La primera dirección siempre es la predeterminada.
  const makeDefault = formData.get("isDefault") === "on" || count === 0;

  if (id) {
    const own = await db.address.findFirst({ where: { id, userId }, select: { id: true } });
    if (!own) return { status: "error", message: "No encontramos esa dirección.", values };
  } else if (count >= MAX_ADDRESSES) {
    return { status: "error", message: `Puedes guardar hasta ${MAX_ADDRESSES} direcciones.`, values };
  }

  await db.$transaction(async (tx) => {
    if (makeDefault) await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    if (id) await tx.address.update({ where: { id }, data: { ...data, ...(makeDefault ? { isDefault: true } : {}) } });
    else await tx.address.create({ data: { ...data, userId, isDefault: makeDefault } });
  });
  refresh();
  return { status: "saved", message: id ? "Actualizamos tu dirección." : "Guardamos tu dirección." };
}

export async function deleteAddress(id: string) {
  const userId = await getCustomerId();
  if (!userId) return;
  const address = await db.address.findFirst({ where: { id, userId }, select: { isDefault: true } });
  if (!address) return;
  await db.$transaction(async (tx) => {
    await tx.address.delete({ where: { id } });
    // Si era la predeterminada, pasa a serlo la más reciente que quede.
    if (address.isDefault) {
      const next = await tx.address.findFirst({ where: { userId }, orderBy: { updatedAt: "desc" } });
      if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  });
  refresh();
}

export async function setDefaultAddress(id: string) {
  const userId = await getCustomerId();
  if (!userId) return;
  const own = await db.address.findFirst({ where: { id, userId }, select: { id: true } });
  if (!own) return;
  await db.$transaction([
    db.address.updateMany({ where: { userId }, data: { isDefault: false } }),
    db.address.update({ where: { id }, data: { isDefault: true } }),
  ]);
  refresh();
}
