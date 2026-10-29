import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogSkeleton, CatalogView, describeCatalog } from "@/components/catalog/catalog-view";
import { parseCatalogParams } from "@/lib/catalog-params";
import { getCategoryTree } from "@/lib/categories";

export async function generateMetadata({ searchParams }: PageProps<"/productos">): Promise<Metadata> {
  const [filters, tree] = await Promise.all([searchParams.then(parseCatalogParams), getCategoryTree()]);
  const { title, description } = describeCatalog(filters, tree);

  // Solo se indexan el catálogo completo y las páginas de una categoría. Búsquedas,
  // rangos de precio, orden y combinaciones de filtros llevan noindex (contenido duplicado).
  const indexable =
    !filters.q &&
    filters.categories.length <= 1 &&
    filters.minPrice === null &&
    filters.maxPrice === null &&
    !filters.inStock &&
    (filters.sort === "recomendados");

  return {
    title: `${title} | Mi Terza`,
    description: description ?? "Persianas y tapetes Terza en línea, con más de 40 años de respaldo y las mejores garantías.",
    robots: indexable ? undefined : { index: false, follow: true },
  };
}

export default function ProductsPage({ searchParams }: PageProps<"/productos">) {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <Catalog searchParams={searchParams} />
    </Suspense>
  );
}

async function Catalog({ searchParams }: Pick<PageProps<"/productos">, "searchParams">) {
  const [filters, tree] = await Promise.all([searchParams.then(parseCatalogParams), getCategoryTree()]);
  return <CatalogView filters={filters} tree={tree} />;
}
