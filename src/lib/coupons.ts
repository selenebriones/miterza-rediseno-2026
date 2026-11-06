import "server-only";

// Códigos de descuento. Provisional: pasarán a una tabla administrable desde el panel.
// El monto es fijo en pesos y se resta del subtotal antes de calcular el IVA.
const COUPONS: Record<string, number> = {
  "0801": 500,
};

export type Coupon = { code: string; amount: number };

export const normalizeCouponCode = (code: string) => code.trim().toUpperCase();

export function findCoupon(rawCode: string): Coupon | null {
  const code = normalizeCouponCode(rawCode);
  const amount = COUPONS[code];
  return amount ? { code, amount } : null;
}
