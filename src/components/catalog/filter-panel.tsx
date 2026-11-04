"use client";

import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { AttributeFacet, CatalogResult } from "@/lib/catalog";
import { attributesApply, countActiveFilters, type CatalogFilters } from "@/lib/catalog-params";
import { cn } from "@/lib/utils";
import { useCatalog } from "./catalog-provider";

type Props = {
  value: CatalogFilters;
  onChange: (changes: Partial<CatalogFilters>) => void;
  facets: CatalogResult["facets"];
  idPrefix: string;
  defaultOpen?: string[];
  before?: React.ReactNode; // secciones extra al inicio de los filtros (p. ej. "Ordenar por" en móvil)
  onClear?: () => void; // "Borrar" junto al título de filtros (en móvil el botón va al pie)
};

const eyebrow = "text-sm font-bold tracking-[0.12em] text-brand uppercase";
const sectionTrigger =
  "min-h-14 items-center py-0 text-base font-bold text-heading hover:no-underline **:data-[slot=accordion-trigger-icon]:size-5 **:data-[slot=accordion-trigger-icon]:text-brand";
const optionRow =
  "flex min-h-tap cursor-pointer items-center gap-3 rounded-lg px-2 text-[0.9375rem] text-heading hover:bg-surface lg:min-h-9 has-disabled:cursor-not-allowed has-disabled:text-muted-foreground has-disabled:hover:bg-transparent";
const inputClass = "size-5 shrink-0 accent-brand";

// Panel de filtros al estilo terza-sitio: arriba "Categorías" con un selector en píldora y la categoría
// elegida resaltada; abajo "Filtros" con acordeones cerrados (precio, disponibilidad y los atributos de
// la categoría: estilo, tono, uso…).
export function FilterPanel({ value, onChange, facets, idPrefix, defaultOpen, before, onClear }: Props) {
  const { tree } = useCatalog();
  return (
    <div>
      <CategoryPicker value={value} onChange={onChange} facets={facets} idPrefix={idPrefix} />

      <div className="mt-8 flex items-center justify-between border-b border-line pb-3">
        <h2 className={eyebrow}>Filtros</h2>
        {onClear && countActiveFilters({ ...value, categories: [] }) > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-sm font-bold text-brand underline-offset-4 hover:underline"
          >
            Borrar
          </button>
        )}
      </div>

      <Accordion type="multiple" defaultValue={defaultOpen ?? []}>
        {before}

        <AccordionItem value="precio" className="border-line">
          <AccordionTrigger className={sectionTrigger}>Precio</AccordionTrigger>
          <AccordionContent className="pb-3">
            {/* La key reinicia los campos si el precio cambia desde fuera (chips, "Borrar"). */}
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

        {facets.attributes.map((facet) => (
          <AttributeSection key={facet.key} facet={facet} value={value} onChange={onChange} idPrefix={idPrefix} />
        ))}
      </Accordion>

      {facets.attributes.length === 0 && !attributesApply(tree, value.categories) && (
        <p className="mt-3 text-sm text-muted-foreground">
          {value.categories.length === 0 ? "Elige una categoría" : "Elige una subcategoría"} para filtrar por estilo,
          tono, colección y más.
        </p>
      )}
    </div>
  );
}

// Selector de categoría (una a la vez) y, debajo, la categoría elegida resaltada con su conteo. Si es una
// sección (Pisos, Muros…), también sus subcategorías para afinar con un toque.
function CategoryPicker({
  value,
  onChange,
  facets,
  idPrefix,
}: Pick<Props, "value" | "onChange" | "facets" | "idPrefix">) {
  const { tree } = useCatalog();
  const selected = value.categories.length === 1 ? value.categories[0] : "";
  // Cambiar de categoría limpia los atributos: cada categoría tiene los suyos.
  const select = (slug: string) => onChange({ categories: slug ? [slug] : [], attributes: {} });

  const section = facets.categories.find((p) => p.slug === selected);
  const child = facets.categories.flatMap((p) => p.children).find((c) => c.slug === selected);
  const rows = section
    ? [{ slug: section.slug, name: section.name, count: section.count }, ...section.children]
    : child
      ? [child]
      : [];

  return (
    <section aria-labelledby={`${idPrefix}-categorias`}>
      <h2 id={`${idPrefix}-categorias`} className={cn(eyebrow, "border-b border-line pb-3")}>
        Categorías
      </h2>

      <div className="relative mt-5">
        <label htmlFor={`${idPrefix}-categoria`} className="sr-only">
          Categoría
        </label>
        <select
          id={`${idPrefix}-categoria`}
          value={value.categories.length > 1 ? "__varias" : selected}
          onChange={(e) => select(e.target.value)}
          className="h-14 w-full cursor-pointer appearance-none rounded-pill border border-brand bg-white pr-12 pl-5 text-base text-heading focus-visible:ring-2 focus-visible:ring-brand/25 focus-visible:outline-none"
        >
          <option value="">Todas las categorías</option>
          {value.categories.length > 1 && (
            <option value="__varias" disabled>
              Varias categorías
            </option>
          )}
          {tree.map((parent) =>
            parent.children.length > 0 ? (
              <optgroup key={parent.slug} label={parent.name}>
                <option value={parent.slug}>Todo {parent.name.toLowerCase()}</option>
                {parent.children.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            ) : (
              <option key={parent.slug} value={parent.slug}>
                {parent.name}
              </option>
            ),
          )}
        </select>
        <ChevronDownIcon
          className="pointer-events-none absolute top-1/2 right-5 size-5 -translate-y-1/2 text-brand"
          aria-hidden="true"
        />
      </div>

      {rows.length > 0 && (
        <ul className="mt-4 space-y-1">
          {rows.map((row) => {
            const active = row.slug === selected;
            return (
              <li key={row.slug}>
                <button
                  type="button"
                  onClick={() => select(row.slug)}
                  aria-current={active ? "true" : undefined}
                  disabled={row.count === 0 && !active}
                  className={cn(
                    "flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl px-5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                    active ? "bg-surface font-bold text-brand" : "text-heading hover:bg-surface",
                  )}
                >
                  <span>{row.name}</span>
                  <span className="text-sm font-semibold text-muted-foreground tabular-nums">{row.count}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
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

function PriceInput({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="min-w-0 flex-1">
      <label htmlFor={id} className="mb-1 block text-xs text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground">
          $
        </span>
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

// Hasta 8 valores a la vista; el resto detrás de "Ver todos" (alfombras tiene 35 estilos).
const VISIBLE_VALUES = 8;

function AttributeSection({
  facet,
  value,
  onChange,
  idPrefix,
}: {
  facet: AttributeFacet;
  value: CatalogFilters;
  onChange: (changes: Partial<CatalogFilters>) => void;
  idPrefix: string;
}) {
  const selected = value.attributes[facet.key] ?? [];
  const [expanded, setExpanded] = useState(false);
  // Los elegidos siempre quedan a la vista aunque estén al final de la lista.
  const visible =
    expanded || facet.values.length <= VISIBLE_VALUES
      ? facet.values
      : facet.values.filter((v, i) => i < VISIBLE_VALUES || selected.includes(v.value));

  function toggle(option: string) {
    const next = selected.includes(option) ? selected.filter((v) => v !== option) : [...selected, option];
    onChange({ attributes: { ...value.attributes, [facet.key]: next } });
  }

  return (
    <AccordionItem value={`attr-${facet.key}`} className="border-line">
      <AccordionTrigger className={sectionTrigger}>{facet.label}</AccordionTrigger>
      <AccordionContent className="pb-3">
        <fieldset>
          <legend className="sr-only">{facet.label}</legend>
          {visible.map((option) => (
            <Option
              key={option.value}
              id={`${idPrefix}-${facet.key}-${option.value}`}
              label={option.value}
              count={option.count}
              checked={selected.includes(option.value)}
              onToggle={() => toggle(option.value)}
            />
          ))}
        </fieldset>
        {facet.values.length > VISIBLE_VALUES && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            aria-expanded={expanded}
            className="mt-1 min-h-9 px-2 text-sm font-semibold text-brand underline-offset-4 hover:underline"
          >
            {expanded ? "Ver menos" : `Ver todos (${facet.values.length})`}
          </button>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
