"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, ImageIcon, SearchIcon, XIcon } from "lucide-react";
import type { SearchCategory, SearchProduct } from "@/lib/search-types";
import { cn } from "@/lib/utils";
import { MIN_QUERY_LENGTH, useRecentSearches, useSearch } from "./use-search";

type Option = { id: string; href: string; term?: string; content: ReactNode };
type Section = { id: string; title: string; options: Option[] };

type Props = {
  onNavigate?: () => void;
  popularCategories: SearchCategory[]; // "Búsquedas populares" antes de escribir y en "sin resultados"
};

const resultsHref = (q: string) => `/productos?q=${encodeURIComponent(q)}`;

// Campo y resultados de la capa de búsqueda, con el estilo de terza-sitio: texto blanco sobre
// verde oscuro, campo en píldora con borde blanco y resultados grandes separados por líneas.
// Es un combobox: las flechas recorren los resultados y Enter abre el marcado.
export function SearchBox({ onNavigate, popularCategories }: Props) {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const search = useSearch(query);
  const { recent, save, clear } = useRecentSearches();

  const q = query.trim();
  const typing = q.length >= MIN_QUERY_LENGTH;
  const sections: Section[] = [];

  if (typing && search.status === "done") {
    const { categories, products } = search.results;
    if (categories.length > 0) {
      sections.push({
        id: "categories",
        title: "Categorías",
        options: categories.map((c) => ({
          id: `category-${c.slug}`,
          href: c.href,
          content: <ResultText title={c.name} caption="Catálogo" />,
        })),
      });
    }
    if (products.length > 0) {
      sections.push({
        id: "products",
        title: "Productos",
        options: products.map((p) => ({
          id: `product-${p.slug}`,
          href: `/productos/${p.slug}`,
          term: q,
          content: <ProductResult product={p} />,
        })),
      });
    }
  }

  const options = sections.flatMap((s) => s.options);
  const isEmpty = typing && search.status === "done" && options.length === 0;
  const activeOption = options[activeIndex];

  function go(href: string, term?: string) {
    if (term) save(term);
    router.push(href);
    setActiveIndex(-1);
    onNavigate?.();
  }

  function pick(term: string) {
    setQuery(term);
    setActiveIndex(-1);
    inputRef.current?.focus();
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
      go(activeOption.href, activeOption.term);
    } else if (event.key === "Escape" && query) {
      // Primero borra; un segundo Esc cierra la capa (lo maneja el diálogo).
      setQuery("");
    }
  }

  return (
    <div>
      <p className="text-sm font-bold tracking-widest text-accent uppercase">¿Qué estás buscando?</p>
      <form
        role="search"
        action="/productos"
        onSubmit={(event) => {
          event.preventDefault();
          if (q) go(resultsHref(q), q);
        }}
        className="relative mt-6"
      >
        <input
          ref={inputRef}
          type="search"
          name="q"
          value={query}
          autoFocus
          autoComplete="off"
          enterKeyHint="search"
          placeholder="Buscar tapetes, persianas, colecciones…"
          aria-label="Buscar productos"
          role="combobox"
          aria-expanded={options.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeOption ? `${listId}-${activeOption.id}` : undefined}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
          }}
          onKeyDown={onKeyDown}
          className={cn(
            "h-14 w-full appearance-none rounded-pill border-2 border-white bg-transparent pr-28 pl-7 text-lg text-white outline-none md:h-16 md:text-xl",
            "transition-colors placeholder:text-white/70 focus:border-accent [&::-webkit-search-cancel-button]:hidden",
          )}
        />
        {query && (
          <button
            type="button"
            aria-label="Borrar búsqueda"
            onClick={() => pick("")}
            className="absolute top-1/2 right-15 grid size-10 -translate-y-1/2 place-items-center rounded-full text-white/70 transition-colors hover:text-white md:right-16"
          >
            <XIcon className="size-5" aria-hidden="true" />
          </button>
        )}
        <button
          type="submit"
          aria-label="Buscar"
          className="absolute top-1/2 right-2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-accent text-ink transition-colors hover:bg-white md:size-12"
        >
          <SearchIcon className="size-[1.125rem]" strokeWidth={1.8} aria-hidden="true" />
        </button>
      </form>

      {!typing && (
        <div className="mt-8 space-y-8">
          {recent.length > 0 && (
            <Chips
              title="Búsquedas recientes"
              terms={recent}
              onPick={pick}
              action={
                <button type="button" onClick={clear} className="text-xs font-bold text-white/60 hover:text-accent">
                  Borrar
                </button>
              }
            />
          )}
          <Chips title="Búsquedas populares" terms={popularCategories.map((c) => c.name)} onPick={pick} />
        </div>
      )}

      <div id={listId} role="listbox" aria-label="Resultados de búsqueda" aria-live="polite" className="mt-6">
        {typing && search.status === "loading" && <ResultsSkeleton />}

        {typing && search.status === "error" && (
          <p className="mt-2 text-white/70">No pudimos buscar en este momento. Intenta de nuevo.</p>
        )}

        {isEmpty && (
          <div className="mt-2">
            <p className="text-white/70">
              Sin resultados para “{q}”. Prueba con otra palabra o{" "}
              <button
                type="button"
                onClick={() => go("/productos")}
                className="font-bold text-accent hover:underline"
              >
                ve todo el catálogo
              </button>
              .
            </p>
            <div className="mt-8">
              <Chips title="Búsquedas populares" terms={popularCategories.map((c) => c.name)} onPick={pick} />
            </div>
          </div>
        )}

        {sections.map((section) => (
          <div key={section.id} role="group" aria-labelledby={`${listId}-${section.id}`} className="mb-6">
            <p
              id={`${listId}-${section.id}`}
              className="text-xs font-bold tracking-widest text-white/60 uppercase"
            >
              {section.title}
            </p>
            <div className="mt-1 divide-y divide-white/10">
              {section.options.map((option) => {
                const index = options.indexOf(option);
                return (
                  <div
                    key={option.id}
                    id={`${listId}-${option.id}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    data-active={index === activeIndex}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => go(option.href, option.term)}
                    className="group flex cursor-pointer items-center justify-between gap-6 py-4 text-white"
                  >
                    {option.content}
                    <ArrowRightIcon
                      className="size-[1.125rem] shrink-0 transition-transform group-data-[active=true]:translate-x-1"
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {typing && search.status === "done" && search.results.products.length > 0 && (
          <button
            type="button"
            onClick={() => go(resultsHref(q), q)}
            className="inline-flex items-center gap-2 font-bold text-accent hover:underline"
          >
            Ver todos los resultados de “{q}”
            <ArrowRightIcon className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

function Chips({
  title,
  terms,
  onPick,
  action,
}: {
  title: string;
  terms: string[];
  onPick: (term: string) => void;
  action?: ReactNode;
}) {
  if (terms.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-4">
        <p className="text-xs font-bold tracking-widest text-white/60 uppercase">{title}</p>
        {action}
      </div>
      <ul className="mt-4 flex flex-wrap gap-2">
        {terms.map((term) => (
          <li key={term}>
            <button
              type="button"
              onClick={() => onPick(term)}
              className="rounded-pill border border-white/30 px-4 py-1.5 text-sm text-white transition-colors hover:border-accent hover:bg-accent hover:text-ink"
            >
              {term}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResultText({ title, caption }: { title: string; caption: string }) {
  return (
    <span className="min-w-0 flex-1">
      <span className="block text-xl font-bold transition-colors group-data-[active=true]:text-accent md:text-2xl">
        {title}
      </span>
      <span className="mt-1 block text-xs tracking-widest text-white/60 uppercase">{caption}</span>
    </span>
  );
}

function ProductResult({ product }: { product: SearchProduct }) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-4">
      <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-white/10">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt="" className="size-full object-cover" />
        ) : (
          <ImageIcon className="size-5 text-white/40" aria-hidden="true" />
        )}
      </span>
      <ResultText title={product.name} caption={product.category} />
    </span>
  );
}

function ResultsSkeleton() {
  return (
    <div aria-label="Buscando…" className="divide-y divide-white/10">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-4 py-4">
          <div className="size-14 animate-pulse rounded-lg bg-white/10" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-2/3 animate-pulse rounded bg-white/10" />
            <div className="h-3 w-1/4 animate-pulse rounded bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}
