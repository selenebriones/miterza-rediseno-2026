import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LogOutIcon, PackageIcon, UserPenIcon } from "lucide-react";
import { customerLogout } from "@/app/(acceso)/cuenta/actions";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { STATUS_META } from "@/lib/order-status";
import { formatOrderNumber, formatPrice } from "@/lib/store-config";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mi cuenta | Mi Terza",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <div className="container py-10 lg:py-16">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-[28px] bg-mist" />}>
        <Account />
      </Suspense>
    </div>
  );
}

async function Account() {
  const session = await getSession();
  if (!session?.user) redirect("/cuenta/ingresar");
  if (session.user.role === "ADMIN") redirect("/admin");

  // Nombre desde la base (no de la sesión) para mostrarlo siempre al día.
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { name: true } });
  const firstName = (user?.name ?? session.user.name ?? "").split(" ")[0];
  const orders = await db.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, number: true, status: true, total: true, createdAt: true, _count: { select: { items: true } } },
  });
  const dateFormat = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold tracking-widest text-brand uppercase">Mi cuenta</p>
          <h1 className="mt-2 text-[2rem] leading-tight font-bold lg:text-5xl">
            Hola{firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="mt-2">{session.user.email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/cuenta/informacion"
            className="inline-flex items-center gap-2 rounded-pill bg-brand px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-accent hover:text-brand"
          >
            <UserPenIcon className="size-4" aria-hidden="true" />
            Actualizar mi información
          </Link>
          <form action={customerLogout}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-pill bg-mist px-5 py-2 text-sm font-bold text-brand transition-colors hover:bg-brand hover:text-white"
            >
              <LogOutIcon className="size-4" aria-hidden="true" />
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>

      <section aria-labelledby="mis-pedidos" className="mt-10 rounded-[28px] bg-mist p-6 md:p-8">
        <h2 id="mis-pedidos" className="text-2xl font-bold text-black">
          Mis pedidos
        </h2>
        {orders.length === 0 ? (
          <div className="mt-6 flex flex-col items-start gap-4">
            <p className="flex items-center gap-2 text-black">
              <PackageIcon className="size-5 text-brand" aria-hidden="true" />
              Todavía no tienes pedidos.
            </p>
            <Link
              href="/productos"
              className="inline-flex h-12 items-center rounded-pill bg-brand px-6 font-semibold text-white transition-colors hover:bg-brand-hover"
            >
              Explorar productos
            </Link>
          </div>
        ) : (
          <ul className="mt-5">
            {orders.map((order) => {
              const status = STATUS_META[order.status];
              return (
                <li key={order.id} className="border-b border-black/10 last:border-0">
                  <Link
                    href={`/checkout/confirmacion/${order.id}`}
                    className="group flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4"
                  >
                    <span>
                      <span className="block font-bold text-brand group-hover:underline">
                        Pedido {formatOrderNumber(order.number)}
                      </span>
                      <span className="block text-sm">
                        {dateFormat.format(order.createdAt)} · {order._count.items}{" "}
                        {order._count.items === 1 ? "producto" : "productos"}
                      </span>
                    </span>
                    <span className="flex items-center gap-4">
                      <span
                        className={cn("rounded-pill px-3 py-1 text-xs font-semibold ring-1 ring-inset", status.badge)}
                      >
                        {status.label}
                      </span>
                      <span className="font-bold text-black tabular-nums">{formatPrice(Number(order.total))}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
