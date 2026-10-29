"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, ClockIcon, ImageIcon, SearchIcon, SearchXIcon, TagIcon, XIcon } from "lucide-react";
import type { SearchCategory, SearchProduct } from "@/lib/search-types";
import { formatPrice } from "@/lib/store-config";
import { cn } from "@/lib/utils";
import { MIN_QUERY_LENGTH, useRecentSearches, useSearch } from "./use-search";

type Option = { id: string; href: string; content: ReactNode };
type Section = { id: string; title: string; options: Option[]; action?: ReactNode };

type Props = {
  // "header": campo dentro de la barra verde con resultados desplegables (desktop).
  // "overlay": campo de la capa de búsqueda a pantalla completa (móvil).
  variant: "header" | "overlay";
  autoFocus?: boolean;
  onNavigate?: () => void;
  trailing?: ReactNode;
  popularCategories: SearchCategory[]; // sugerencias antes de escribir y en "sin resultados"
};

const resultsHref = (q: string) => `/productos?q=${encodeURIComponent(q)}`;

export function SearchBox({ variant, autoFocus, onNavigate, trailing, popularCategories }: Props) {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const search = useSearch(query);
  const { recent, save, clear } = useRecentSearches();

  const q = query.trim();
  const sections: Section[] = [];

  if (q.length < MIN_QUERY_LENGTH) {
    if (recent.length > 0) {
      sections.push({
        id: "recent",
        title: "Búsquedas recientes",
        action: (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={clear}
            className="text-xs font-medium text-brand hover:underline"
          >
            Borrar
          </button>
        ),
        options: recent.map((term) => ({
          id: `recent-${term}`,
          href: resultsHref(term),
          content: (
            <>
              <ClockIcon className="size-4 text-muted-foreground" aria-hidden="true" />
              <span className="flex-1 truncate">{term}</span>
            </>
          ),
        })),
      });
    }
    sections.push({
      id: "popular",
      title: "Categorías populares",
      options: popularCategories.map((c) => ({
        id: `popular-${c.slug}`,
        href: c.href,
        content: (
          <>
            <TagIcon className="size-4 text-muted-foreground" aria-hidden="true" />
            <span className="flex-1">{c.name}</span>
          </>
        ),
      })),
    });
  } else if (search.status === "done") {
    const { categories, products } = search.results;
    if (categories.length > 0) {
      sections.push({
        id: "categories",
        title: "Categorías",
        options: categories.map((c) => ({
          id: `category-${c.slug}`,
          href: c.href,
          content: (
            <>
              <TagIcon className="size-4 text-muted-foreground" aria-hidden="true" />
              <span className="flex-1">{c.name}</span>
            </>
          ),
        })),
      });
    }
    if (products.length > 0) {
      sections.push({
        id: "products",
        title: "Productos",
        options: [
          ...products.map((p) => ({ id: `product-${p.slug}`, href: `/productos/${p.slug}`, content: <ProductRow product={p} /> })),
          {
            id: "all-results",
            href: resultsHref(q),
            content: (
              <span className="flex flex-1 items-center justify-between font-semibold text-brand">
                Ver todos los resultados de «{q}»
                <ArrowRightIcon className="size-4" aria-hidden="true" />
              </span>
            ),
          },
        ],
      });
    }
  }

  const options = sections.flatMap((s) => s.options);
  const isEmpty = search.status === "done" && options.length === 0;
  const panelOpen = variant === "overlay" || focused;
  const activeOption = options[activeIndex];

  function go(href: string, term?: string) {
    if (term) save(term);
    router.push(href);
    setFocused(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
    onNavigate?.();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (options.length === 0) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((i) => {
        const next = i + step;
        if (next < -1) return options.length - 1;
        if (next >= options.length) return -1;
        return next;
      });
    } else if (event.key === "Enter" && activeOption) {
      event.preventDefault();
      go(activeOption.href, activeOption.id.startsWith("recent-") ? activeOption.id.slice(7) : undefined);
    } else if (event.key === "Escape") {
      if (query) setQuery("");
      else inputRef.current?.blur();
    }
  }

  return (
    <div className={cn("relative", variant === "overlay" && "flex min-h-0 flex-1 flex-col")}>
      <form
        role="search"
        action="/productos"
        onSubmit={(event) => {
          event.preventDefault();
          if (q) go(resultsHref(q), q);
        }}
        className="flex items-center gap-2"
      >
        <div className="relative flex-1">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="search"
            name="q"
            value={query}
            autoFocus={autoFocus}
            autoComplete="off"
            enterKeyHint="search"
            placeholder="Buscar persianas, tapetes, líneas…"
            aria-label="Buscar productos"
            role="combobox"
            aria-expanded={panelOpen}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeOption ? `${listId}-${activeOption.id}` : undefined}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(-1);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={onKeyDown}
            className={cn(
              "h-11 w-full rounded-pill bg-white pr-12 pl-12 text-base text-heading placeholder:text-muted-foreground",
              "[&::-webkit-search-cancel-button]:hidden",
              "focus-visible:outline-accent",
              variant === "overlay" && "border border-input focus-visible:outline-brand",
            )}
          />
          {query ? (
            <button
              type="button"
              aria-label="Borrar búsqueda"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="absolute top-1/2 right-1 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted"
            >
              <XIcon className="size-4" aria-hidden="true" />
            </button>
          ) : (
            variant === "header" && (
              <button
                type="submit"
                aria-label="Buscar"
                className="absolute top-1/2 right-1 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-accent text-brand transition-colors hover:bg-accent-hover"
              >
                <ArrowRightIcon className="size-4" aria-hidden="true" />
              </button>
            )
          )}
        </div>
        {trailing}
      </form>

      <div
        id={listId}
        role="listbox"
        aria-label="Sugerencias de búsqueda"
        hidden={!panelOpen}
        onMouseDown={(e) => e.preventDefault()} // mantiene el foco en el campo al hacer clic
        className={cn(
          variant === "header"
            ? "absolute inset-x-0 top-full z-drawer mt-2 max-h-[70vh] overflow-y-auto rounded-card bg-white py-2 shadow-card-hover ring-1 ring-line"
            : "-mx-4 mt-3 flex-1 overflow-y-auto border-t border-line px-1 pt-2",
        )}
      >
        {search.status === "loading" && <ResultsSkeleton />}

        {search.status === "error" && (
          <p className="px-4 py-6 text-center text-sm">No pudimos buscar en este momento. Intenta de nuevo.</p>
        )}

        {isEmpty && (
          <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
            <SearchXIcon className="size-8 text-brand" aria-hidden="true" />
            <p className="font-semibold text-heading">No encontramos «{q}»</p>
            <p className="text-sm">Revisa la ortografía o prueba con un término más general.</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {popularCategories.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => go(c.href)}
                  className="h-9 rounded-pill bg-surface px-4 text-sm font-medium text-brand hover:bg-brand-50"
                >
                  {c.name}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => go("/productos")} className="mt-1 text-sm font-semibold text-brand underline">
              Ver todo el catálogo
            </button>
          </div>
        )}

        {sections.map((section) => (
          <div key={section.id} role="group" aria-labelledby={`${listId}-${section.id}`} className="py-1">
            <div className="flex items-center justify-between px-4 py-1.5">
              <p id={`${listId}-${section.id}`} className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {section.title}
              </p>
              {section.action}
            </div>
            {section.options.map((option) => {
              const index = options.indexOf(option);
              return (
                <div
                  key={option.id}
                  id={`${listId}-${option.id}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => go(option.href, option.id.startsWith("recent-") ? option.id.slice(7) : undefined)}
                  className={cn(
                    "mx-2 flex min-h-tap cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm text-heading",
                    index === activeIndex && "bg-surface",
                  )}
                >
                  {option.content}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductRow({ product }: { product: SearchProduct }) {
  return (
    <>
      <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-md bg-surface">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt="" className="size-full object-cover" />
        ) : (
          <ImageIcon className="size-5 text-brand/40" aria-hidden="true" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{product.name}</span>
        <span className="block text-xs text-body">
          {product.category} · {formatPrice(product.price)}
        </span>
      </span>
    </>
  );
}

function ResultsSkeleton() {
  return (
    <div aria-label="Buscando…" className="space-y-2 px-4 py-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="size-12 animate-pulse rounded-md bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
