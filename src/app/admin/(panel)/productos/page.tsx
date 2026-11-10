import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeftIcon, ChevronRightIcon, ImageIcon, PackageIcon, PlusIcon, SearchIcon, XIcon } from "lucide-react";
import type { ProductStatus } from "@/generated/prisma/enums";
import { listCategoryOptions } from "@/lib/admin/categories";
import { getProductStatusCounts, listProducts } from "@/lib/admin/products";
import { requirePermission } from "@/lib/admin/session";
import { formatPrice } from "@/lib/store-config";
import { PRODUCT_STATUSES, PRODUCT_STATUS_META, productStatusFromSlug } from "@/lib/product-status";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Productos" };

type Filters = { status: ProductStatus | null; categoryId: string | null; q: string; page: number };

function productsHref({ status, categoryId, q, page }: Filters) {
  const params = new URLSearchParams();
  if (status) params.set("estado", PRODUCT_STATUS_META[status].slug);
  if (categoryId) params.set("categoria", categoryId);
  if (q) params.set("q", q);
  if (page > 1) params.set("pagina", String(page));
  const query = params.toString();
  return query ? `/admin/productos?${query}` : "/admin/productos";
}

export default function ProductsPage({ searchParams }: PageProps<"/admin/productos">) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[1.75rem] leading-tight font-bold lg:text-[2rem]">Productos</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/categorias"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-pill bg-white px-4 font-semibold text-brand ring-1 ring-line hover:ring-brand"
          >
            Categorías
          </Link>
          <Link
            href="/admin/productos/nuevo"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-pill bg-brand px-4 font-semibold text-white hover:bg-brand-hover"
          >
            <PlusIcon className="size-4" aria-hidden="true" />
            Nuevo producto
          </Link>
        </div>
      </div>
      <Suspense fallback={<ProductsSkeleton />}>
        <Products searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Products({ searchParams }: Pick<PageProps<"/admin/productos">, "searchParams">) {
  await requirePermission("MANAGE_CATALOG");
  const params = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const filters: Filters = {
    status: productStatusFromSlug(one(params.estado)),
    categoryId: one(params.categoria) || null,
    q: one(params.q).trim().slice(0, 80),
    page: Math.max(1, Number(one(params.pagina)) || 1),
  };
  const [{ counts, all }, result, categories] = await Promise.all([
    getProductStatusCounts(),
    listProducts(filters),
    listCategoryOptions(),
  ]);

  const tabs: { status: ProductStatus | null; label: string; count: number }[] = [
    { status: null, label: "Todos", count: all },
    ...PRODUCT_STATUSES.map((s) => ({ status: s, label: PRODUCT_STATUS_META[s].label, count: counts[s] ?? 0 })),
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
                  href={productsHref({ ...filters, status: tab.status, page: 1 })}
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

      <form action="/admin/productos" role="search" className="flex flex-wrap gap-2">
        {filters.status && <input type="hidden" name="estado" value={PRODUCT_STATUS_META[filters.status].slug} />}
        <div className="relative max-w-xl flex-1">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <label htmlFor="q" className="sr-only">
            Buscar productos
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={filters.q}
            placeholder="Nombre, slug o SKU…"
            className="h-11 w-full rounded-pill border border-input bg-white pr-4 pl-10 text-base text-heading"
          />
        </div>
        <label htmlFor="categoria" className="sr-only">
          Categoría
        </label>
        <select
          id="categoria"
          name="categoria"
          defaultValue={filters.categoryId ?? ""}
          className="h-11 rounded-pill border border-input bg-white px-4 text-base text-heading"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <button type="submit" className="h-11 rounded-pill bg-brand px-5 font-semibold text-white hover:bg-brand-hover">
          Buscar
        </button>
        {(filters.q || filters.categoryId) && (
          <Link
            href={productsHref({ ...filters, q: "", categoryId: null, page: 1 })}
            aria-label="Limpiar filtros"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-muted-foreground ring-1 ring-line hover:text-brand"
          >
            <XIcon className="size-4" aria-hidden="true" />
          </Link>
        )}
      </form>

      <p aria-live="polite" className="text-sm">
        {result.total} {result.total === 1 ? "producto" : "productos"}
        {filters.q && <> que coinciden con “{filters.q}”</>}
      </p>

      {result.products.length === 0 ? (
        <div className="flex flex-col items-center rounded-card bg-white px-6 py-14 text-center shadow-card">
          <PackageIcon className="size-10 text-brand" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-bold">
            {filters.q || filters.categoryId ? "Ningún producto coincide con tu búsqueda" : "Aún no hay productos"}
          </h2>
          <p className="mt-1 text-sm">
            {filters.q || filters.categoryId
              ? "Prueba con otro nombre, slug o SKU."
              : "Crea el primero con el botón de arriba."}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-card bg-white shadow-card md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-white text-xs tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Producto
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Categoría
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Estado
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Variantes
                  </th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">
                    Precio desde
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {result.products.map((product) => (
                  <tr
                    key={product.id}
                    className="relative transition-colors hover:bg-surface has-[a:focus-visible]:bg-surface"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/productos/${product.id}`}
                        className="flex items-center gap-3 font-semibold text-brand after:absolute after:inset-0 focus-visible:outline-none"
                      >
                        <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface">
                          {product.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={product.image.url} alt="" className="size-full object-cover" />
                          ) : (
                            <ImageIcon className="size-4 text-brand/40" aria-hidden="true" />
                          )}
                        </span>
                        <span>
                          {product.name}
                          <span className="block text-xs font-normal text-muted-foreground">{product.slug}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-4">{product.categoryName ?? "—"}</td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-semibold whitespace-nowrap ring-1 ring-inset",
                          PRODUCT_STATUS_META[product.status].badge,
                        )}
                      >
                        {PRODUCT_STATUS_META[product.status].label}
                      </span>
                    </td>
                    <td className="px-5 py-4">{product.variantCount}</td>
                    <td className="px-5 py-4 text-right font-semibold text-heading tabular-nums">
                      {formatPrice(product.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {result.products.map((product) => (
              <li key={product.id}>
                <Link
                  href={`/admin/productos/${product.id}`}
                  className="flex items-center gap-3 rounded-card bg-white p-4 shadow-card active:bg-surface"
                >
                  <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface">
                    {product.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.image.url} alt="" className="size-full object-cover" />
                    ) : (
                      <ImageIcon className="size-5 text-brand/40" aria-hidden="true" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-heading">{product.name}</span>
                    <span className="flex items-center justify-between text-sm">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-pill px-2 py-0.5 text-xs font-semibold ring-1 ring-inset",
                          PRODUCT_STATUS_META[product.status].badge,
                        )}
                      >
                        {PRODUCT_STATUS_META[product.status].label}
                      </span>
                      <span className="font-semibold text-heading tabular-nums">{formatPrice(product.price)}</span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {result.pageCount > 1 && (
            <nav aria-label="Paginación" className="flex items-center justify-between gap-3">
              {result.page > 1 ? (
                <Link
                  href={productsHref({ ...filters, page: result.page - 1 })}
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
                  href={productsHref({ ...filters, page: result.page + 1 })}
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

function ProductsSkeleton() {
  return (
    <div className="mt-6 space-y-5" aria-busy="true" aria-label="Cargando productos">
      <div className="flex gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-10 w-28 animate-pulse rounded-pill bg-white" />
        ))}
      </div>
      <div className="h-11 max-w-xl animate-pulse rounded-pill bg-white" />
      <div className="h-80 animate-pulse rounded-card bg-white" />
    </div>
  );
}
