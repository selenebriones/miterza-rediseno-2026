"use server";

import { findCoupon, type Coupon } from "@/lib/coupons";

export type CouponResult = { ok: true; coupon: Coupon } | { ok: false; message: string };

// El navegador solo guarda el código; el monto lo decide el servidor (aquí y al crear el pedido).
export async function checkCoupon(code: string): Promise<CouponResult> {
  if (!code.trim()) return { ok: false, message: "Escribe un código de descuento." };
  const coupon = findCoupon(code);
  return coupon ? { ok: true, coupon } : { ok: false, message: "El código de descuento no es válido." };
}
