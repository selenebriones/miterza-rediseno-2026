import Link from "next/link";
import { SearchXIcon } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { Breadcrumbs } from "@/components/store/breadcrumbs";
import { queryCatalog } from "@/lib/catalog";
import { findCategory, PAGE_SIZE, type CatalogFilters, type CategoryNode } from "@/lib/catalog-params";
import { ActiveFilters } from "./active-filters";
import { CatalogProvider, PendingRegion } from "./catalog-provider";
import { DesktopFilters } from "./desktop-filters";
import { MobileToolbar } from "./mobile-toolbar";
import { Pagination } from "./pagination";
import { SortSelect } from "./sort-select";

// Título, descripción y migas según cómo llegó el usuario (categoría, búsqueda u ofertas).
export function describeCatalog(filters: CatalogFilters, tree: CategoryNode[]) {
  const category = filters.categories.length === 1 ? findCategory(tree, filters.categories[0]) : null;
  if (filters.q) return { title: `Resultados para “${filters.q}”`, description: null, category: null };
  if (category) {
    return {
      // Las subcategorías ya traen su nombre completo ("Pisos vinílicos", "Alfombras").
      title: category.name,
      description: category.description,
      category,
    };
  }
  // Varias líneas de la misma categoría (p. ej. Select + Stylo) → título de la categoría.
  const parents = new Set(filters.categories.map((slug) => findCategory(tree, slug)?.parent?.name ?? null));
  if (filters.categories.length > 1 && parents.size === 1 && !parents.has(null)) {
    return { title: [...parents][0] as string, description: null, category: null };
  }
  if (filters.onSale)
    return { title: "Ofertas", description: "Precios especiales por tiempo limitado.", category: null };
  return { title: "Todos los productos", description: null, category: null };
}

export async function CatalogView({ filters, tree }: { filters: CatalogFilters; tree: CategoryNode[] }) {
  const result = await queryCatalog(filters, tree);
  const { title, description, category } = describeCatalog(filters, tree);
  const from = (result.page - 1) * PAGE_SIZE + 1;
  const to = from + result.products.length - 1;

  return (
    <CatalogProvider filters={filters} tree={tree}>
      <div className="container pt-5 pb-16 lg:pt-8 lg:pb-24">
        <Breadcrumbs
          items={[
            { label: "Productos", href: "/productos" },
            ...(category?.parent
              ? [{ label: category.parent.name, href: `/productos?categoria=${category.parent.slug}` }]
              : []),
            ...(category ? [{ label: category.name }] : []),
          ]}
        />

        <header className="mt-3 lg:mt-4">
          <h1 className="text-[1.75rem] leading-tight font-bold lg:text-[2.5rem]">{title}</h1>
          {description && <p className="mt-2 max-w-2xl">{description}</p>}
        </header>

        <div className="mt-6 lg:mt-8 lg:grid lg:grid-cols-[15rem_1fr] lg:gap-10 xl:grid-cols-[16rem_1fr]">
          <aside className="hidden lg:block" aria-label="Filtros">
            <div className="sticky top-32 max-h-[calc(100dvh-9rem)] overflow-y-auto pr-2 pb-6">
              <DesktopFilters facets={result.facets} />
            </div>
          </aside>

          <div className="min-w-0">
            <MobileToolbar facets={result.facets} total={result.total} />

            <div className="mt-4 flex items-center justify-between gap-4 border-b border-black/10 pb-4 lg:mt-0">
              <p aria-live="polite" className="text-sm">
                <strong className="text-heading">{result.total}</strong> {result.total === 1 ? "producto" : "productos"}
                {result.pageCount > 1 && (
                  <span className="max-sm:hidden">
                    {" "}
                    · mostrando {from}–{to}
                  </span>
                )}
              </p>
              <div className="hidden w-64 lg:block">
                <SortSelect variant="inline" />
              </div>
            </div>

            <ActiveFilters className="mt-3" />

            <PendingRegion className="mt-6">
              {result.total === 0 ? (
                <EmptyState filters={filters} tree={tree} />
              ) : (
                <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:gap-6 2xl:grid-cols-4">
                  {result.products.map((product, index) => (
                    <li key={product.slug} className="flex">
                      <ProductCard
                        product={product}
                        sizes="(min-width: 1536px) 20vw, (min-width: 768px) 30vw, 50vw"
                        eager={index < 2}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </PendingRegion>

            <Pagination filters={filters} page={result.page} pageCount={result.pageCount} />
          </div>
        </div>
      </div>
    </CatalogProvider>
  );
}

function EmptyState({ filters, tree }: { filters: CatalogFilters; tree: CategoryNode[] }) {
  return (
    <div className="flex flex-col items-center rounded-card bg-surface px-6 py-12 text-center">
      <SearchXIcon className="size-10 text-brand" aria-hidden="true" />
      <h2 className="mt-3 text-xl font-bold">
        {filters.q ? `No encontramos productos para “${filters.q}”` : "No encontramos productos con estos filtros"}
      </h2>
      <p className="mt-2 max-w-md">
        {filters.q
          ? "Revisa la ortografía o prueba con otra palabra. También puedes quitar algún filtro."
          : "Prueba quitando alguno de los filtros aplicados."}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/productos"
          className="inline-flex h-12 items-center rounded-pill bg-brand px-6 font-semibold text-white transition-colors hover:bg-accent hover:text-brand"
        >
          Ver todos los productos
        </Link>
      </div>
      <p className="mt-6 text-sm">O explora:</p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {tree.map((category) => (
          <Link
            key={category.slug}
            href={`/productos?categoria=${category.slug}`}
            className="inline-flex h-9 items-center rounded-pill bg-white px-4 text-sm font-medium text-brand hover:bg-brand-50"
          >
            {category.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function CatalogSkeleton() {
  return (
    <div className="container pt-5 pb-16 lg:pt-8" aria-busy="true" aria-label="Cargando productos">
      <div className="h-4 w-40 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-9 w-64 animate-pulse rounded bg-muted lg:h-12" />
      <div className="mt-6 lg:mt-8 lg:grid lg:grid-cols-[15rem_1fr] lg:gap-10 xl:grid-cols-[16rem_1fr]">
        <div className="hidden space-y-3 lg:block">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="h-6 animate-pulse rounded bg-muted" />
          ))}
        </div>
        <div>
          <div className="grid grid-cols-2 gap-2 lg:hidden">
            <div className="h-tap animate-pulse rounded-pill bg-muted" />
            <div className="h-tap animate-pulse rounded-pill bg-muted" />
          </div>
          <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:gap-6 2xl:grid-cols-4">
            {Array.from({ length: 6 }, (_, i) => (
              <li key={i} className="overflow-hidden rounded-[24px] bg-white shadow-[0_4px_18px_rgba(0,0,0,0.08)]">
                <div className="aspect-square animate-pulse bg-muted" />
                <div className="p-4 sm:p-5">
                  <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
                  <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-muted" />
                  <div className="mt-4 h-5 w-1/2 animate-pulse rounded bg-muted" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
