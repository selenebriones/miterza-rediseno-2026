"use client";

import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { CatalogResult } from "@/lib/catalog";
import { toggleCategory, type CatalogFilters } from "@/lib/catalog-params";
import { cn } from "@/lib/utils";
import { useCatalog } from "./catalog-provider";

type Props = {
  value: CatalogFilters;
  onChange: (changes: Partial<CatalogFilters>) => void;
  facets: CatalogResult["facets"];
  idPrefix: string;
  defaultOpen?: string[];
  before?: React.ReactNode; // secciones extra al inicio (p. ej. "Ordenar por" en móvil)
};

const sectionTrigger = "min-h-tap items-center py-0 text-base font-semibold text-heading hover:no-underline";
const optionRow =
  "flex min-h-tap cursor-pointer items-center gap-3 rounded-lg px-2 text-[0.9375rem] text-heading hover:bg-surface lg:min-h-9 has-disabled:cursor-not-allowed has-disabled:text-muted-foreground has-disabled:hover:bg-transparent";
const inputClass = "size-5 shrink-0 accent-brand";

export function FilterPanel({ value, onChange, facets, idPrefix, defaultOpen, before }: Props) {
  const { tree } = useCatalog();
  return (
    <Accordion type="multiple" defaultValue={defaultOpen ?? ["orden", "categoria", "precio", "disponibilidad"]}>
      {before}

      <AccordionItem value="categoria" className="border-line">
        <AccordionTrigger className={sectionTrigger}>Categoría</AccordionTrigger>
        <AccordionContent className="pb-3">
          <fieldset>
            <legend className="sr-only">Categoría</legend>
            {facets.categories.map((parent) => {
              const parentChecked = value.categories.includes(parent.slug);
              return (
                <div key={parent.slug}>
                  <Option
                    id={`${idPrefix}-cat-${parent.slug}`}
                    label={parent.name}
                    count={parent.count}
                    checked={parentChecked}
                    onToggle={() => onChange({ categories: toggleCategory(tree, value.categories, parent.slug) })}
                    strong
                  />
                  <div className="ml-4 border-l-2 border-surface pl-2">
                    {parent.children.map((child) => (
                      <Option
                        key={child.slug}
                        id={`${idPrefix}-cat-${child.slug}`}
                        label={child.name}
                        count={child.count}
                        // Si la categoría completa está marcada, sus líneas se ven incluidas.
                        checked={parentChecked || value.categories.includes(child.slug)}
                        onToggle={() => onChange({ categories: toggleCategory(tree, value.categories, child.slug) })}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </fieldset>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="precio" className="border-line">
        <AccordionTrigger className={sectionTrigger}>Precio</AccordionTrigger>
        <AccordionContent className="pb-3">
          {/* La key reinicia los campos si el precio cambia desde fuera (chips, "Limpiar"). */}
          <PriceFilter
            key={`${value.minPrice}-${value.maxPrice}`}
            value={value}
            onChange={onChange}
            facets={facets}
            idPrefix={idPrefix}
          />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="disponibilidad" className="border-line">
        <AccordionTrigger className={sectionTrigger}>Disponibilidad</AccordionTrigger>
        <AccordionContent className="pb-3">
          <fieldset>
            <legend className="sr-only">Disponibilidad</legend>
            <Option
              id={`${idPrefix}-ofertas`}
              label="Solo ofertas"
              count={facets.onSale}
              checked={value.onSale}
              onToggle={() => onChange({ onSale: !value.onSale })}
            />
            <Option
              id={`${idPrefix}-disponible`}
              label="Solo disponibles"
              count={facets.inStock}
              checked={value.inStock}
              onToggle={() => onChange({ inStock: !value.inStock })}
            />
          </fieldset>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function Option({
  id,
  label,
  count,
  checked,
  onToggle,
  strong,
}: {
  id: string;
  label: string;
  count: number;
  checked: boolean;
  onToggle: () => void;
  strong?: boolean;
}) {
  // Una opción sin resultados se deshabilita (no se esconde) para que se entienda por qué no hay.
  const disabled = count === 0 && !checked;
  return (
    <label htmlFor={id} className={optionRow}>
      <input id={id} type="checkbox" checked={checked} disabled={disabled} onChange={onToggle} className={inputClass} />
      <span className={cn("flex-1", strong && "font-medium")}>{label}</span>
      <span className="text-sm text-muted-foreground tabular-nums">{count}</span>
    </label>
  );
}

function PriceFilter({ value, onChange, facets, idPrefix }: Omit<Props, "defaultOpen" | "before">) {
  const [min, setMin] = useState(value.minPrice?.toString() ?? "");
  const [max, setMax] = useState(value.maxPrice?.toString() ?? "");
  const anyPrice = value.minPrice === null && value.maxPrice === null;

  function apply(event: React.FormEvent) {
    event.preventDefault();
    let minPrice = min === "" ? null : Math.max(0, Math.round(Number(min)));
    let maxPrice = max === "" ? null : Math.max(0, Math.round(Number(max)));
    // Si los escriben al revés, se intercambian en lugar de mostrar un error.
    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) [minPrice, maxPrice] = [maxPrice, minPrice];
    onChange({ minPrice, maxPrice });
  }

  function choose(minPrice: number | null, maxPrice: number | null) {
    setMin(minPrice?.toString() ?? "");
    setMax(maxPrice?.toString() ?? "");
    onChange({ minPrice, maxPrice });
  }

  return (
    <div>
      <fieldset>
        <legend className="sr-only">Rango de precio</legend>
        <label htmlFor={`${idPrefix}-precio-todos`} className={optionRow}>
          <input
            id={`${idPrefix}-precio-todos`}
            type="radio"
            name={`${idPrefix}-precio`}
            checked={anyPrice}
            onChange={() => choose(null, null)}
            className={inputClass}
          />
          <span className="flex-1">Cualquier precio</span>
        </label>
        {facets.priceRanges.map((range) => {
          const checked = value.minPrice === range.min && value.maxPrice === range.max;
          const disabled = range.count === 0 && !checked;
          const id = `${idPrefix}-precio-${range.min ?? 0}-${range.max ?? "max"}`;
          return (
            <label key={id} htmlFor={id} className={optionRow}>
              <input
                id={id}
                type="radio"
                name={`${idPrefix}-precio`}
                checked={checked}
                disabled={disabled}
                onChange={() => choose(range.min, range.max)}
                className={inputClass}
              />
              <span className="flex-1">{range.label}</span>
              <span className="text-sm text-muted-foreground tabular-nums">{range.count}</span>
            </label>
          );
        })}
      </fieldset>

      <form onSubmit={apply} className="mt-3 flex items-end gap-2 px-2">
        <PriceInput id={`${idPrefix}-min`} label="Mínimo" value={min} onChange={setMin} />
        <span className="pb-2.5 text-muted-foreground" aria-hidden="true">
          –
        </span>
        <PriceInput id={`${idPrefix}-max`} label="Máximo" value={max} onChange={setMax} />
        <button
          type="submit"
          className="h-10 shrink-0 rounded-lg border border-brand px-3 text-sm font-semibold text-brand transition-colors hover:bg-surface"
        >
          Aplicar
        </button>
      </form>
    </div>
  );
}

function PriceInput({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="min-w-0 flex-1">
      <label htmlFor={id} className="mb-1 block text-xs text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground">$</span>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={0}
          step={50}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full rounded-lg border border-input bg-white pr-2 pl-6 text-base text-heading"
        />
      </div>
    </div>
  );
}
