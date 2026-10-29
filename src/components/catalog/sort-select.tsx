"use client";

import { useId } from "react";
import { ChevronDownIcon } from "lucide-react";
import { SORT_OPTIONS, type SortKey } from "@/lib/catalog-params";
import { cn } from "@/lib/utils";
import { useCatalog } from "./catalog-provider";

// <select> nativo: en móvil abre el selector del sistema, más cómodo y accesible.
export function SortSelect({ variant }: { variant: "toolbar" | "inline" }) {
  const { filters, navigate } = useCatalog();
  const id = useId();
  const options = SORT_OPTIONS.filter((o) => !o.searchOnly || filters.q);

  return (
    <div className={cn("flex items-center gap-2", variant === "toolbar" && "relative")}>
      <label htmlFor={id} className={cn("text-sm whitespace-nowrap", variant === "toolbar" && "sr-only")}>
        Ordenar por
      </label>
      <div className="relative w-full">
        <select
          id={id}
          value={filters.sort}
          onChange={(e) => navigate({ sort: e.target.value as SortKey })}
          className={cn(
            "w-full cursor-pointer appearance-none rounded-pill border border-input bg-white pr-9 text-base font-medium text-heading",
            variant === "toolbar" ? "h-tap truncate pl-4 text-[0.9375rem]" : "h-10 pl-4 text-sm",
          )}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-brand" aria-hidden="true" />
      </div>
    </div>
  );
}
