import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeftIcon, ImageIcon, MailIcon, MessageCircleIcon, PhoneIcon, TruckIcon } from "lucide-react";
import { StatusBadge } from "@/components/admin/status-badge";
import { StatusPanel } from "@/components/admin/status-panel";
import { getOrderDetail } from "@/lib/admin/orders";
import { requirePermission } from "@/lib/admin/session";
import { adminDateFormat, STATUS_META } from "@/lib/order-status";
import { formatOrderNumber, formatPrice } from "@/lib/store-config";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Detalle del pedido" };

export default function OrderDetailPage({ params }: PageProps<"/admin/pedidos/[id]">) {
  return (
    <>
      <Link
        href="/admin/pedidos"
        className="inline-flex min-h-tap items-center gap-2 text-sm font-semibold text-brand hover:underline"
      >
        <ArrowLeftIcon className="size-4" aria-hidden="true" />
        Pedidos
      </Link>
      <Suspense fallback={<div className="mt-4 h-96 animate-pulse rounded-card bg-white" aria-busy="true" />}>
        <OrderDetail params={params} />
      </Suspense>
    </>
  );
}

async function OrderDetail({ params }: Pick<PageProps<"/admin/pedidos/[id]">, "params">) {
  await requirePermission("MANAGE_ORDERS");
  const order = await getOrderDetail((await params).id);
  if (!order) notFound();

  const pieces = order.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="mt-2">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-[1.75rem] leading-tight font-bold lg:text-[2rem]">{formatOrderNumber(order.number)}</h1>
        <StatusBadge status={order.status} className="text-sm" />
        <p className="w-full text-sm sm:ml-auto sm:w-auto">{adminDateFormat.format(order.createdAt)}</p>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7 xl:col-span-8">
          <section aria-labelledby="productos" className="rounded-card bg-white p-5 shadow-card">
            <h2 id="productos" className="text-lg font-bold">
              Productos{" "}
              <span className="font-normal text-body">
                ({pieces} {pieces === 1 ? "pieza" : "piezas"})
              </span>
            </h2>
            <ul className="mt-3 divide-y divide-line">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 py-3">
                  <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt="" className="size-full object-cover" />
                    ) : (
                      <ImageIcon className="size-5 text-brand/40" aria-hidden="true" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="block font-medium text-heading">{item.productName}</span>
                    {item.variantLabel && <span className="block">{item.variantLabel}</span>}
                    <span className="block text-xs text-muted-foreground">SKU {item.sku}</span>
                  </span>
                  <span className="text-right text-sm">
                    <span className="block">
                      {item.quantity} × {formatPrice(item.unitPrice)}
                    </span>
                    <span className="block font-semibold text-heading tabular-nums">{formatPrice(item.lineTotal)}</span>
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 ml-auto max-w-xs space-y-1.5 border-t border-line pt-3 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Envío</dt>
                <dd className="tabular-nums">
                  {order.shippingCost === 0 ? "Gratis" : formatPrice(order.shippingCost)}
                </dd>
              </div>
              <div className="flex justify-between text-base font-bold text-heading">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="historial" className="rounded-card bg-white p-5 shadow-card">
            <h2 id="historial" className="text-lg font-bold">
              Historial
            </h2>
            <ol className="mt-4 space-y-5 border-l-2 border-line pl-5">
              {order.statusHistory.map((change) => (
                <li key={change.id} className="relative">
                  <span
                    className={cn(
                      "absolute top-1.5 -left-[1.6875rem] size-3 rounded-full ring-4 ring-white",
                      STATUS_META[change.toStatus].dot,
                    )}
                    aria-hidden="true"
                  />
                  <p className="font-medium text-heading">
                    {change.fromStatus ? STATUS_META[change.toStatus].label : "Pedido creado"}
                  </p>
                  <p className="text-sm">
                    {adminDateFormat.format(change.createdAt)} ·{" "}
                    {change.user ? (change.user.name ?? change.user.email) : "Tienda en línea"}
                  </p>
                  {change.note && (
                    <p className="mt-1 rounded-lg bg-muted px-3 py-2 text-sm whitespace-pre-line">{change.note}</p>
                  )}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="space-y-6 lg:col-span-5 xl:col-span-4">
          <StatusPanel orderId={order.id} status={order.status} />

          <section aria-labelledby="cliente" className="rounded-card bg-white p-5 shadow-card">
            <h2 id="cliente" className="text-lg font-bold">
              Cliente
            </h2>
            <p className="mt-2 font-medium text-heading">
              {order.firstName} {order.lastName}
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              <li>
                <a
                  href={`mailto:${order.email}`}
                  className="inline-flex min-h-9 items-center gap-2 text-brand hover:underline"
                >
                  <MailIcon className="size-4" aria-hidden="true" />
                  {order.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:+52${order.phone}`}
                  className="inline-flex min-h-9 items-center gap-2 text-brand hover:underline"
                >
                  <PhoneIcon className="size-4" aria-hidden="true" />
                  {order.phone}
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/52${order.phone}?text=${encodeURIComponent(`Hola ${order.firstName}, te escribimos de Mi Terza sobre tu pedido ${formatOrderNumber(order.number)}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-9 items-center gap-2 text-brand hover:underline"
                >
                  <MessageCircleIcon className="size-4" aria-hidden="true" />
                  Escribir por WhatsApp
                </a>
              </li>
            </ul>

            <h3 className="mt-5 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Envío</h3>
            <address className="mt-1 text-sm not-italic">
              {order.shippingStreet}, {order.shippingNeighborhood}
              <br />
              {order.shippingPostalCode} {order.shippingCity}, {order.shippingState}
              {order.shippingReferences && (
                <>
                  <br />
                  Referencias: {order.shippingReferences}
                </>
              )}
            </address>
            {order.trackingNumber && (
              <p className="mt-2 flex items-center gap-2 text-sm font-medium text-heading">
                <TruckIcon className="size-4 text-brand" aria-hidden="true" />
                {order.shippingCarrier} · Guía {order.trackingNumber}
              </p>
            )}

            <h3 className="mt-5 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Pago</h3>
            <p className="mt-1 text-sm">{order.paymentMethod.name}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
