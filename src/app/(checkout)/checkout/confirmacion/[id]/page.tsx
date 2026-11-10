import type { Metadata } from "next";
import { PinMap } from "@/components/checkout/pin-map";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CheckIcon, ClockIcon, ImageIcon, PackageIcon, PhoneIcon, TruckIcon, XCircleIcon } from "lucide-react";
import { STATUS_META } from "@/lib/order-status";
import { getOrderForConfirmation } from "@/lib/orders";
import { formatOrderNumber, formatPrice, storeConfig, taxLabel } from "@/lib/store-config";
import { cn } from "@/lib/utils";
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
const stepDateFormat = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Mexico_City",
});

async function Confirmation({ params }: Pick<PageProps<"/checkout/confirmacion/[id]">, "params">) {
  const order = await getOrderForConfirmation((await params).id);
  if (!order) notFound();

  const hasPin = order.shippingLat !== null && order.shippingLng !== null;
  // Avance del pedido: 0 por pagar, 1 pagado, 2 preparando, 3 enviado, 4 entregado (cancelado aparte).
  const rank = ["PENDING_PAYMENT", "PAID", "PREPARING", "SHIPPED", "DELIVERED"].indexOf(order.status);
  const cancelled = order.status === "CANCELLED";
  const stepState = (doneFrom: number, currentAt: number[]): StepState =>
    rank >= doneFrom ? "done" : currentAt.includes(rank) ? "current" : "next";
  // Fecha en que el pedido llegó a cada estado (del historial).
  const reachedAt = (status: string) => {
    const change = order.statusHistory.findLast((h) => h.toStatus === status);
    return change ? stepDateFormat.format(change.createdAt) : undefined;
  };
  const rowClass = "flex justify-between gap-4 border-b border-black/10 pb-3 text-sm md:text-base";

  return (
    <>
      <ClearCart />

      {/* Encabezado: confirmación, número de pedido y a dónde le escribiremos. */}
      <section className="bg-brand text-white">
        <div className="container py-10 text-center lg:py-14">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-accent text-brand">
            <CheckIcon className="size-8" strokeWidth={2.5} aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-[1.75rem] leading-tight font-bold text-balance text-white lg:text-[2.75rem]">
            ¡Gracias, {order.firstName}!
            {/* Siempre en su propia línea, sin importar el largo del nombre. */}
            <span className="block text-accent">Recibimos tu pedido</span>
          </h1>
          <p className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            <span className="rounded-pill bg-accent px-4 py-1.5 font-bold tracking-wide text-brand">
              Pedido {formatOrderNumber(order.number)}
            </span>
            <span className="rounded-pill bg-white/15 px-3 py-1.5 text-sm font-semibold text-white">
              {STATUS_META[order.status].label}
            </span>
            <span className="text-white/80">{dateFormat.format(order.createdAt)}</span>
          </p>
          <p className="mx-auto mt-4 max-w-xl text-white/85">
            Guarda este número. Te contactaremos a <strong className="text-white">{order.email}</strong> o al{" "}
            <strong className="text-white">{order.phone}</strong>.
          </p>
        </div>
      </section>

      <div className="container grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_25rem] lg:gap-12 lg:py-14">
        <div className="space-y-8">
          {/* Qué sigue: dónde está el pedido y qué tiene que hacer el cliente. */}
          <section aria-labelledby="que-sigue">
            <h2 id="que-sigue" className="text-2xl font-bold text-black">
              Estado de tu pedido
            </h2>
            {cancelled ? (
              <p className="mt-5 flex gap-3 rounded-2xl border-2 border-destructive/30 bg-destructive/5 p-4 text-heading">
                <XCircleIcon className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
                <span>
                  <strong className="block">Pedido cancelado</strong>
                  {reachedAt("CANCELLED") && <span className="block text-sm">{reachedAt("CANCELLED")}</span>}
                  <span className="mt-1 block text-[0.9375rem]">
                    Si tienes dudas sobre la cancelación, llámanos y menciona tu número de pedido.
                  </span>
                </span>
              </p>
            ) : (
              <ol className="mt-5">
                <Step state="done" title="Pedido recibido" date={stepDateFormat.format(order.createdAt)}>
                  Registramos tu pedido con el número de arriba.
                </Step>
                <Step
                  state={stepState(1, [0])}
                  title={rank === 0 ? `Pago: ${order.paymentMethod.name.toLowerCase()}` : "Pago confirmado"}
                  date={reachedAt("PAID")}
                >
                  {rank === 0 ? (
                    order.paymentMethod.instructions && (
                      <span className="block whitespace-pre-line">{order.paymentMethod.instructions}</span>
                    )
                  ) : (
                    "Recibimos tu pago."
                  )}
                </Step>
                <Step state={stepState(3, [1, 2])} title="Preparando tu pedido" date={reachedAt("PREPARING")}>
                  {rank >= 3
                    ? "Tu pedido quedó listo para enviarse."
                    : rank >= 1
                      ? "Estamos preparando tu pedido para enviarlo."
                      : "Lo preparamos en cuanto confirmemos tu pago."}
                </Step>
                <Step state={stepState(4, [3])} title="Enviado" date={reachedAt("SHIPPED")}>
                  {rank >= 3 ? (
                    <>
                      Tu pedido va en camino{order.shippingCarrier ? ` con ${order.shippingCarrier}` : ""}.
                      {order.trackingNumber && (
                        <span className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="text-sm">Número de guía:</span>
                          <span className="rounded-pill bg-white px-3 py-1 font-bold tracking-wide text-heading tabular-nums select-all">
                            {order.trackingNumber}
                          </span>
                        </span>
                      )}
                    </>
                  ) : (
                    "Te avisaremos cuando salga, con su número de guía."
                  )}
                </Step>
                <Step state={rank >= 4 ? "done" : "next"} title="Entregado" date={reachedAt("DELIVERED")} last>
                  {rank >= 4 ? "Entregamos tu pedido. ¡Gracias por tu compra!" : "Te avisaremos cuando llegue a tu domicilio."}
                </Step>
              </ol>
            )}
          </section>

          {/* Envío: dirección a la izquierda y, si lo puso, el pin del mapa a la derecha. */}
          <section aria-labelledby="envio" className="rounded-[28px] bg-mist p-6 md:p-8">
            <div className={hasPin ? "grid gap-6 sm:grid-cols-2" : undefined}>
              <div>
                <h2 id="envio" className="flex items-center gap-2 text-sm font-bold tracking-widest text-brand uppercase">
                  <TruckIcon className="size-4" aria-hidden="true" />
                  Envío a
                </h2>
                <address className="mt-3 not-italic">
                  <span className="block text-xl font-bold text-heading">
                    {order.firstName} {order.lastName}
                  </span>
                  <span className="mt-1 block">
                    {order.shippingStreet}, {order.shippingNeighborhood}
                  </span>
                  <span className="block">
                    {order.shippingPostalCode} {order.shippingCity}, {order.shippingState}
                  </span>
                  {order.shippingReferences && (
                    <span className="mt-2 block text-sm">Referencias: {order.shippingReferences}</span>
                  )}
                </address>
              </div>
              {hasPin && (
                <PinMap lat={order.shippingLat!} lng={order.shippingLng!} className="h-48 sm:h-full sm:min-h-44" />
              )}
            </div>
          </section>

          <p className="flex items-center gap-2 text-sm">
            <PhoneIcon className="size-4 shrink-0 text-brand" aria-hidden="true" />
            <span>
              ¿Dudas con tu pedido? Llámanos al{" "}
              <a href={storeConfig.supportPhoneHref} className="font-semibold text-brand underline underline-offset-2">
                {storeConfig.supportPhone}
              </a>{" "}
              y menciona tu número de pedido.
            </span>
          </p>
        </div>

        {/* Resumen con el mismo estilo que el del carrito. */}
        <aside aria-labelledby="resumen" className="h-fit rounded-[28px] bg-mist p-6 md:p-8 lg:sticky lg:top-8">
          <h2 id="resumen" className="text-2xl font-bold text-black">
            Resumen
          </h2>
          <ul className="mt-5 space-y-4 border-b border-black/10 pb-5">
            {order.items.map((item) => (
              <li key={item.id} className="flex gap-3">
                <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-white">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <ImageIcon className="size-5 text-brand/40" aria-hidden="true" />
                  )}
                </span>
                <span className="min-w-0 flex-1 text-sm">
                  <Link href={`/productos/${item.productSlug}`} className="font-semibold text-heading hover:underline">
                    {item.productName}
                  </Link>
                  {item.variantLabel && <span className="mt-0.5 block">{item.variantLabel}</span>}
                  <span className="mt-0.5 block">
                    {item.quantity} × {formatPrice(item.unitPrice)}
                  </span>
                </span>
                <span className="text-sm font-semibold text-heading tabular-nums">{formatPrice(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-3">
            <div className={rowClass}>
              <dt className="font-bold text-brand">Subtotal:</dt>
              <dd className="text-black tabular-nums">{formatPrice(order.subtotal)}</dd>
            </div>
            {order.discount > 0 && (
              <div className={rowClass}>
                <dt className="font-bold text-brand">Descuento{order.couponCode ? ` (${order.couponCode})` : ""}:</dt>
                <dd className="text-black tabular-nums">−{formatPrice(order.discount)}</dd>
              </div>
            )}
            <div className={rowClass}>
              <dt className="font-bold text-brand">Envío:</dt>
              <dd className="text-black tabular-nums">
                {order.shippingCost === 0 ? "Gratis" : formatPrice(order.shippingCost)}
              </dd>
            </div>
            {order.tax > 0 && (
              <div className={rowClass}>
                <dt className="font-bold text-brand">{taxLabel}:</dt>
                <dd className="text-black tabular-nums">{formatPrice(order.tax)}</dd>
              </div>
            )}
            <div className="flex items-baseline justify-between gap-4 pt-1">
              <dt className="font-bold text-brand">Total:</dt>
              <dd className="text-2xl font-bold text-black tabular-nums">{formatPrice(order.total)}</dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/productos"
              className="inline-flex h-12 items-center justify-center rounded-pill bg-brand px-6 font-semibold text-white transition-colors hover:bg-accent hover:text-brand"
            >
              Seguir comprando
            </Link>
            <Link
              href="/cuenta"
              className="inline-flex h-12 items-center justify-center rounded-pill border border-brand bg-white px-6 font-semibold text-brand transition-colors hover:bg-brand hover:text-white"
            >
              Ver mis pedidos
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}

// Paso de la línea de tiempo de "¿Qué sigue?": hecho (palomita), actual (resaltado) o pendiente.
type StepState = "done" | "current" | "next";

function Step({
  state,
  title,
  date,
  last = false,
  children,
}: {
  state: StepState;
  title: string;
  date?: string;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="relative flex gap-4 pb-6 last:pb-0" aria-current={state === "current" ? "step" : undefined}>
      {!last && <span aria-hidden="true" className="absolute top-10 bottom-0 left-5 w-0.5 -translate-x-1/2 bg-line" />}
      <span
        className={cn(
          "relative grid size-10 shrink-0 place-items-center rounded-full",
          state === "done" && "bg-brand text-white",
          state === "current" && "bg-accent text-brand ring-4 ring-accent/30",
          state === "next" && "border-2 border-line bg-white text-muted-foreground",
        )}
      >
        {state === "done" ? (
          <CheckIcon className="size-5" strokeWidth={2.5} aria-hidden="true" />
        ) : state === "current" ? (
          <ClockIcon className="size-5" aria-hidden="true" />
        ) : (
          <PackageIcon className="size-5" aria-hidden="true" />
        )}
        <span className="sr-only">{state === "done" ? "Hecho" : state === "current" ? "En curso" : "Pendiente"}</span>
      </span>
      <div
        className={cn(
          "min-w-0 flex-1 pt-1.5",
          state === "current" && "-mt-1 rounded-2xl border-2 border-accent bg-accent-light/40 p-4 pt-3",
        )}
      >
        <h3 className={cn("font-bold", state === "next" ? "text-muted-foreground" : "text-heading")}>{title}</h3>
        {date && state !== "next" && <p className="text-xs text-muted-foreground">{date}</p>}
        <div className="mt-1 text-[0.9375rem]">{children}</div>
      </div>
    </li>
  );
}
