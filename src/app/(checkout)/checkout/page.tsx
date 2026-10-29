import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getEnabledPaymentMethods } from "@/lib/payments";

export const metadata: Metadata = {
  title: "Finalizar compra | Mi Terza",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const paymentMethods = await getEnabledPaymentMethods();
  return <CheckoutForm paymentMethods={paymentMethods} />;
}
