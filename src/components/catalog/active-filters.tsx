"use client";

import { XIcon } from "lucide-react";
import { countActiveFilters, findCategory, PRICE_RANGES, type CatalogFilters } from "@/lib/catalog-params";
import { formatPrice } from "@/lib/store-config";
import { useCatalog } from "./catalog-provider";

type Chip = { key: string; label: string; remove: Partial<CatalogFilters> };

function priceLabel(min: number | null, max: number | null) {
  const preset = PRICE_RANGES.find((r) => r.min === min && r.max === max);
  if (preset) return preset.label;
  if (min !== null && max !== null) return `${formatPrice(min)} – ${formatPrice(max)}`;
  if (min !== null) return `Desde ${formatPrice(min)}`;
  return `Hasta ${formatPrice(max ?? 0)}`;
}

// Chips de filtros activos: la forma más rápida de deshacer un filtro sin abrir el panel.
export function ActiveFilters({ className }: { className?: string }) {
  const { filters, navigate, tree } = useCatalog();

  const chips: Chip[] = [
    ...(filters.q ? [{ key: "q", label: `«${filters.q}»`, remove: { q: "" } }] : []),
    ...filters.categories.map((slug) => ({
      key: `cat-${slug}`,
      label: findCategory(tree, slug)?.name ?? slug,
      remove: { categories: filters.categories.filter((s) => s !== slug) },
    })),
    ...(filters.minPrice !== null || filters.maxPrice !== null
      ? [{ key: "price", label: priceLabel(filters.minPrice, filters.maxPrice), remove: { minPrice: null, maxPrice: null } }]
      : []),
    ...(filters.onSale ? [{ key: "sale", label: "Solo ofertas", remove: { onSale: false } }] : []),
    ...(filters.inStock ? [{ key: "stock", label: "Solo disponibles", remove: { inStock: false } }] : []),
  ];

  if (chips.length === 0) return null;

  return (
    <div className={className}>
      <ul aria-label="Filtros aplicados" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
        {chips.map((chip) => (
          <li key={chip.key} className="shrink-0">
            <button
              type="button"
              onClick={() => navigate(chip.remove)}
              aria-label={`Quitar filtro: ${chip.label}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-pill bg-surface pr-2.5 pl-3.5 text-sm font-medium text-brand transition-colors hover:bg-brand-50"
            >
              {chip.label}
              <XIcon className="size-4" aria-hidden="true" />
            </button>
          </li>
        ))}
        {countActiveFilters(filters) > 0 && (
          <li className="shrink-0">
            <button
              type="button"
              onClick={() => navigate({ categories: [], minPrice: null, maxPrice: null, onSale: false, inStock: false })}
              className="inline-flex h-9 items-center px-2 text-sm font-semibold text-brand underline underline-offset-4 hover:no-underline"
            >
              Limpiar filtros
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}
