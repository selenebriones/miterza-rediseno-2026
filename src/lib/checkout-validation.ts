// Reglas del formulario de checkout. Las usan el navegador (al salir de cada campo) y el
// servidor (al crear el pedido), así los mensajes son los mismos en ambos lados.

import { MEXICAN_STATES } from "./mexico";

export const CHECKOUT_FIELDS = [
  "email",
  "phone",
  "firstName",
  "lastName",
  "street",
  "neighborhood",
  "postalCode",
  "city",
  "state",
  "references",
  "paymentMethodId",
] as const;

export type CheckoutField = (typeof CHECKOUT_FIELDS)[number];
export type CheckoutValues = Record<CheckoutField, string>;
export type CheckoutErrors = Partial<Record<CheckoutField, string>>;

const MAX_LENGTH: Partial<Record<CheckoutField, number>> = { references: 300 };

export function normalizePhone(value: string) {
  return value.replace(/\D/g, "").replace(/^52(?=\d{10}$)/, "");
}

export function validateField(field: CheckoutField, raw: string): string | undefined {
  const value = raw.trim();
  if (value.length > (MAX_LENGTH[field] ?? 120)) return "Es demasiado largo.";
  switch (field) {
    case "email":
      if (!value) return "Escribe tu correo.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return "Revisa tu correo; parece incompleto.";
      return;
    case "phone":
      if (!value) return "Escribe tu teléfono.";
      if (normalizePhone(value).length !== 10) return "Escribe un teléfono de 10 dígitos.";
      return;
    case "postalCode":
      if (!value) return "Escribe tu código postal.";
      if (!/^\d{5}$/.test(value)) return "Escribe un código postal de 5 dígitos.";
      return;
    case "state":
      if (!(MEXICAN_STATES as readonly string[]).includes(value)) return "Elige tu estado.";
      return;
    case "paymentMethodId":
      if (!value) return "Elige cómo quieres pagar.";
      return;
    case "references":
      return; // opcional
    default: {
      const labels: Partial<Record<CheckoutField, string>> = {
        firstName: "tu nombre",
        lastName: "tus apellidos",
        street: "la calle y el número",
        neighborhood: "la colonia",
        city: "la ciudad o municipio",
      };
      if (!value) return `Escribe ${labels[field] ?? "este dato"}.`;
      return;
    }
  }
}

export function validateCheckout(values: CheckoutValues): CheckoutErrors {
  const errors: CheckoutErrors = {};
  for (const field of CHECKOUT_FIELDS) {
    const error = validateField(field, values[field] ?? "");
    if (error) errors[field] = error;
  }
  return errors;
}
