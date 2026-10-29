import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle2Icon, ImageIcon, InfoIcon } from "lucide-react";
import { getOrderForConfirmation } from "@/lib/orders";
import { formatOrderNumber, formatPrice, storeConfig } from "@/lib/store-config";
import { ClearCart } from "./clear-cart";

export const metadata: Metadata = {
  title: "Pedido recibido | Mi Terza",
  robots: { index: false, follow: false },
};

export default function ConfirmationPage({ params }: PageProps<"/checkout/confirmacion/[id]">) {
  return (
    <Suspense
      fallback={
        <div className="container py-16" aria-busy="true">
          <div className="h-96 animate-pulse rounded-card bg-muted" />
        </div>
      }
    >
      <Confirmation params={params} />
    </Suspense>
  );
}

const dateFormat = new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeZone: "America/Mexico_City" });

async function Confirmation({ params }: Pick<PageProps<"/checkout/confirmacion/[id]">, "params">) {
  const order = await getOrderForConfirmation((await params).id);
  if (!order) notFound();

  return (
    <div className="container max-w-3xl py-10 lg:py-16">
      <ClearCart />

      <div className="text-center">
        <CheckCircle2Icon className="mx-auto size-14 text-success" aria-hidden="true" />
        <h1 className="mt-4 text-[1.75rem] leading-tight font-bold lg:text-[2.25rem]">
          ¡Gracias, {order.firstName}! Recibimos tu pedido
        </h1>
        <p className="mt-3 text-lg">
          Pedido <strong className="text-heading">{formatOrderNumber(order.number)}</strong> ·{" "}
          {dateFormat.format(order.createdAt)}
        </p>
        <p className="mt-2">
          Guarda este número. Te contactaremos a <strong className="text-heading">{order.email}</strong> o al{" "}
          <strong className="text-heading">{order.phone}</strong>.
        </p>
      </div>

      {order.status === "PENDING_PAYMENT" && (
        <section aria-labelledby="siguiente-paso" className="mt-10 rounded-card border-2 border-brand bg-surface p-6">
          <h2 id="siguiente-paso" className="flex items-center gap-2 text-lg font-bold">
            <InfoIcon className="size-5 text-brand" aria-hidden="true" />
            Siguiente paso: {order.paymentMethod.name.toLowerCase()}
          </h2>
          {order.paymentMethod.instructions && (
            <p className="mt-2 whitespace-pre-line">{order.paymentMethod.instructions}</p>
          )}
          <p className="mt-3 text-sm">
            ¿Dudas?{" "}
            <a href={storeConfig.supportPhoneHref} className="font-semibold text-brand underline">
              {storeConfig.supportPhone}
            </a>{" "}
            · Menciona tu número de pedido.
          </p>
        </section>
      )}

      <section aria-labelledby="resumen" className="mt-10">
        <h2 id="resumen" className="text-xl font-bold">
          Resumen
        </h2>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-4">
              <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt="" className="size-full object-cover" />
                ) : (
                  <ImageIcon className="size-5 text-brand/40" aria-hidden="true" />
                )}
              </span>
              <span className="min-w-0 flex-1 text-sm">
                <Link href={`/productos/${item.productSlug}`} className="font-medium text-heading hover:underline">
                  {item.productName}
                </Link>
                {item.variantLabel && <span className="block">{item.variantLabel}</span>}
                <span className="block">
                  {item.quantity} × {formatPrice(item.unitPrice)}
                </span>
              </span>
              <span className="font-semibold text-heading tabular-nums">{formatPrice(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 ml-auto max-w-xs space-y-2 text-[0.9375rem]">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Envío</dt>
            <dd className="tabular-nums">{order.shippingCost === 0 ? "Gratis" : formatPrice(order.shippingCost)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-lg font-bold text-heading">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatPrice(order.total)}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="envio" className="mt-10 rounded-card bg-surface p-6">
        <h2 id="envio" className="text-lg font-bold">
          Envío a
        </h2>
        <address className="mt-2 not-italic">
          {order.firstName} {order.lastName}
          <br />
          {order.shippingStreet}, {order.shippingNeighborhood}
          <br />
          {order.shippingPostalCode} {order.shippingCity}, {order.shippingState}
          {order.shippingReferences && (
            <>
              <br />
              <span className="text-sm">Referencias: {order.shippingReferences}</span>
            </>
          )}
        </address>
      </section>

      <div className="mt-10 text-center">
        <Link
          href="/productos"
          className="inline-flex h-12 items-center rounded-pill bg-brand px-8 font-semibold text-white transition-colors hover:bg-accent hover:text-brand"
        >
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}
