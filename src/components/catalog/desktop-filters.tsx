"use client";

import type { CatalogResult } from "@/lib/catalog";
import { countActiveFilters } from "@/lib/catalog-params";
import { useCatalog } from "./catalog-provider";
import { FilterPanel } from "./filter-panel";

// Desktop: cada cambio se aplica al instante (sin botón "Aplicar").
export function DesktopFilters({ facets }: { facets: CatalogResult["facets"] }) {
  const { filters, navigate } = useCatalog();

  return (
    <div>
      <div className="flex items-center justify-between pb-2">
        <h2 className="text-lg font-bold">Filtros</h2>
        {countActiveFilters(filters) > 0 && (
          <button
            type="button"
            onClick={() => navigate({ categories: [], minPrice: null, maxPrice: null, onSale: false, inStock: false })}
            className="text-sm font-semibold text-brand underline-offset-4 hover:underline"
          >
            Limpiar
          </button>
        )}
      </div>
      <FilterPanel value={filters} onChange={navigate} facets={facets} idPrefix="d" />
    </div>
  );
}
