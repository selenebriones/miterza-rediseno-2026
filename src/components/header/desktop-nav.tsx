"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowRightIcon, ChevronDownIcon, ChevronRightIcon, ImageIcon } from "lucide-react";
import type { MenuProduct, NavItem } from "@/lib/navigation";
import { formatPrice } from "@/lib/store-config";
import { pricePerArea } from "@/lib/unit-price";
import { cn } from "@/lib/utils";

type Props = {
  items: NavItem[];
  products: Record<string, MenuProduct[]>; // productos por slug de categoría o línea
};

const CLOSE_DELAY_MS = 160;

// Mega menú de ancho completo, como en terza-sitio: al abrir una categoría aparece un panel bajo el
// header con su título y descripción, la lista de líneas a la izquierda y las tarjetas de la línea
// elegida a la derecha. Se abre con el cursor, con clic o con teclado.
export function DesktopNav({ items, products }: Props) {
  const pathname = usePathname();
  // El estado guarda la ruta en la que se abrió: al navegar, el menú se cierra solo.
  const [open, setOpen] = useState<{ id: string | null; path: string }>({ id: null, path: pathname });
  const [activeLine, setActiveLine] = useState<Record<string, string>>({});
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const navRef = useRef<HTMLElement>(null);
  const openId = open.path === pathname ? open.id : null;

  const show = (id: string | null) => {
    // Al abrir otra categoría vuelve a mostrarse su primera línea.
    if (id && id !== openId) setActiveLine((prev) => ({ ...prev, [id]: "" }));
    setOpen({ id, path: pathname });
  };
  const cancelClose = () => clearTimeout(closeTimer.current);
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => show(null), CLOSE_DELAY_MS);
  };

  return (
    <nav
      ref={navRef}
      aria-label="Categorías"
      className="h-full"
      onMouseEnter={cancelClose}
      onMouseLeave={scheduleClose}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) show(null);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && openId) {
          show(null);
          navRef.current?.querySelector<HTMLElement>(`[data-trigger="${openId}"]`)?.focus();
        }
      }}
    >
      <ul className="flex h-full items-stretch gap-1 xl:gap-3">
        {items.map((item) => {
          const hasMenu = Boolean(item.children?.length);
          if (!hasMenu) {
            return (
              <li key={item.id} className="flex items-center" onMouseEnter={() => show(null)}>
                <Link
                  href={item.href}
                  className={cn(
                    item.isHighlight
                      ? "inline-flex h-9 items-center rounded-full bg-accent px-5 text-sm font-semibold text-brand transition-colors hover:bg-accent-hover"
                      : "px-3 text-base font-medium text-heading hover:text-brand xl:text-[1.0625rem]",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          }

          const isOpen = openId === item.id;
          return (
            <li key={item.id} className="flex">
              <button
                type="button"
                data-trigger={item.id}
                aria-expanded={isOpen}
                aria-controls={`mega-${item.id}`}
                onMouseEnter={() => show(item.id)}
                onClick={() => show(isOpen ? null : item.id)}
                className={cn(
                  "group/trigger relative flex h-full items-center gap-1.5 px-3 text-base font-medium transition-colors xl:text-[1.0625rem]",
                  "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-accent after:transition-transform after:duration-150",
                  isOpen ? "text-brand after:scale-x-100" : "text-heading hover:text-brand hover:after:scale-x-100",
                )}
              >
                {item.label}
                <ChevronDownIcon
                  className={cn("size-4 transition-transform duration-200", isOpen && "rotate-180")}
                  aria-hidden="true"
                />
              </button>

              {isOpen && (
                <MegaPanel
                  item={item}
                  products={products}
                  activeSlug={activeLine[item.id]}
                  onActivate={(slug) => setActiveLine((prev) => ({ ...prev, [item.id]: slug }))}
                />
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function MegaPanel({
  item,
  products,
  activeSlug,
  onActivate,
}: {
  item: NavItem;
  products: Record<string, MenuProduct[]>;
  activeSlug: string | undefined;
  onActivate: (slug: string) => void;
}) {
  const lines = item.children ?? [];
  const active = lines.find((l) => l.categorySlug === activeSlug) ?? lines[0];
  const cards = (active?.categorySlug && products[active.categorySlug]) || [];

  return (
    // Ancho completo: se coloca respecto del header (el padre posicionado más cercano).
    <div
      id={`mega-${item.id}`}
      role="region"
      aria-label={`Menú de ${item.label}`}
      className="absolute inset-x-0 top-full border-y border-line bg-white shadow-xl"
    >
      <div className="container flex gap-10 py-10 xl:gap-16 xl:py-12">
        <div className="w-64 shrink-0 xl:w-80">
          <p className="text-2xl font-bold text-heading xl:text-3xl">{item.label}</p>
          {item.description && <p className="mt-2 text-sm">{item.description}</p>}

          <ul className="mt-6 space-y-1">
            {lines.map((line) => {
              const isActive = line.id === active?.id;
              return (
                <li key={line.id}>
                  <Link
                    href={line.href}
                    onMouseEnter={() => line.categorySlug && onActivate(line.categorySlug)}
                    onFocus={() => line.categorySlug && onActivate(line.categorySlug)}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "flex w-full items-center justify-between py-2 text-left text-sm font-medium transition-colors hover:text-brand xl:text-base",
                      isActive ? "text-brand" : "text-heading",
                    )}
                  >
                    {line.label}
                    <ChevronRightIcon className="size-4" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          {cards.length > 0 ? (
            <ul className="grid grid-cols-4 gap-6 xl:gap-8">
              {cards.map((product) => (
                <li key={product.slug}>
                  <Link href={`/productos/${product.slug}`} className="group/card block">
                    <span className="relative block aspect-[3/2] w-full overflow-hidden rounded-2xl bg-surface">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.imageAlt}
                          fill
                          sizes="(min-width: 1280px) 20vw, 18vw"
                          className="object-cover transition-transform duration-500 group-hover/card:scale-105"
                        />
                      ) : (
                        <span className="grid size-full place-items-center">
                          <ImageIcon className="size-7 text-brand/30" aria-hidden="true" />
                        </span>
                      )}
                    </span>
                    <span className="mt-3 block line-clamp-2 text-sm font-medium text-brand xl:text-base">
                      {product.name}
                    </span>
                    <span className="mt-0.5 block text-sm">
                      {product.hasPriceRange && "Desde "}
                      {formatPrice(pricePerArea(product.price, product.areaPerBox))}
                      {product.areaPerBox && "/m²"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-sm">Pronto tendremos productos en esta línea.</p>
          )}

          <Link
            href={active?.href ?? item.href}
            className="mt-8 inline-flex w-fit items-center gap-3 self-end rounded-full bg-accent px-7 py-1.5 text-base font-bold text-brand transition-colors hover:bg-accent-hover xl:text-lg"
          >
            {active ? `Ver todo ${active.label}` : "Ver todo"}
            <ArrowRightIcon className="size-[1.125rem]" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
