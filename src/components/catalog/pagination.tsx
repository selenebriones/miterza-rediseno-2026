import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { catalogHref, type CatalogFilters } from "@/lib/catalog-params";
import { cn } from "@/lib/utils";

type Props = {
  filters: CatalogFilters;
  page: number;
  pageCount: number;
};

// 1 … 4 5 [6] 7 8 … 12: primera, última y vecinas de la actual.
function pageList(page: number, pageCount: number): (number | "…")[] {
  const pages = new Set([1, pageCount, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pageCount));
  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? ["…" as const, p] : [p]));
}

const pageClass =
  "inline-flex h-tap min-w-tap items-center justify-center rounded-pill px-3 font-medium whitespace-nowrap text-heading transition-colors hover:bg-surface";

// Enlaces reales (?pagina=N): rastreables por Google y compatibles con "Atrás".
export function Pagination({ filters, page, pageCount }: Props) {
  if (pageCount <= 1) return null;
  const href = (p: number) => catalogHref(filters, { page: p });

  return (
    <nav aria-label="Paginación" className="mt-12 flex items-center justify-between gap-2 sm:justify-center">
      {page > 1 ? (
        <Link href={href(page - 1)} rel="prev" className={cn(pageClass, "gap-1 text-brand")}>
          <ChevronLeftIcon className="size-5" aria-hidden="true" />
          <span className="max-sm:sr-only">Anterior</span>
        </Link>
      ) : (
        <span className={cn(pageClass, "gap-1 text-muted-foreground hover:bg-transparent")} aria-hidden="true">
          <ChevronLeftIcon className="size-5" />
          <span className="max-sm:hidden">Anterior</span>
        </span>
      )}

      {/* Móvil: los números no caben con áreas de 44px. */}
      <p className="text-sm sm:hidden">
        Página <strong className="text-heading">{page}</strong> de {pageCount}
      </p>

      <ol className="hidden items-center gap-1 sm:flex">
        {pageList(page, pageCount).map((p, i) =>
          p === "…" ? (
            <li key={`gap-${i}`} className="px-1 text-muted-foreground" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                href={href(p)}
                aria-label={`Página ${p}`}
                aria-current={p === page ? "page" : undefined}
                className={cn(pageClass, p === page && "bg-brand text-white hover:bg-brand")}
              >
                {p}
              </Link>
            </li>
          ),
        )}
      </ol>

      {page < pageCount ? (
        <Link href={href(page + 1)} rel="next" className={cn(pageClass, "gap-1 text-brand")}>
          <span className="max-sm:sr-only">Siguiente</span>
          <ChevronRightIcon className="size-5" aria-hidden="true" />
        </Link>
      ) : (
        <span className={cn(pageClass, "gap-1 text-muted-foreground hover:bg-transparent")} aria-hidden="true">
          <span className="max-sm:hidden">Siguiente</span>
          <ChevronRightIcon className="size-5" />
        </span>
      )}
    </nav>
  );
}
