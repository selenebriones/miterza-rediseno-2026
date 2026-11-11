// Libreta de direcciones del cliente. Lectura y validación compartidas por "Mi información" y el
// checkout. Las acciones que escriben están en src/app/(tienda)/cuenta/informacion/actions.ts.

import "server-only";
import { normalizePhone, validateField, type CheckoutField } from "./checkout-validation";
import { db } from "./db";

export const MAX_ADDRESSES = 10;

export type SavedAddress = {
  id: string;
  label: string;
  firstName: string;
  lastName: string;
  phone: string;
  street: string;
  neighborhood: string;
  postalCode: string;
  city: string;
  state: string;
  references: string;
  lat: number | null;
  lng: number | null;
  isDefault: boolean;
};

export const ADDRESS_FIELDS = [
  "label",
  "firstName",
  "lastName",
  "phone",
  "street",
  "neighborhood",
  "postalCode",
  "city",
  "state",
  "references",
] as const;
export type AddressField = (typeof ADDRESS_FIELDS)[number];
export type AddressValues = Record<AddressField, string>;
export type AddressErrors = Partial<Record<AddressField, string>>;

// La predeterminada primero; luego las más recientes.
export async function getAddresses(userId: string): Promise<SavedAddress[]> {
  const rows = await db.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });
  return rows.map((a) => ({
    id: a.id,
    label: a.label,
    firstName: a.firstName,
    lastName: a.lastName,
    phone: a.phone,
    street: a.street,
    neighborhood: a.neighborhood,
    postalCode: a.postalCode,
    city: a.city,
    state: a.state,
    references: a.references ?? "",
    lat: a.lat === null ? null : Number(a.lat),
    lng: a.lng === null ? null : Number(a.lng),
    isDefault: a.isDefault,
  }));
}

// Mismas reglas que el checkout (nombre, teléfono, calle, CP, estado…) más el nombre de la dirección.
export function validateAddress(values: AddressValues): AddressErrors {
  const errors: AddressErrors = {};
  const label = values.label.trim();
  if (!label) errors.label = "Ponle un nombre, por ejemplo Casa u Oficina.";
  else if (label.length > 40) errors.label = "Usa un nombre más corto.";
  for (const field of ADDRESS_FIELDS) {
    if (field === "label") continue;
    const message = validateField(field as CheckoutField, values[field]);
    if (message) errors[field] = message;
  }
  return errors;
}

export const cleanPhone = normalizePhone;
