import Link from "next/link";
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { pageNumbers, type Sort } from "@/lib/admin/table-params";
import { cn } from "@/lib/utils";

// Piezas de los listados del panel al estilo del datatable de terza-sitio: encabezados que ordenan, el pie
// "Mostrando 1 a 20 de 138" y el paginador de círculos. Todo son enlaces (funciona sin JavaScript).

// Encabezado que ordena: ⇅ sin orden, ↑ ascendente, ↓ descendente (aria-sort para lectores de pantalla).
export function SortableTh<K extends string>({
  label,
  sortKey,
  sort,
  href,
  align = "left",
  className,
}: {
  className?: string;
  label: string;
  sortKey: K;
  sort: Sort<K>;
  href: string;
  align?: "left" | "right";
}) {
  const active = sort?.key === sortKey ? sort.dir : null;
  const Icon = active === "asc" ? ArrowUpIcon : active === "desc" ? ArrowDownIcon : ArrowUpDownIcon;
  return (
    <th
      scope="col"
      aria-sort={active === "asc" ? "ascending" : active === "desc" ? "descending" : "none"}
      className={cn(align === "right" && "text-right", className)}
    >
      <Link
        href={href}
        scroll={false}
        className={cn("inline-flex items-center gap-1.5 hover:text-brand", align === "right" && "flex-row-reverse")}
      >
        {label}
        <Icon
          className={cn("size-3.5", active ? "text-brand" : "text-[#98a6ad]")}
          strokeWidth={2.5}
          aria-hidden="true"
        />
        <span className="sr-only">
          {active === "asc" ? "(orden ascendente)" : active === "desc" ? "(orden descendente)" : "(ordenar)"}
        </span>
      </Link>
    </th>
  );
}

// Pie de la tarjeta: "Mostrando 1 a 20 de 138 pedidos" y los números de página.
export function TablePager({
  page,
  pageCount,
  pageSize,
  total,
  noun,
  href,
}: {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  noun: [string, string];
  href: (page: number) => string;
}) {
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(page * pageSize, total);
  const circle =
    "grid size-10 place-items-center rounded-full border border-[#dee2e6] bg-white text-[#343a40] tabular-nums transition-colors";

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 md:mt-0 md:border-t md:border-line md:px-8 md:py-5">
      <p aria-live="polite" className="text-sm">
        Mostrando <b className="font-semibold text-heading">{from}</b> a <b className="font-semibold text-heading">{to}</b>{" "}
        de <b className="font-semibold text-heading">{total}</b> {total === 1 ? noun[0] : noun[1]}
      </p>
      {pageCount > 1 && (
        <nav aria-label="Páginas">
          <ul className="flex items-center gap-1.5">
            <li>
              {page > 1 ? (
                <Link href={href(page - 1)} aria-label="Página anterior" className={cn(circle, "hover:border-brand hover:text-brand")}>
                  <ChevronLeftIcon className="size-4" aria-hidden="true" />
                </Link>
              ) : (
                <span aria-hidden="true" className={cn(circle, "text-[#dee2e6]")}>
                  <ChevronLeftIcon className="size-4" />
                </span>
              )}
            </li>
            {pageNumbers(page, pageCount).map((n, i) =>
              n === null ? (
                <li key={`puntos-${i}`} aria-hidden="true" className="px-0.5 text-[#98a6ad]">
                  …
                </li>
              ) : (
                <li key={n}>
                  <Link
                    href={href(n)}
                    aria-label={`Página ${n}`}
                    aria-current={n === page ? "page" : undefined}
                    className={cn(
                      circle,
                      n === page ? "border-brand bg-brand text-white" : "hover:border-brand hover:text-brand",
                    )}
                  >
                    {n}
                  </Link>
                </li>
              ),
            )}
            <li>
              {page < pageCount ? (
                <Link href={href(page + 1)} aria-label="Página siguiente" className={cn(circle, "hover:border-brand hover:text-brand")}>
                  <ChevronRightIcon className="size-4" aria-hidden="true" />
                </Link>
              ) : (
                <span aria-hidden="true" className={cn(circle, "text-[#dee2e6]")}>
                  <ChevronRightIcon className="size-4" />
                </span>
              )}
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
