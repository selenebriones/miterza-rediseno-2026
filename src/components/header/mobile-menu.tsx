"use client";

import Link from "next/link";
import { useRef } from "react";
import { ChevronRightIcon, HeartIcon, MailIcon, MenuIcon, PhoneIcon, SearchIcon, UserIcon } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { NavItem } from "@/lib/navigation";
import { storeConfig } from "@/lib/store-config";
import { cn, externalLinkProps } from "@/lib/utils";
import { Logo } from "./logo";

type Props = {
  main: NavItem[];
  secondary: NavItem[];
  onSearch: () => void;
};

const rowClass =
  "flex min-h-tap items-center justify-between gap-3 rounded-lg px-3 text-base font-medium text-heading hover:bg-surface active:bg-brand-50";

export function MobileMenu({ main, secondary, onSearch }: Props) {
  // Al pasar del menú a la búsqueda, el foco no debe regresar al botón del menú.
  const openingSearch = useRef(false);

  return (
    <Sheet>
      <SheetTrigger
        aria-label="Abrir menú"
        className="grid size-tap place-items-center rounded-full text-brand transition-colors hover:bg-surface active:bg-brand-50"
      >
        <MenuIcon className="size-6" aria-hidden="true" />
      </SheetTrigger>

      <SheetContent
        // Abre del lado derecho, donde está el botón.
        side="right"
        className="w-[85%] gap-0 bg-white p-0 data-[side=right]:sm:max-w-sm"
        onCloseAutoFocus={(event) => {
          if (!openingSearch.current) return;
          event.preventDefault();
          openingSearch.current = false;
        }}
      >
        <div className="flex h-header shrink-0 items-center border-b border-line px-4">
          <SheetClose asChild>
            <Logo tone="color" />
          </SheetClose>
        </div>
        <SheetTitle className="sr-only">Menú</SheetTitle>
        <SheetDescription className="sr-only">Categorías, información y cuenta</SheetDescription>

        <div className="flex-1 overflow-y-auto px-2 py-3">
          <SheetClose asChild>
            <button
              type="button"
              onClick={() => {
                openingSearch.current = true;
                onSearch();
              }}
              className="mx-1 mb-3 flex h-11 w-[calc(100%-0.5rem)] items-center gap-3 rounded-pill bg-surface px-4 text-left text-muted-foreground"
            >
              <SearchIcon className="size-5" aria-hidden="true" />
              Buscar productos
            </button>
          </SheetClose>

          <nav aria-label="Categorías">
            <Accordion type="single" collapsible>
              {main.map((item) =>
                item.children?.length ? (
                  <AccordionItem key={item.id} value={item.id} className="border-0">
                    <AccordionTrigger className="min-h-tap items-center rounded-lg px-3 py-0 text-base font-medium text-heading hover:bg-surface hover:no-underline">
                      {item.label}
                    </AccordionTrigger>
                    <AccordionContent className="pb-2 [&_a]:no-underline">
                      <ul className="ml-3 border-l-2 border-surface pl-2">
                        <li>
                          <SheetClose asChild>
                            <Link href={item.href} className={cn(rowClass, "font-semibold text-brand")}>
                              Ver todo en {item.label}
                              <ChevronRightIcon className="size-4" aria-hidden="true" />
                            </Link>
                          </SheetClose>
                        </li>
                        {item.children.map((child) => (
                          <li key={child.id}>
                            <SheetClose asChild>
                              <Link href={child.href} className={cn(rowClass, "font-normal")}>
                                {child.label}
                              </Link>
                            </SheetClose>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ) : (
                  <SheetClose asChild key={item.id}>
                    <Link href={item.href} {...externalLinkProps(item.href)} className={rowClass}>
                      {item.isHighlight ? (
                        <span className="rounded-pill bg-accent px-3 py-1 text-brand">{item.label}</span>
                      ) : (
                        item.label
                      )}
                    </Link>
                  </SheetClose>
                ),
              )}
            </Accordion>
          </nav>

          <hr className="mx-3 my-3 border-line" />

          <nav aria-label="Información">
            {secondary.map((item) => (
              <SheetClose asChild key={item.id}>
                <Link href={item.href} {...externalLinkProps(item.href)} className={cn(rowClass, "font-normal")}>
                  {item.label}
                </Link>
              </SheetClose>
            ))}
            <SheetClose asChild>
              <Link href="/cuenta" className={cn(rowClass, "justify-start font-normal")}>
                <UserIcon className="size-5 text-brand" aria-hidden="true" />
                Mi cuenta
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link href="/favoritos" className={cn(rowClass, "justify-start font-normal")}>
                <HeartIcon className="size-5 text-brand" aria-hidden="true" />
                Favoritos
              </Link>
            </SheetClose>
          </nav>
        </div>

        <div className="shrink-0 bg-surface px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <p className="text-sm font-semibold text-heading">¿Necesitas ayuda?</p>
          <a href={storeConfig.supportPhoneHref} className="flex min-h-tap items-center gap-2 text-brand">
            <PhoneIcon className="size-4" aria-hidden="true" />
            {storeConfig.supportPhone}
          </a>
          <a href={`mailto:${storeConfig.supportEmail}`} className="-mt-2 flex min-h-tap items-center gap-2 text-brand">
            <MailIcon className="size-4" aria-hidden="true" />
            {storeConfig.supportEmail}
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}
