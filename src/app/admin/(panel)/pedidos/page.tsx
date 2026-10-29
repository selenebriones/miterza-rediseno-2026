import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeftIcon, ChevronRightIcon, InboxIcon, SearchIcon, XIcon } from "lucide-react";
import { StatusBadge } from "@/components/admin/status-badge";
import type { OrderStatus } from "@/generated/prisma/enums";
import { getStatusCounts, listOrders } from "@/lib/admin/orders";
import { requirePermission } from "@/lib/admin/session";
import { adminDateFormat, ORDER_STATUSES, STATUS_META, statusFromSlug } from "@/lib/order-status";
import { formatOrderNumber, formatPrice } from "@/lib/store-config";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Pedidos" };

type Filters = { status: OrderStatus | null; q: string; page: number };

function ordersHref({ status, q, page }: Filters) {
  const params = new URLSearchParams();
  if (status) params.set("estado", STATUS_META[status].slug);
  if (q) params.set("q", q);
  if (page > 1) params.set("pagina", String(page));
  const query = params.toString();
  return query ? `/admin/pedidos?${query}` : "/admin/pedidos";
}

export default function OrdersPage({ searchParams }: PageProps<"/admin/pedidos">) {
  return (
    <>
      <h1 className="text-[1.75rem] leading-tight font-bold lg:text-[2rem]">Pedidos</h1>
      <Suspense fallback={<OrdersSkeleton />}>
        <Orders searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Orders({ searchParams }: Pick<PageProps<"/admin/pedidos">, "searchParams">) {
  await requirePermission("MANAGE_ORDERS");
  const params = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const filters: Filters = {
    status: statusFromSlug(one(params.estado)),
    q: one(params.q).trim().slice(0, 80),
    page: Math.max(1, Number(one(params.pagina)) || 1),
  };
  const [{ counts, all }, result] = await Promise.all([getStatusCounts(), listOrders(filters)]);

  const tabs: { status: OrderStatus | null; label: string; count: number }[] = [
    { status: null, label: "Todos", count: all },
    ...ORDER_STATUSES.map((s) => ({ status: s, label: STATUS_META[s].label, count: counts[s] ?? 0 })),
  ];

  return (
    <div className="mt-6 space-y-5">
      {/* Pestañas por estado: el filtro más usado, a un toque y con conteo. */}
      <nav aria-label="Filtrar por estado" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
        <ul className="flex gap-2">
          {tabs.map((tab) => {
            const active = tab.status === filters.status;
            return (
              <li key={tab.label} className="shrink-0">
                <Link
                  href={ordersHref({ status: tab.status, q: filters.q, page: 1 })}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-10 items-center gap-2 rounded-pill px-4 text-sm font-medium transition-colors",
                    active ? "bg-brand text-white" : "bg-white text-heading ring-1 ring-line hover:ring-brand",
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      "rounded-pill px-1.5 text-xs font-semibold tabular-nums",
                      active ? "bg-white/20" : "bg-muted text-body",
                    )}
                  >
                    {tab.count}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Formulario GET: funciona sin JavaScript y la búsqueda queda en la URL. */}
      <form action="/admin/pedidos" role="search" className="flex max-w-xl gap-2">
        {filters.status && <input type="hidden" name="estado" value={STATUS_META[filters.status].slug} />}
        <div className="relative flex-1">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <label htmlFor="q" className="sr-only">
            Buscar pedidos
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={filters.q}
            placeholder="Número, correo o nombre…"
            className="h-11 w-full rounded-pill border border-input bg-white pr-4 pl-10 text-base text-heading"
          />
        </div>
        <button type="submit" className="h-11 rounded-pill bg-brand px-5 font-semibold text-white hover:bg-brand-hover">
          Buscar
        </button>
        {filters.q && (
          <Link
            href={ordersHref({ ...filters, q: "", page: 1 })}
            aria-label="Limpiar búsqueda"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-muted-foreground ring-1 ring-line hover:text-brand"
          >
            <XIcon className="size-4" aria-hidden="true" />
          </Link>
        )}
      </form>

      <p aria-live="polite" className="text-sm">
        {result.total} {result.total === 1 ? "pedido" : "pedidos"}
        {filters.q && <> que coinciden con «{filters.q}»</>}
      </p>

      {result.orders.length === 0 ? (
        <div className="flex flex-col items-center rounded-card bg-white px-6 py-14 text-center shadow-card">
          <InboxIcon className="size-10 text-brand" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-bold">
            {filters.q ? "Ningún pedido coincide con tu búsqueda" : "No hay pedidos aquí"}
          </h2>
          <p className="mt-1 text-sm">
            {filters.q
              ? "Prueba con el número de pedido, el correo o el apellido."
              : "Cuando lleguen pedidos con este estado, aparecerán en esta lista."}
          </p>
          {filters.q && (
            <Link href={ordersHref({ ...filters, q: "", page: 1 })} className="mt-4 font-semibold text-brand underline">
              Limpiar búsqueda
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Desktop: tabla. Toda la fila lleva al detalle (enlace estirado en la primera celda). */}
          <div className="hidden overflow-hidden rounded-card bg-white shadow-card md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-white text-xs tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Pedido
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Cliente
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Fecha
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Estado
                  </th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {result.orders.map((order) => (
                  <tr
                    key={order.id}
                    className="relative transition-colors hover:bg-surface has-[a:focus-visible]:bg-surface"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/pedidos/${order.id}`}
                        className="font-semibold text-brand after:absolute after:inset-0 focus-visible:outline-none"
                      >
                        {formatOrderNumber(order.number)}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <span className="block font-medium text-heading">
                        {order.firstName} {order.lastName}
                      </span>
                      <span className="block text-xs">{order.email}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">{adminDateFormat.format(order.createdAt)}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="block font-semibold text-heading tabular-nums">{formatPrice(order.total)}</span>
                      <span className="block text-xs">
                        {order.pieces} {order.pieces === 1 ? "pieza" : "piezas"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Móvil: tarjetas. */}
          <ul className="space-y-3 md:hidden">
            {result.orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/admin/pedidos/${order.id}`}
                  className="block rounded-card bg-white p-4 shadow-card active:bg-surface"
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-brand">{formatOrderNumber(order.number)}</span>
                    <StatusBadge status={order.status} />
                  </span>
                  <span className="mt-2 block font-medium text-heading">
                    {order.firstName} {order.lastName}
                  </span>
                  <span className="mt-1 flex items-center justify-between text-sm">
                    <span>{adminDateFormat.format(order.createdAt)}</span>
                    <span className="font-semibold text-heading tabular-nums">{formatPrice(order.total)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {result.pageCount > 1 && (
            <nav aria-label="Paginación" className="flex items-center justify-between gap-3">
              {result.page > 1 ? (
                <Link
                  href={ordersHref({ ...filters, page: result.page - 1 })}
                  className="inline-flex h-11 items-center gap-1 rounded-pill bg-white px-4 font-medium text-brand ring-1 ring-line hover:ring-brand"
                >
                  <ChevronLeftIcon className="size-4" aria-hidden="true" />
                  Anterior
                </Link>
              ) : (
                <span />
              )}
              <p className="text-sm">
                Página <strong className="text-heading">{result.page}</strong> de {result.pageCount}
              </p>
              {result.page < result.pageCount ? (
                <Link
                  href={ordersHref({ ...filters, page: result.page + 1 })}
                  className="inline-flex h-11 items-center gap-1 rounded-pill bg-white px-4 font-medium text-brand ring-1 ring-line hover:ring-brand"
                >
                  Siguiente
                  <ChevronRightIcon className="size-4" aria-hidden="true" />
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}

function OrdersSkeleton() {
  return (
    <div className="mt-6 space-y-5" aria-busy="true" aria-label="Cargando pedidos">
      <div className="flex gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-10 w-28 animate-pulse rounded-pill bg-white" />
        ))}
      </div>
      <div className="h-11 max-w-xl animate-pulse rounded-pill bg-white" />
      <div className="h-80 animate-pulse rounded-card bg-white" />
    </div>
  );
}
