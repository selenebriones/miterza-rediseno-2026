"use server";

import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { blindSizeLabel, blindSizeLimits, validateBlindSize } from "@/lib/blind-size";
import { parseCartLines, variantForCartSelect, variantLabelOf } from "@/lib/cart";
import {
  CHECKOUT_FIELDS,
  normalizePhone,
  validateCheckout,
  type CheckoutErrors,
  type CheckoutValues,
} from "@/lib/checkout-validation";
import { CACHE_TAGS, db } from "@/lib/db";
import { findCoupon } from "@/lib/coupons";
import { computeTotals } from "@/lib/store-config";

export type CheckoutState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: CheckoutErrors;
  values?: Partial<CheckoutValues>; // para conservar lo capturado si algo falla
  cartIssue?: boolean; // el problema está en el carrito (stock, disponibilidad): se ofrece volver a él
};

// Error esperado (stock, disponibilidad, método de pago): su mensaje se muestra tal cual al usuario.
class CheckoutError extends Error {
  constructor(
    message: string,
    readonly cartIssue = true,
  ) {
    super(message);
  }
}

export async function placeOrder(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const values = Object.fromEntries(
    CHECKOUT_FIELDS.map((field) => [field, String(formData.get(field) ?? "").trim()]),
  ) as CheckoutValues;

  // Para comprar hay que tener cuenta (la página ya lo exige; aquí se vuelve a revisar).
  const session = await auth();
  if (!session?.user?.id) redirect("/cuenta/ingresar?desde=/checkout");

  // Campo trampa: invisible para personas; si viene lleno, es un bot.
  if (formData.get("website")) return { status: "error", message: "No pudimos procesar tu pedido.", values };

  const fieldErrors = validateCheckout(values);
  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Revisa los datos marcados.", fieldErrors, values };
  }

  let rawItems: unknown;
  try {
    rawItems = JSON.parse(String(formData.get("items") ?? ""));
  } catch {
    rawItems = null;
  }
  const lines = parseCartLines(rawItems);
  if (!lines) return { status: "error", message: "Tu carrito está vacío o no es válido.", values, cartIssue: true };

  const couponCode = String(formData.get("coupon") ?? "").trim();
  const coupon = couponCode ? findCoupon(couponCode) : null;
  if (couponCode && !coupon) {
    return {
      status: "error",
      message: "El código de descuento ya no es válido. Quítalo en tu carrito para continuar.",
      values,
      cartIssue: true,
    };
  }

  let orderId: string;
  try {
    orderId = await db.$transaction(async (tx) => {
      const paymentMethod = await tx.paymentMethod.findFirst({
        where: { id: values.paymentMethodId, isEnabled: true },
        select: { id: true },
      });
      if (!paymentMethod)
        throw new CheckoutError("El método de pago elegido ya no está disponible. Elige otro.", false);

      // Precios y existencias se leen de la base: el navegador solo indica qué y cuánto.
      const variants = await tx.productVariant.findMany({
        where: { id: { in: lines.map((l) => l.variantId) } },
        select: variantForCartSelect,
      });

      const items = lines.map((line) => {
        const variant = variants.find((v) => v.id === line.variantId);
        if (!variant || !variant.isActive || variant.product.status !== "ACTIVE") {
          throw new CheckoutError("Uno de los productos ya no está disponible. Revisa tu carrito.");
        }
        if (variant.stock < line.quantity) {
          throw new CheckoutError(
            variant.stock === 0
              ? `${variant.product.name} se agotó. Quítalo de tu carrito para continuar.`
              : `${variant.stock === 1 ? "Solo queda 1 pieza" : `Solo quedan ${variant.stock} piezas`} de ${variant.product.name}. Ajusta la cantidad en tu carrito.`,
          );
        }
        // Persianas: la medida es obligatoria y tiene que estar dentro de los límites del producto.
        const limits = blindSizeLimits((variant.product.specs ?? []) as { label: string; value: string }[]);
        if (limits) {
          if (!line.size) {
            throw new CheckoutError(`Agrega las medidas de ${variant.product.name} en su ficha para continuar.`);
          }
          const sizeErrors = Object.values(validateBlindSize(line.size, limits));
          if (sizeErrors.length > 0) throw new CheckoutError(`${variant.product.name}: ${sizeErrors[0]}`);
        }
        const unitPrice = Number(variant.price);
        return {
          variantId: variant.id,
          productName: variant.product.name,
          productSlug: variant.product.slug,
          variantLabel: limits && line.size ? blindSizeLabel(line.size) : variantLabelOf(variant),
          sku: variant.sku,
          imageUrl: variant.product.images[0]?.url ?? null,
          unitPrice,
          quantity: line.quantity,
          lineTotal: unitPrice * line.quantity,
        };
      });

      const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
      const { shipping: shippingCost, discount, total } = computeTotals(subtotal, coupon?.amount);

      const order = await tx.order.create({
        data: {
          userId: session.user.id,
          email: values.email.toLowerCase(),
          phone: normalizePhone(values.phone),
          firstName: values.firstName,
          lastName: values.lastName,
          shippingStreet: values.street,
          shippingNeighborhood: values.neighborhood,
          shippingPostalCode: values.postalCode,
          shippingCity: values.city,
          shippingState: values.state,
          shippingReferences: values.references || null,
          subtotal,
          shippingCost,
          discount,
          couponCode: coupon && discount > 0 ? coupon.code : null,
          total, // subtotal − descuento + envío + IVA (el IVA se obtiene restando lo demás)
          paymentMethodId: paymentMethod.id,
          items: { create: items },
          statusHistory: { create: { toStatus: "PENDING_PAYMENT" } },
        },
        select: { id: true },
      });

      // Descuento condicionado: si otra compra se llevó las piezas un instante antes,
      // no se actualiza ninguna fila y la transacción completa se revierte.
      for (const item of items) {
        const updated = await tx.productVariant.updateMany({
          where: { id: item.variantId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          throw new CheckoutError(`${item.productName} ya no tiene suficientes piezas. Revisa tu carrito.`);
        }
      }

      return order.id;
    });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return { status: "error", message: error.message, values, cartIssue: error.cartIssue };
    }
    console.error("Error al crear el pedido", error);
    return {
      status: "error",
      message: "No pudimos crear tu pedido por un problema de nuestro lado. Intenta de nuevo en un momento.",
      values,
    };
  }

  // Cambiaron existencias: el catálogo se actualiza en las siguientes visitas.
  revalidateTag(CACHE_TAGS.catalog, "max");
  redirect(`/checkout/confirmacion/${orderId}`);
}
