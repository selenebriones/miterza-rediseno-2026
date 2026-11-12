import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { UsersIcon } from "lucide-react";
import { CustomerActions } from "@/components/admin/customers/customer-actions";
import { CustomerStatus } from "@/components/admin/customers/customer-status";
import { SortableTh, TablePager } from "@/components/admin/data-table";
import { PageSizeSelect } from "@/components/admin/page-size-select";
import { TABLE_CARD, TableSearch } from "@/components/admin/table-search";
import {
  CUSTOMER_SORT_KEYS,
  customerStatusFromParam,
  getCustomerCounts,
  listCustomers,
  type CustomerSortKey,
  type CustomerStatusFilter,
} from "@/lib/admin/customers";
import {
  DEFAULT_PAGE_SIZE,
  nextSort,
  PAGE_SIZES,
  parsePageSize,
  parseSort,
  sortParam,
  type Sort,
  type SortDir,
} from "@/lib/admin/table-params";
import { requirePermission } from "@/lib/admin/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Clientes" };

const dateFormat = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" });

type Filters = {
  status: CustomerStatusFilter;
  q: string;
  page: number;
  pageSize: number;
  sort: Sort<CustomerSortKey>;
};

function customersHref({ status, q, page, pageSize, sort }: Filters) {
  const params = new URLSearchParams();
  if (status) params.set("estado", status);
  if (q) params.set("q", q);
  if (sort) params.set("orden", sortParam(sort));
  if (pageSize !== DEFAULT_PAGE_SIZE) params.set("por", String(pageSize));
  if (page > 1) params.set("pagina", String(page));
  const query = params.toString();
  return query ? `/admin/clientes?${query}` : "/admin/clientes";
}

export default function CustomersPage({ searchParams }: PageProps<"/admin/clientes">) {
  return (
    <>
      <h1 className="text-[1.75rem] leading-tight font-bold lg:text-[2rem]">Clientes</h1>
      <p className="mt-1 text-sm">Personas que crearon una cuenta en la tienda.</p>
      <Suspense fallback={<div className="mt-6 h-96 animate-pulse rounded-card bg-white" aria-busy="true" />}>
        <Customers searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Customers({ searchParams }: Pick<PageProps<"/admin/clientes">, "searchParams">) {
  await requirePermission("MANAGE_CUSTOMERS");
  const params = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const filters: Filters = {
    status: customerStatusFromParam(one(params.estado)),
    q: one(params.q).trim().slice(0, 80),
    page: Math.max(1, Number(one(params.pagina)) || 1),
    pageSize: parsePageSize(one(params.por)),
    sort: parseSort(one(params.orden), CUSTOMER_SORT_KEYS),
  };
  const sortHref = (key: CustomerSortKey, firstDir: SortDir = "asc") =>
    customersHref({ ...filters, sort: nextSort(filters.sort, key, firstDir), page: 1 });
  const [counts, result] = await Promise.all([getCustomerCounts(), listCustomers(filters)]);

  const tabs: { status: CustomerStatusFilter; label: string; count: number }[] = [
    { status: null, label: "Todos", count: counts.all },
    { status: "activos", label: "Activos", count: counts.active },
    { status: "inactivos", label: "Inactivos", count: counts.inactive },
  ];

  return (
    <div className="mt-6 space-y-5">
      <nav aria-label="Filtrar por estado" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
        <ul className="flex gap-2">
          {tabs.map((tab) => {
            const active = tab.status === filters.status;
            return (
              <li key={tab.label} className="shrink-0">
                <Link
                  href={customersHref({ ...filters, status: tab.status, page: 1 })}
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

      <section className={TABLE_CARD}>
        <TableSearch
          action="/admin/clientes"
          label="Buscar clientes"
          placeholder="Nombre, correo o teléfono…"
          value={filters.q}
          keep={{
            estado: filters.status,
            orden: sortParam(filters.sort),
            por: filters.pageSize !== DEFAULT_PAGE_SIZE ? String(filters.pageSize) : null,
          }}
          clearHref={customersHref({ ...filters, q: "", page: 1 })}
          aside={
            <PageSizeSelect
              value={filters.pageSize}
              hrefs={Object.fromEntries(PAGE_SIZES.map((n) => [n, customersHref({ ...filters, pageSize: n, page: 1 })]))}
            />
          }
        />
      {result.customers.length === 0 ? (
        <div className="mt-4 flex flex-col items-center rounded-card bg-white px-6 py-14 text-center shadow-card md:mt-0 md:shadow-none">
          <UsersIcon className="size-10 text-brand" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-bold">
            {filters.q ? "Ningún cliente coincide con tu búsqueda" : "No hay clientes aquí"}
          </h2>
          <p className="mt-1 text-sm">
            {filters.q
              ? "Prueba con el correo, el apellido o el teléfono."
              : "Cuando alguien cree su cuenta en la tienda, aparecerá en esta lista."}
          </p>
          {filters.q && (
            <Link href={customersHref({ ...filters, q: "", page: 1 })} className="mt-4 font-semibold text-brand underline">
              Limpiar búsqueda
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Desktop: tabla con las acciones a la derecha. */}
          <div className="hidden md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs tracking-wide whitespace-nowrap text-muted-foreground uppercase">
                <tr>
                  <SortableTh label="Nombre" sortKey="nombre" sort={filters.sort} href={sortHref("nombre")} />
                  <SortableTh
                    label="Correo electrónico"
                    sortKey="correo"
                    sort={filters.sort}
                    href={sortHref("correo")}
                    className="hidden xl:table-cell"
                  />
                  <SortableTh label="Cliente desde" sortKey="desde" sort={filters.sort} href={sortHref("desde", "desc")} />
                  <SortableTh label="Estado" sortKey="estado" sort={filters.sort} href={sortHref("estado")} />
                  <th scope="col" className="text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {result.customers.map((customer) => (
                  <tr key={customer.id} className="transition-colors hover:bg-surface">
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/clientes/${customer.id}`}
                        className="font-semibold whitespace-nowrap text-brand hover:underline"
                      >
                        {customer.name || "Sin nombre"}
                      </Link>
                      {/* En pantallas medianas el correo va bajo el nombre para que quepan los botones. */}
                      <span className="block text-xs xl:hidden">{customer.email}</span>
                    </td>
                    <td className="hidden px-5 py-3 whitespace-nowrap xl:table-cell">{customer.email}</td>
                    <td className="px-5 py-3 whitespace-nowrap">{dateFormat.format(customer.createdAt)}</td>
                    <td className="px-5 py-3">
                      <CustomerStatus active={customer.isActive} />
                    </td>
                    <td className="w-px py-3 pr-4 pl-2 whitespace-nowrap">
                      <CustomerActions customer={customer} layout="row" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Móvil: tarjetas con los mismos datos y botones. */}
          <ul className="mt-4 space-y-3 md:hidden">
            {result.customers.map((customer) => (
              <li key={customer.id} className="rounded-card bg-white p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/clientes/${customer.id}`}
                      className="block truncate font-semibold text-brand hover:underline"
                    >
                      {customer.name || "Sin nombre"}
                    </Link>
                    <span className="block truncate text-sm">{customer.email}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Cliente desde {dateFormat.format(customer.createdAt)}
                    </span>
                  </div>
                  <CustomerStatus active={customer.isActive} />
                </div>
                <div className="mt-3 border-t border-line pt-2">
                  <CustomerActions customer={customer} layout="row" />
                </div>
              </li>
            ))}
          </ul>

          <TablePager
            page={result.page}
            pageCount={result.pageCount}
            pageSize={filters.pageSize}
            total={result.total}
            noun={["cliente", "clientes"]}
            href={(n) => customersHref({ ...filters, page: n })}
          />
        </>
      )}
      </section>
    </div>
  );
}
