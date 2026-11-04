"use client";

import { useRef } from "react";
import type { ProductOption, ProductVariant } from "@/lib/products";
import { cn } from "@/lib/utils";

type Props = {
  options: ProductOption[];
  variants: ProductVariant[];
  selected: ProductVariant;
  onSelect: (variant: ProductVariant) => void;
};

// Al cambiar una opción se conserva el resto; si esa combinación no existe,
// se busca la primera disponible con el valor elegido.
export function resolveVariant(
  variants: ProductVariant[],
  current: Record<string, string>,
  name: string,
  value: string,
) {
  const wanted = { ...current, [name]: value };
  const exact = variants.find((v) => Object.entries(wanted).every(([k, val]) => v.options[k] === val));
  if (exact) return exact;
  const withValue = variants.filter((v) => v.options[name] === value);
  return withValue.find((v) => v.stock > 0) ?? withValue[0];
}

export function VariantSelector({ options, variants, selected, onSelect }: Props) {
  return (
    <div className="space-y-5">
      {options.map((option) => (
        <OptionGroup key={option.name} option={option} variants={variants} selected={selected} onSelect={onSelect} />
      ))}
    </div>
  );
}

function OptionGroup({ option, variants, selected, onSelect }: { option: ProductOption } & Omit<Props, "options">) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const isSwatch = option.values.some((v) => v.swatch);
  const current = selected.options[option.name];
  const labelId = `opcion-${option.name.toLowerCase()}`;

  // Estado de cada valor combinado con lo demás que ya está elegido.
  const states = option.values.map(({ value }) => {
    const match = variants.find((v) =>
      Object.entries({ ...selected.options, [option.name]: value }).every(([k, val]) => v.options[k] === val),
    );
    return { exists: Boolean(match), inStock: Boolean(match && match.stock > 0) };
  });

  function choose(index: number) {
    const variant = resolveVariant(variants, selected.options, option.name, option.values[index].value);
    if (variant) onSelect(variant);
  }

  // radiogroup: las flechas mueven la selección (patrón ARIA).
  function onKeyDown(event: React.KeyboardEvent, index: number) {
    const step =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    if (!step) return;
    event.preventDefault();
    let next = index;
    do next = (next + step + option.values.length) % option.values.length;
    while (!states[next].exists && next !== index);
    choose(next);
    refs.current[next]?.focus();
  }

  return (
    <div>
      <p id={labelId} className="mb-2.5 text-[0.9375rem] text-heading">
        {option.name}: <span className="font-semibold">{current}</span>
      </p>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className={cn(
          "flex gap-2.5",
          isSwatch ? "flex-wrap" : "-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0",
        )}
      >
        {option.values.map(({ value, swatch }, index) => {
          const checked = value === current;
          const { exists, inStock } = states[index];
          const label = `${value}${!exists ? ", no disponible en esta combinación" : !inStock ? ", agotado" : ""}`;
          return (
            <button
              key={value}
              ref={(el) => {
                refs.current[index] = el;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={isSwatch ? label : undefined}
              disabled={!exists}
              tabIndex={checked ? 0 : -1}
              onClick={() => choose(index)}
              onKeyDown={(e) => onKeyDown(e, index)}
              title={isSwatch ? value : undefined}
              className={cn(
                "relative shrink-0 transition disabled:cursor-not-allowed disabled:opacity-30",
                isSwatch
                  ? "size-tap rounded-full ring-2 ring-offset-2"
                  : "inline-flex h-tap items-center rounded-pill border px-4 text-[0.9375rem] font-medium whitespace-nowrap",
                isSwatch && (checked ? "ring-brand" : "ring-transparent hover:ring-line"),
                !isSwatch &&
                  (checked
                    ? "border-brand bg-brand text-white"
                    : "border-input bg-white text-heading hover:border-brand"),
                !inStock && exists && !isSwatch && "line-through decoration-1",
                !inStock && exists && !isSwatch && !checked && "text-muted-foreground",
              )}
            >
              {isSwatch ? (
                <>
                  <span
                    className="absolute inset-0 rounded-full border border-black/10"
                    style={{ backgroundColor: swatch }}
                    aria-hidden="true"
                  />
                  {!inStock && exists && (
                    // Diagonal sobre la muestra: agotado pero seleccionable.
                    <span className="absolute inset-0 overflow-hidden rounded-full" aria-hidden="true">
                      <span className="absolute top-1/2 left-1/2 h-px w-[140%] -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-heading/60" />
                    </span>
                  )}
                </>
              ) : (
                <span>
                  {value}
                  {!inStock && exists && <span className="sr-only">, agotado</span>}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
