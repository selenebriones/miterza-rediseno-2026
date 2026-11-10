// Datos generales de la tienda. Pasarán a una tabla de configuración del panel;
// mientras tanto, los valores marcados con "confirmar" son provisionales.

export const storeConfig = {
  name: "Mi Terza",
  // confirmar con el cliente: dominio final (se usa en URLs absolutas de datos estructurados)
  siteUrl: "https://miterza.com",
  supportPhone: "(800) 228 3792",
  supportPhoneHref: "tel:+528002283792",
  supportEmail: "soporte@miterza.com",
  // confirmar con el cliente: monto mínimo para envío gratis (MXN)
  freeShippingThreshold: 999,
  // confirmar con el cliente: costo de envío estándar debajo del monto de envío gratis (MXN)
  shippingFlatRate: 199,
  // IVA sobre el subtotal de productos (los precios del catálogo van sin IVA).
  taxRate: 0.16,
  social: [
    { network: "facebook", label: "Facebook", url: "https://www.facebook.com/TerzaMexico" },
    { network: "instagram", label: "Instagram", url: "https://www.instagram.com/terzamexico" },
    { network: "youtube", label: "YouTube", url: "https://www.youtube.com/channel/UCnIDmz5VV5tsZ7pMiOvwa1A" },
    { network: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/company/terza-s-a-" },
  ] as const,
};

// Sin centavos cuando el precio es entero: "$1,890" en lugar de "$1,890.00".
// Precio de un producto: los que no tienen precio en el catálogo del cliente ($0) se muestran como
// agotados y sin cifra (no se pueden comprar: el seed les pone existencias en 0).
export const PRICE_TBD = "Precio por confirmar";
export function formatProductPrice(value: number) {
  return value > 0 ? formatPrice(value) : PRICE_TBD;
}

export function formatPrice(value: number) {
  const fractionDigits = Number.isInteger(value) ? 0 : 2;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

// El servidor usa la misma regla al crear el pedido; el navegador solo la muestra.
export function computeShipping(subtotal: number) {
  return subtotal === 0 || subtotal >= storeConfig.freeShippingThreshold ? 0 : storeConfig.shippingFlatRate;
}

const roundCents = (value: number) => Math.round(value * 100) / 100;

// (Subtotal − descuento) + envío ("Gratis" cuenta como 0) + 16 % de IVA sobre el subtotal ya con
// descuento. El envío gratis se decide con el subtotal antes del cupón. Lo usan el carrito, el
// checkout y la acción que crea el pedido, para que el total mostrado y el cobrado coincidan.
export function computeTotals(subtotal: number, couponAmount = 0) {
  const shipping = computeShipping(subtotal);
  const discount = roundCents(Math.min(Math.max(couponAmount, 0), subtotal));
  const taxable = subtotal - discount;
  const tax = roundCents(taxable * storeConfig.taxRate);
  return { subtotal, shipping, discount, tax, total: roundCents(taxable + shipping + tax) };
}

export const taxLabel = `${Math.round(storeConfig.taxRate * 100)}% de IVA`;

export const formatOrderNumber = (number: number) => `MT-${String(number).padStart(6, "0")}`;
