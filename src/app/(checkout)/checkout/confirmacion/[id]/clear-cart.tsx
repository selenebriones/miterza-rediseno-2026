"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart/cart-provider";

// El pedido ya se creó: se vacía el carrito guardado en el navegador.
export function ClearCart() {
  const { clear } = useCart();
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}
