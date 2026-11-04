"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2Icon, SlidersHorizontalIcon } from "lucide-react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useScrolledPast } from "@/hooks/use-scrolled-past";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { CatalogResult } from "@/lib/catalog";
import { catalogHref, CLEARED_FILTERS, countActiveFilters, SORT_OPTIONS } from "@/lib/catalog-params";
import { cn } from "@/lib/utils";
import { useCatalog } from "./catalog-provider";
import { FilterPanel } from "./filter-panel";
import { SortSelect } from "./sort-select";

type Props = {
  facets: CatalogResult["facets"];
  total: number; // resultados con los filtros aplicados
};

const CLEARED = CLEARED_FILTERS;

export function MobileToolbar({ facets, total }: Props) {
  const { filters, navigate } = useCatalog();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(filters);
  const [draftCount, setDraftCount] = useState<{ href: string; total: number } | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  // Píldora flotante cuando la barra de arriba ya salió de la pantalla.
  const showFloating = useScrolledPast(toolbarRef);
  const activeCount = countActiveFilters(filters);

  // Cuántos resultados daría el borrador de filtros, para el botón "Ver N productos".
  const draftHref = catalogHref(draft);
  const appliedHref = catalogHref(filters);
  useEffect(() => {
    if (!open || draftHref === appliedHref) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const query = draftHref.split("?")[1] ?? "";
        const res = await fetch(`/api/catalog/count?${query}`, { signal: controller.signal });
        const data: { total: number } = await res.json();
        setDraftCount({ href: draftHref, total: data.total });
      } catch {}
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, draftHref, appliedHref]);

  const resultCount = draftHref === appliedHref ? total : draftCount?.href === draftHref ? draftCount.total : null;

  function openSheet() {
    setDraft(filters);
    setOpen(true);
  }

  function apply() {
    navigate(draft);
    setOpen(false);
  }

  return (
    <>
      <div ref={toolbarRef} className="grid grid-cols-2 gap-2 lg:hidden">
        <button
          type="button"
          onClick={openSheet}
          aria-haspopup="dialog"
          className="inline-flex h-tap items-center justify-center gap-2 rounded-pill border border-input bg-white font-medium text-heading"
        >
          <SlidersHorizontalIcon className="size-4 text-brand" aria-hidden="true" />
          Filtrar
          {activeCount > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-pill bg-brand px-1.5 text-xs font-bold text-white">
              <span className="sr-only">, </span>
              {activeCount}
              <span className="sr-only"> activos</span>
            </span>
          )}
        </button>
        <SortSelect variant="toolbar" />
      </div>

      <button
        type="button"
        onClick={openSheet}
        aria-haspopup="dialog"
        tabIndex={showFloating ? 0 : -1}
        aria-hidden={!showFloating}
        className={cn(
          "fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-header inline-flex h-12 -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-pill bg-brand px-5 font-semibold text-white shadow-card-hover transition-all duration-200 lg:hidden",
          showFloating ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
        )}
      >
        <SlidersHorizontalIcon className="size-4" aria-hidden="true" />
        Filtrar y ordenar
        {activeCount > 0 && (
          <span className="grid h-5 min-w-5 place-items-center rounded-pill bg-accent px-1.5 text-xs font-bold text-brand">
            {activeCount}
          </span>
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[90dvh] gap-0 rounded-t-2xl bg-white p-0 lg:hidden">
          <SheetHeader className="border-b border-line px-5 py-4">
            <SheetTitle className="text-lg font-bold text-heading">Filtros y orden</SheetTitle>
            <SheetDescription className="sr-only">Los cambios se aplican al tocar “Ver productos”.</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4">
            <FilterPanel
              value={draft}
              onChange={(changes) => setDraft((d) => ({ ...d, ...changes }))}
              facets={facets}
              idPrefix="m"
              before={
                <AccordionItem value="orden" className="border-line">
                  <AccordionTrigger className="min-h-tap items-center py-0 text-base font-semibold text-heading hover:no-underline">
                    <span>
                      Ordenar por{" "}
                      <span className="font-normal text-body">
                        · {SORT_OPTIONS.find((o) => o.value === draft.sort)?.label}
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <fieldset>
                      <legend className="sr-only">Ordenar por</legend>
                      {SORT_OPTIONS.filter((o) => !o.searchOnly || draft.q).map((o) => (
                        <label
                          key={o.value}
                          htmlFor={`m-orden-${o.value}`}
                          className="flex min-h-tap cursor-pointer items-center gap-3 rounded-lg px-2 text-[0.9375rem] text-heading hover:bg-surface"
                        >
                          <input
                            id={`m-orden-${o.value}`}
                            type="radio"
                            name="m-orden"
                            checked={draft.sort === o.value}
                            onChange={() => setDraft((d) => ({ ...d, sort: o.value }))}
                            className="size-5 accent-brand"
                          />
                          {o.label}
                        </label>
                      ))}
                    </fieldset>
                  </AccordionContent>
                </AccordionItem>
              }
            />
          </div>

          <div className="flex gap-3 border-t border-line px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={() => setDraft((d) => ({ ...d, ...CLEARED }))}
              disabled={countActiveFilters(draft) === 0}
              className="h-12 flex-1 rounded-pill border border-brand font-semibold text-brand disabled:border-line disabled:text-muted-foreground"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={apply}
              disabled={resultCount === 0}
              aria-live="polite"
              className="inline-flex h-12 flex-[2] items-center justify-center gap-2 rounded-pill bg-brand font-semibold text-white transition-colors active:bg-brand-active disabled:bg-line disabled:text-muted-foreground"
            >
              {resultCount === null ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
                  Ver productos
                </>
              ) : resultCount === 0 ? (
                "Sin resultados"
              ) : (
                `Ver ${resultCount} ${resultCount === 1 ? "producto" : "productos"}`
              )}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
