"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRightIcon, EyeIcon, ImageIcon, PackageIcon, TruckIcon } from "lucide-react";
import { StatusBadge } from "@/components/admin/status-badge";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { CustomerOrder } from "@/lib/admin/customers";
import { adminDateFormat } from "@/lib/order-status";
import { formatOrderNumber, formatPrice, taxLabel } from "@/lib/store-config";

// Pedidos del cliente con su estado actual. "Ver detalle" abre el pedido en una ventana sin salir
// del cliente; desde ahí, quien tenga permiso de Pedidos puede abrirlo completo para cambiar su estado.
export function CustomerOrders({ orders, canManageOrders }: { orders: CustomerOrder[]; canManageOrders: boolean }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = orders.find((o) => o.id === openId) ?? null;

  if (orders.length === 0) {
    return (
      <div className="mt-4 flex flex-col items-center rounded-lg bg-surface px-6 py-10 text-center">
        <PackageIcon className="size-8 text-brand" aria-hidden="true" />
        <p className="mt-2 font-semibold text-heading">Aún no tiene pedidos</p>
        <p className="mt-1 text-sm">Cuando compre con su cuenta, sus pedidos aparecerán aquí.</p>
      </div>
    );
  }

  return (
    <>
      <ul className="mt-3 divide-y divide-line">
        {orders.map((order) => (
          <li key={order.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-heading">{formatOrderNumber(order.number)}</p>
              <p className="text-sm">
                {adminDateFormat.format(new Date(order.createdAt))} · {order.pieces}{" "}
                {order.pieces === 1 ? "pieza" : "piezas"}
              </p>
            </div>
            <StatusBadge status={order.status} />
            <span className="w-24 text-right font-semibold text-heading tabular-nums">{formatPrice(order.total)}</span>
            <button
              type="button"
              onClick={() => setOpenId(order.id)}
              className="inline-flex h-10 items-center gap-2 rounded-pill border border-brand px-4 text-sm font-semibold text-brand transition-colors hover:bg-brand hover:text-white"
            >
              <EyeIcon className="size-4" aria-hidden="true" />
              Ver detalle
              <span className="sr-only">del pedido {formatOrderNumber(order.number)}</span>
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={open !== null} onOpenChange={(value) => !value && setOpenId(null)}>
        {open && (
          <DialogContent className="max-h-[92dvh] gap-0 overflow-y-auto rounded-[28px] p-6 sm:max-w-2xl sm:p-8">
            <div className="flex flex-wrap items-center gap-3 border-b border-line pb-4 pr-8">
              <DialogTitle className="text-2xl font-bold text-heading">{formatOrderNumber(open.number)}</DialogTitle>
              <StatusBadge status={open.status} className="text-sm" />
            </div>
            <DialogDescription className="mt-3 text-sm text-body">
              Pedido del {adminDateFormat.format(new Date(open.createdAt))} · Pago: {open.paymentMethod}
            </DialogDescription>

            <h3 className="mt-5 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Productos</h3>
            <ul className="mt-1 divide-y divide-line">
              {open.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-3">
                  <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- miniatura del panel
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

            <dl className="mt-2 ml-auto w-full max-w-xs space-y-1.5 border-t border-line pt-3 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd className="tabular-nums">{formatPrice(open.subtotal)}</dd>
              </div>
              {open.discount > 0 && (
                <div className="flex justify-between">
                  <dt>Descuento{open.couponCode ? ` (${open.couponCode})` : ""}</dt>
                  <dd className="tabular-nums">−{formatPrice(open.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt>Envío</dt>
                <dd className="tabular-nums">{open.shippingCost === 0 ? "Gratis" : formatPrice(open.shippingCost)}</dd>
              </div>
              {open.tax > 0 && (
                <div className="flex justify-between">
                  <dt>{taxLabel}</dt>
                  <dd className="tabular-nums">{formatPrice(open.tax)}</dd>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-heading">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatPrice(open.total)}</dd>
              </div>
            </dl>

            <h3 className="mt-5 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Envío</h3>
            <address className="mt-1 text-sm not-italic">
              <span className="font-medium text-heading">
                {open.firstName} {open.lastName}
              </span>{" "}
              · {open.phone}
              <br />
              {open.shippingStreet}, {open.shippingNeighborhood}
              <br />
              {open.shippingPostalCode} {open.shippingCity}, {open.shippingState}
              {open.shippingReferences && (
                <>
                  <br />
                  Referencias: {open.shippingReferences}
                </>
              )}
            </address>
            {open.trackingNumber && (
              <p className="mt-2 flex items-center gap-2 text-sm font-medium text-heading">
                <TruckIcon className="size-4 text-brand" aria-hidden="true" />
                {open.shippingCarrier} · Guía {open.trackingNumber}
              </p>
            )}

            {canManageOrders && (
              <div className="mt-6 border-t border-line pt-4">
                <Link
                  href={`/admin/pedidos/${open.id}`}
                  className="inline-flex h-11 items-center gap-2 rounded-pill bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-hover"
                >
                  Abrir pedido completo
                  <ArrowUpRightIcon className="size-4" aria-hidden="true" />
                </Link>
                <p className="mt-2 text-xs text-muted-foreground">Ahí puedes cambiar el estado y ver el historial.</p>
              </div>
            )}
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
