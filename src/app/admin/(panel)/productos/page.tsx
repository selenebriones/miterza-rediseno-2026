import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EyeIcon, ImageIcon, PackageIcon, PencilIcon, PlusIcon, XIcon } from "lucide-react";
import { SortableTh, TablePager } from "@/components/admin/data-table";
import { PageSizeSelect } from "@/components/admin/page-size-select";
import { TABLE_CARD, TableSearch } from "@/components/admin/table-search";
import type { ProductStatus } from "@/generated/prisma/enums";
import { listCategoryOptions } from "@/lib/admin/categories";
import { getProductStatusCounts, listProducts, PRODUCT_SORT_KEYS, type ProductSortKey } from "@/lib/admin/products";
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
import { formatPrice } from "@/lib/store-config";
import { PRODUCT_STATUSES, PRODUCT_STATUS_META, productStatusFromSlug } from "@/lib/product-status";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Productos" };

// Botón redondo de acción, como en terza-sitio: gris con borde y verde al pasar el mouse.
const ACTION =
  "inline-grid size-10 place-items-center rounded-full border border-[#dee2e6] bg-white text-[#343a40] transition-colors hover:border-brand hover:bg-brand-50 hover:text-brand";

type Filters = {
  status: ProductStatus | null;
  categoryId: string | null;
  q: string;
  page: number;
  pageSize: number;
  sort: Sort<ProductSortKey>;
};

function productsHref({ status, categoryId, q, page, pageSize, sort }: Filters) {
  const params = new URLSearchParams();
  if (status) params.set("estado", PRODUCT_STATUS_META[status].slug);
  if (categoryId) params.set("categoria", categoryId);
  if (q) params.set("q", q);
  if (sort) params.set("orden", sortParam(sort));
  if (pageSize !== DEFAULT_PAGE_SIZE) params.set("por", String(pageSize));
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
    pageSize: parsePageSize(one(params.por)),
    sort: parseSort(one(params.orden), PRODUCT_SORT_KEYS),
  };
  const sortHref = (key: ProductSortKey, firstDir: SortDir = "asc") =>
    productsHref({ ...filters, sort: nextSort(filters.sort, key, firstDir), page: 1 });
  const keepTable = {
    orden: sortParam(filters.sort),
    por: filters.pageSize !== DEFAULT_PAGE_SIZE ? String(filters.pageSize) : null,
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

      {/* Filtro de categoría: se queda fuera de la tarjeta, junto a las pestañas. Conserva estado y búsqueda. */}
      <form action="/admin/productos" className="flex flex-wrap gap-2">
        {filters.status && <input type="hidden" name="estado" value={PRODUCT_STATUS_META[filters.status].slug} />}
        {filters.q && <input type="hidden" name="q" value={filters.q} />}
        {Object.entries(keepTable).map(([name, v]) => (v ? <input key={name} type="hidden" name={name} value={v} /> : null))}
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
        <button
          type="submit"
          className="h-11 rounded-pill border border-input bg-white px-5 font-semibold text-heading hover:border-brand hover:text-brand"
        >
          Filtrar
        </button>
        {filters.categoryId && (
          <Link
            href={productsHref({ ...filters, categoryId: null, page: 1 })}
            aria-label="Quitar filtro de categoría"
            className="grid size-11 shrink-0 place-items-center rounded-pill border border-input bg-white text-heading hover:border-brand hover:text-brand"
          >
            <XIcon className="size-4" aria-hidden="true" />
          </Link>
        )}
      </form>

      <section className={TABLE_CARD}>
        <TableSearch
          action="/admin/productos"
          label="Buscar productos"
          placeholder="Nombre, slug o SKU…"
          value={filters.q}
          keep={{
            estado: filters.status ? PRODUCT_STATUS_META[filters.status].slug : null,
            categoria: filters.categoryId,
            ...keepTable,
          }}
          clearHref={productsHref({ ...filters, q: "", page: 1 })}
          aside={
            <PageSizeSelect
              value={filters.pageSize}
              hrefs={Object.fromEntries(PAGE_SIZES.map((n) => [n, productsHref({ ...filters, pageSize: n, page: 1 })]))}
            />
          }
        />
      {result.products.length === 0 ? (
        <div className="mt-4 flex flex-col items-center rounded-card bg-white px-6 py-14 text-center shadow-card md:mt-0 md:shadow-none">
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
          <div className="hidden md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-white text-xs tracking-wide text-muted-foreground uppercase">
                <tr>
                  <SortableTh label="Producto" sortKey="producto" sort={filters.sort} href={sortHref("producto")} />
                  <th scope="col">Categoría</th>
                  <SortableTh label="Estado" sortKey="estado" sort={filters.sort} href={sortHref("estado")} />
                  <SortableTh label="Variantes" sortKey="variantes" sort={filters.sort} href={sortHref("variantes", "desc")} />
                  <SortableTh label="Precio desde" sortKey="precio" sort={filters.sort} href={sortHref("precio")} align="right" />
                  <th scope="col" className="text-right">
                    Acciones
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
                      <span className={cn("insignia", PRODUCT_STATUS_META[product.status].tone)}>
                        {PRODUCT_STATUS_META[product.status].label}
                      </span>
                    </td>
                    <td className="px-5 py-4">{product.variantCount}</td>
                    <td className="px-5 py-4 text-right font-semibold text-heading tabular-nums">
                      {formatPrice(product.price)}
                    </td>
                    <td className="w-px whitespace-nowrap">
                      {/* Encima del enlace que cubre la fila, para que cada botón tenga su propio foco y hover. */}
                      <div className="relative z-10 flex justify-end gap-2">
                        {product.status === "ACTIVE" ? (
                          <a
                            href={`/productos/${product.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Ver ${product.name} en la tienda (se abre en otra pestaña)`}
                            title="Ver en la tienda"
                            className={ACTION}
                          >
                            <EyeIcon className="size-[18px]" aria-hidden="true" />
                          </a>
                        ) : (
                          <span
                            aria-hidden="true"
                            title="No se ve en la tienda porque no está activo"
                            className={`${ACTION} pointer-events-none opacity-35`}
                          >
                            <EyeIcon className="size-[18px]" />
                          </span>
                        )}
                        <Link
                          href={`/admin/productos/${product.id}`}
                          aria-label={`Editar ${product.name}`}
                          title="Editar"
                          className={ACTION}
                        >
                          <PencilIcon className="size-[18px]" aria-hidden="true" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="mt-4 space-y-3 md:hidden">
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
                      <span className={cn("insignia", PRODUCT_STATUS_META[product.status].tone)}>
                        {PRODUCT_STATUS_META[product.status].label}
                      </span>
                      <span className="font-semibold text-heading tabular-nums">{formatPrice(product.price)}</span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <TablePager
            page={result.page}
            pageCount={result.pageCount}
            pageSize={filters.pageSize}
            total={result.total}
            noun={["producto", "productos"]}
            href={(n) => productsHref({ ...filters, page: n })}
          />
        </>
      )}
      </section>
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
