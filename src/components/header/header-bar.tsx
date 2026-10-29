"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SearchIcon, UserIcon } from "lucide-react";
import { CartButton } from "@/components/cart/cart-button";
import { CartSheet } from "@/components/cart/cart-sheet";
import type { NavItem } from "@/lib/navigation";
import type { SearchCategory } from "@/lib/search-types";
import { DesktopNav } from "./desktop-nav";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";
import { MobileSearch } from "./search/mobile-search";
import { SearchBox } from "./search/search-box";

type Props = {
  main: NavItem[];
  secondary: NavItem[];
  popularCategories: SearchCategory[];
};

const iconButton =
  "grid size-tap place-items-center rounded-full text-white transition-colors hover:bg-brand-hover active:bg-brand-active";

export function HeaderBar({ main, secondary, popularCategories }: Props) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const { compact, scrollingDown } = useScrollState();

  // En móvil la barra de búsqueda completa solo aparece donde el usuario busca.
  const showSearchRow = pathname === "/" || pathname === "/productos";

  return (
    <>
      <header
        data-compact={compact}
        className="group/header sticky top-0 z-header"
      >
        <div className="relative z-20 bg-brand">
          <div className="container flex h-header items-center gap-2 transition-[height] duration-200 lg:h-18 lg:gap-8 lg:group-data-[compact=true]/header:h-14">
            <div className="flex flex-1 items-center lg:flex-none">
              <div className="-ml-2 lg:hidden">
                <MobileMenu main={main} secondary={secondary} onSearch={() => setSearchOpen(true)} />
              </div>
              <Logo className="hidden lg:flex lg:group-data-[compact=true]/header:h-9" />
            </div>

            <Logo className="lg:hidden" />

            <div className="hidden max-w-2xl flex-1 lg:block">
              <SearchBox variant="header" popularCategories={popularCategories} />
            </div>

            <div className="-mr-2 flex flex-1 items-center justify-end gap-1 lg:mr-0 lg:flex-none lg:gap-2">
              <button
                type="button"
                aria-label="Buscar"
                aria-haspopup="dialog"
                onClick={() => setSearchOpen(true)}
                className={`${iconButton} lg:hidden`}
              >
                <SearchIcon className="size-6" aria-hidden="true" />
              </button>
              <Link
                href="/cuenta"
                className="hidden h-tap items-center gap-2 rounded-pill px-3 font-medium text-white transition-colors hover:bg-brand-hover lg:inline-flex"
              >
                <UserIcon className="size-6" aria-hidden="true" />
                Cuenta
              </Link>
              <CartButton />
            </div>
          </div>
        </div>

        <div className="relative z-10 hidden border-b border-line bg-white lg:block">
          <div className="container">
            <DesktopNav items={main} />
          </div>
        </div>

        {showSearchRow && (
          <div
            data-hidden={scrollingDown}
            className="absolute inset-x-0 top-full bg-brand px-4 pb-3 transition-[translate,visibility] duration-200 data-[hidden=true]:invisible data-[hidden=true]:-translate-y-full lg:hidden"
          >
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-haspopup="dialog"
              className="flex h-11 w-full items-center gap-3 rounded-pill bg-white px-4 text-left text-muted-foreground"
            >
              <SearchIcon className="size-5" aria-hidden="true" />
              Buscar persianas, tapetes, líneas…
            </button>
          </div>
        )}
      </header>

      {/* Reserva el alto de la barra de búsqueda para que no tape el contenido al cargar. */}
      {showSearchRow && <div aria-hidden="true" className="h-14 bg-brand lg:hidden" />}

      <MobileSearch open={searchOpen} onOpenChange={setSearchOpen} popularCategories={popularCategories} />
      <CartSheet />
    </>
  );
}

// compact: el header de desktop se reduce después de 120px (y vuelve arriba de 8px,
// con margen para que no parpadee). scrollingDown: oculta la búsqueda móvil al bajar.
function useScrollState() {
  const [state, setState] = useState({ compact: false, scrollingDown: false });

  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;

    function update() {
      frame = 0;
      const y = window.scrollY;
      const delta = y - lastY;
      setState((current) => {
        const compact = y > 120 ? true : y < 8 ? false : current.compact;
        let scrollingDown = current.scrollingDown;
        if (y < 120) scrollingDown = false;
        else if (Math.abs(delta) > 8) scrollingDown = delta > 0;
        return compact === current.compact && scrollingDown === current.scrollingDown
          ? current
          : { compact, scrollingDown };
      });
      if (Math.abs(delta) > 8 || y < 120) lastY = y;
    }

    function onScroll() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return state;
}
