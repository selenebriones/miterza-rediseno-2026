import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeftIcon, MailIcon, PhoneIcon } from "lucide-react";
import { CustomerActions } from "@/components/admin/customers/customer-actions";
import { CustomerOrders } from "@/components/admin/customers/customer-orders";
import { CustomerStatus } from "@/components/admin/customers/customer-status";
import { getCustomer } from "@/lib/admin/customers";
import { hasPermission } from "@/lib/admin/permissions";
import { requirePermission } from "@/lib/admin/session";
import { formatPrice } from "@/lib/store-config";

export const metadata: Metadata = { title: "Detalle del cliente" };

const dateFormat = new Intl.DateTimeFormat("es-MX", { dateStyle: "long" });

export default function CustomerDetailPage({ params }: PageProps<"/admin/clientes/[id]">) {
  return (
    <>
      <Link
        href="/admin/clientes"
        className="inline-flex min-h-tap items-center gap-2 text-sm font-semibold text-brand hover:underline"
      >
        <ArrowLeftIcon className="size-4" aria-hidden="true" />
        Clientes
      </Link>
      <Suspense fallback={<div className="mt-4 h-96 animate-pulse rounded-card bg-white" aria-busy="true" />}>
        <CustomerDetail params={params} />
      </Suspense>
    </>
  );
}

async function CustomerDetail({ params }: Pick<PageProps<"/admin/clientes/[id]">, "params">) {
  const admin = await requirePermission("MANAGE_CUSTOMERS");
  const customer = await getCustomer((await params).id);
  if (!customer) notFound();

  // Pedidos cancelados no cuentan como compra.
  const paid = customer.orders.filter((o) => o.status !== "CANCELLED");
  const spent = paid.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="mt-2">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-[1.75rem] leading-tight font-bold lg:text-[2rem]">{customer.name || "Sin nombre"}</h1>
        <CustomerStatus active={customer.isActive} className="text-sm" />
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <section aria-labelledby="pedidos" className="rounded-card bg-white p-5 shadow-card lg:col-span-7 xl:col-span-8">
          <h2 id="pedidos" className="text-lg font-bold">
            Pedidos <span className="font-normal text-body">({customer.orders.length})</span>
          </h2>
          <CustomerOrders orders={customer.orders} canManageOrders={hasPermission(admin.permissions, "MANAGE_ORDERS")} />
        </section>

        <div className="space-y-6 lg:col-span-5 xl:col-span-4">
          <section aria-labelledby="datos" className="rounded-card bg-white p-5 shadow-card">
            <h2 id="datos" className="text-lg font-bold">
              Información
            </h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Nombre</dt>
                <dd className="mt-0.5 font-medium text-heading">{customer.name || "Sin nombre"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Correo electrónico</dt>
                <dd className="mt-0.5">
                  <a href={`mailto:${customer.email}`} className="inline-flex items-center gap-2 break-all text-brand hover:underline">
                    <MailIcon className="size-4 shrink-0" aria-hidden="true" />
                    {customer.email}
                  </a>
                </dd>
              </div>
              {customer.phone && (
                <div>
                  <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Teléfono</dt>
                  <dd className="mt-0.5">
                    <a href={`tel:+52${customer.phone}`} className="inline-flex items-center gap-2 text-brand hover:underline">
                      <PhoneIcon className="size-4" aria-hidden="true" />
                      {customer.phone}
                    </a>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Cliente desde</dt>
                <dd className="mt-0.5">{dateFormat.format(customer.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Último acceso</dt>
                <dd className="mt-0.5">{customer.lastLoginAt ? dateFormat.format(customer.lastLoginAt) : "Nunca"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Compras</dt>
                <dd className="mt-0.5">
                  {paid.length} {paid.length === 1 ? "pedido" : "pedidos"} · {formatPrice(spent)}
                  <span className="block text-xs text-muted-foreground">Sin contar cancelados.</span>
                </dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="estado" className="rounded-card bg-white p-5 shadow-card">
            <h2 id="estado" className="text-lg font-bold">
              Estado de la cuenta
            </h2>
            <div className="mt-2 space-y-2 text-sm">
              <CustomerStatus active={customer.isActive} />
              <p>{customer.isActive ? "Puede entrar a su cuenta y comprar." : "Bloqueado: no puede entrar ni comprar."}</p>
            </div>
            <div className="mt-4">
              <CustomerActions customer={customer} layout="page" showDetail={false} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
