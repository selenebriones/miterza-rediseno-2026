"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { forgetDeletedAccount } from "@/app/(acceso)/cuenta/actions";
import { useCart } from "@/components/cart/cart-provider";

// Se muestra cuando la sesión de este navegador es de una cuenta que el panel eliminó. El carrito vive en
// el navegador (no en la base), así que se vacía aquí: lo que no llegó a ser pedido se va con la cuenta.
// Después se borra la cookie de sesión para que no se repita y el visitante siga como invitado.
export function DeletedAccountCleanup() {
  const { clear } = useCart();
  const router = useRouter();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    clear();
    void forgetDeletedAccount().then(() => router.refresh());
  }, [clear, router]);

  return null;
}
