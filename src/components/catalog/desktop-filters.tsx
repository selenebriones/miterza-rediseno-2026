"use client";

import type { CatalogResult } from "@/lib/catalog";
import { CLEARED_FILTERS } from "@/lib/catalog-params";
import { useCatalog } from "./catalog-provider";
import { FilterPanel } from "./filter-panel";

// Desktop: cada cambio se aplica al instante (sin botón "Aplicar").
export function DesktopFilters({ facets }: { facets: CatalogResult["facets"] }) {
  const { filters, navigate } = useCatalog();

  return (
    <FilterPanel
      value={filters}
      onChange={navigate}
      facets={facets}
      idPrefix="d"
      // "Borrar" quita filtros y atributos pero conserva la categoría elegida en el selector.
      onClear={() => navigate({ ...CLEARED_FILTERS, categories: filters.categories })}
    />
  );
}
