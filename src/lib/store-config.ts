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
  social: [
    { network: "facebook", label: "Facebook", url: "https://www.facebook.com/TerzaMexico" },
    { network: "instagram", label: "Instagram", url: "https://www.instagram.com/terzamexico" },
    { network: "youtube", label: "YouTube", url: "https://www.youtube.com/channel/UCnIDmz5VV5tsZ7pMiOvwa1A" },
    { network: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/company/terza-s-a-" },
  ] as const,
};

// Sin centavos cuando el precio es entero: "$1,890" en lugar de "$1,890.00".
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

export const formatOrderNumber = (number: number) => `MT-${String(number).padStart(6, "0")}`;
