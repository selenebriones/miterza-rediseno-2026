"use client";

import Link from "next/link";
import { useRef } from "react";
import { ChevronRightIcon, MailIcon, MenuIcon, PhoneIcon } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { NavItem } from "@/lib/navigation";
import type { HeaderActionSetting } from "@/lib/site-settings";
import { normalizeHeaderActions } from "@/lib/header-actions";
import { HeaderActionIcon } from "@/components/header/header-action-icon";
import { cn, externalLinkProps } from "@/lib/utils";
import { Logo } from "./logo";

type Props = {
  main: NavItem[];
  secondary: NavItem[];
  supportPhone: string;
  supportEmail: string;
  logoUrl: string;
  headerActions: HeaderActionSetting[];
  onSearch: () => void;
};

const rowClass =
  "flex min-h-tap items-center justify-between gap-3 rounded-lg px-3 text-base font-medium text-heading hover:bg-surface active:bg-brand-50";

export function MobileMenu({ main, secondary, supportPhone, supportEmail, logoUrl, headerActions, onSearch }: Props) {
  // Al pasar del menú a la búsqueda, el foco no debe regresar al botón del menú.
  const openingSearch = useRef(false);
  const actions = normalizeHeaderActions(headerActions);
  const getAction = (key: HeaderActionSetting["key"]) => actions.find((action) => action.key === key)!;
  const isActionVisible = (key: HeaderActionSetting["key"]) => getAction(key).visible;

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
              <Logo tone="color" src={logoUrl} />
          </SheetClose>
        </div>
        <SheetTitle className="sr-only">Menú</SheetTitle>
        <SheetDescription className="sr-only">Categorías, información y cuenta</SheetDescription>

        <div className="flex-1 overflow-y-auto px-2 py-3">
          {isActionVisible("search") && <SheetClose asChild>
            <button
              type="button"
              aria-label={getAction("search").label}
              onClick={() => {
                openingSearch.current = true;
                onSearch();
              }}
              className="mx-1 mb-3 flex h-11 w-[calc(100%-0.5rem)] items-center gap-3 rounded-pill bg-surface px-4 text-left text-muted-foreground"
            >
              <HeaderActionIcon icon={getAction("search").icon} className="size-5" />
              {getAction("search").label}
            </button>
          </SheetClose>}

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
                            <Link href={item.href} target={item.openInNewTab ? "_blank" : undefined} rel={item.openInNewTab ? "noopener noreferrer" : undefined} className={cn(rowClass, "font-semibold text-brand")}>
                              Ver todo en {item.label}
                              <ChevronRightIcon className="size-4" aria-hidden="true" />
                            </Link>
                          </SheetClose>
                        </li>
                        {item.children.map((child) => (
                          <li key={child.id}>
                            <SheetClose asChild>
                              <Link href={child.href} target={child.openInNewTab ? "_blank" : undefined} rel={child.openInNewTab ? "noopener noreferrer" : undefined} className={cn(rowClass, "font-normal")}>
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
                    <Link href={item.href} {...(item.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : externalLinkProps(item.href))} className={rowClass}>
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
                <Link href={item.href} {...(item.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : externalLinkProps(item.href))} className={cn(rowClass, "font-normal")}>
                  {item.label}
                </Link>
              </SheetClose>
            ))}
            {isActionVisible("account") && <SheetClose asChild>
              <Link href={getAction("account").href ?? "/cuenta"} aria-label={getAction("account").label} className={cn(rowClass, "justify-start font-normal")}>
                <HeaderActionIcon icon={getAction("account").icon} className="size-5 text-brand" />
                {getAction("account").label}
              </Link>
            </SheetClose>}
            {isActionVisible("favorites") && <SheetClose asChild>
              <Link href={getAction("favorites").href ?? "/favoritos"} aria-label={getAction("favorites").label} className={cn(rowClass, "justify-start font-normal")}>
                <HeaderActionIcon icon={getAction("favorites").icon} className="size-5 text-brand" />
                {getAction("favorites").label}
              </Link>
            </SheetClose>}
          </nav>
        </div>

        <div className="shrink-0 bg-surface px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <p className="text-sm font-semibold text-heading">¿Necesitas ayuda?</p>
          <a href={`tel:${supportPhone.replace(/[^+\d]/g, "")}`} className="flex min-h-tap items-center gap-2 text-brand">
            <PhoneIcon className="size-4" aria-hidden="true" />
            {supportPhone}
          </a>
          <a href={`mailto:${supportEmail}`} className="-mt-2 flex min-h-tap items-center gap-2 text-brand">
            <MailIcon className="size-4" aria-hidden="true" />
            {supportEmail}
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}
