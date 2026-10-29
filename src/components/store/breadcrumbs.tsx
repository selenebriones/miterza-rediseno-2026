import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

// El último elemento es la página actual. "Inicio" se agrega siempre al principio.
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all = [{ label: "Inicio", href: "/" }, ...items];

  return (
    <nav aria-label="Ruta de navegación">
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {all.map((item, index) => {
          const current = index === all.length - 1;
          return (
            // En móvil se omite la página actual (ya es el H1) para que las migas quepan en una línea.
            <li key={`${item.label}-${index}`} className={cn("flex items-center gap-1", current && all.length > 2 && "max-sm:hidden")}>
              {index > 0 && <ChevronRightIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />}
              {current || !item.href ? (
                <span aria-current={current ? "page" : undefined} className="font-medium text-heading">
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="hover:text-brand hover:underline">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
