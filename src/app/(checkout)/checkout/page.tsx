import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "@/lib/session";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getEnabledPaymentMethods } from "@/lib/payments";
import { db } from "@/lib/db";
import { getAddresses } from "@/lib/addresses";

export const metadata: Metadata = {
  title: "Finalizar compra | Mi Terza",
  robots: { index: false, follow: false },
};

// Para pagar hay que tener cuenta: sin sesión se manda a ingresar y, al entrar, vuelve aquí.
export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="container h-96 pt-10" />}>
      <Checkout />
    </Suspense>
  );
}

async function Checkout() {
  const session = await getSession();
  if (!session?.user) redirect("/cuenta/ingresar?desde=/checkout");

  const paymentMethods = await getEnabledPaymentMethods();
  // Datos de "Mis datos" (nombre y teléfono) para no volver a escribirlos en cada compra.
  const [user, addresses] = await Promise.all([
    db.user.findUnique({ where: { id: session.user.id }, select: { name: true, phone: true } }),
    getAddresses(session.user.id),
  ]);
  const [firstName = "", ...rest] = (user?.name ?? session.user.name ?? "").split(" ");
  return (
    <CheckoutForm
      paymentMethods={paymentMethods}
      customer={{ email: session.user.email ?? "", firstName, lastName: rest.join(" "), phone: user?.phone ?? "" }}
      addresses={addresses}
    />
  );
}
