"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { CartButton } from "@/components/cart/cart-button";
import { CartSheet } from "@/components/cart/cart-sheet";
import { HeaderActionIcon } from "@/components/header/header-action-icon";
import { useWishlist } from "@/components/wishlist/use-wishlist";
import type { MenuProduct, NavItem } from "@/lib/navigation";
import type { SearchCategory } from "@/lib/search-types";
import type { HeaderActionSetting } from "@/lib/site-settings";
import { normalizeHeaderActions } from "@/lib/header-actions";
import { DesktopNav } from "./desktop-nav";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";
import { MobileSearch } from "./search/mobile-search";

type Props = {
  main: NavItem[];
  secondary: NavItem[];
  popularCategories: SearchCategory[];
  menuProducts: Record<string, MenuProduct[]>; // productos de cada línea para el mega menú
  supportPhone: string;
  supportEmail: string;
  logoUrl: string;
  headerActions: HeaderActionSetting[];
};

// Header blanco al estilo de terza.com: logo a color, menú con flechas, botón de búsqueda
// circular en lima claro y botones en píldora (verde oscuro y lima).
export function HeaderBar({ main, secondary, popularCategories, menuProducts, supportPhone, supportEmail, logoUrl, headerActions }: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const compact = useCompact();
  const wishlist = useWishlist();
  const actions = normalizeHeaderActions(headerActions);
  const actionControls = (action: HeaderActionSetting): ReactNode => {
    const icon = <HeaderActionIcon icon={action.icon} className="size-5 lg:size-[1.375rem]" />;
    if (action.key === "search") return <button type="button" onClick={() => setSearchOpen(true)} aria-label={action.label} title={action.label} aria-haspopup="dialog" className="grid size-11 place-items-center rounded-full bg-accent-light text-brand transition-colors hover:bg-accent lg:size-12">{icon}</button>;
    if (action.key === "favorites") return <Link href={action.href ?? "/favoritos"} aria-label={wishlist.count > 0 ? `${action.label}, ${wishlist.count}` : action.label} title={action.label} className="relative hidden size-12 place-items-center rounded-full border border-line text-brand transition-colors hover:bg-surface lg:grid">{icon}{wishlist.count > 0 && <span aria-hidden="true" className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[0.6875rem] leading-none font-bold text-white">{wishlist.count > 99 ? "99+" : wishlist.count}</span>}</Link>;
    if (action.key === "account") return <Link href={action.href ?? "/cuenta"} aria-label={action.label} title={action.label} className="hidden size-12 place-items-center rounded-full bg-brand text-white transition-colors hover:bg-brand-hover lg:grid">{icon}</Link>;
    return <CartButton icon={action.icon} label={action.label} />;
  };

  return (
    <>
      <header data-compact={compact} className="group/header sticky top-0 z-header border-b border-line bg-white">
        <div className="container flex h-16 items-center gap-3 transition-[height] duration-200 lg:h-22 lg:gap-8 lg:group-data-[compact=true]/header:h-[4.5rem]">
          <Logo tone="color" src={logoUrl} className="h-10 lg:h-12 lg:group-data-[compact=true]/header:h-10" />

          <div className="hidden h-full lg:block lg:flex-1">
            <DesktopNav items={main} products={menuProducts} />
          </div>

          <div className="ml-auto flex items-center gap-2 lg:gap-3">
            {actions.filter((action) => action.visible).map((action) => <span key={action.key}>{actionControls(action)}</span>)}

            {/* Celular y tablet: el menú va al final de los botones, después del carrito. */}
            <div className="-mr-2 lg:hidden">
            <MobileMenu main={main} secondary={secondary} supportPhone={supportPhone} supportEmail={supportEmail} logoUrl={logoUrl} headerActions={actions} onSearch={() => setSearchOpen(true)} />
            </div>
          </div>
        </div>
      </header>

      <MobileSearch open={searchOpen} onOpenChange={setSearchOpen} popularCategories={popularCategories} />
      <CartSheet />
    </>
  );
}

// compact: el header de desktop se reduce después de 120px (y vuelve arriba de 8px,
// con margen para que no parpadee).
function useCompact() {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    let frame = 0;

    function update() {
      frame = 0;
      const y = window.scrollY;
      setCompact((current) => (y > 120 ? true : y < 8 ? false : current));
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

  return compact;
}
