"use client";

import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import type { NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

// Subrayado accent que crece desde la izquierda al pasar el cursor o al abrir el panel.
const itemClass = cn(
  "relative h-12 rounded-none bg-transparent px-3 text-[0.9375rem] font-medium text-heading",
  "hover:bg-transparent hover:text-brand focus:bg-transparent data-open:bg-transparent data-open:text-brand data-open:hover:bg-transparent",
  "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-accent after:transition-transform after:duration-150",
  "hover:after:scale-x-100 data-open:after:scale-x-100",
);

export function DesktopNav({ items }: { items: NavItem[] }) {
  return (
    <NavigationMenu delayDuration={150} aria-label="Categorías" className="max-w-none justify-start">
      <NavigationMenuList className="-ml-3 gap-1">
        {items.map((item) =>
          item.children?.length ? (
            <NavigationMenuItem key={item.id}>
              <NavigationMenuTrigger className={itemClass}>{item.label}</NavigationMenuTrigger>
              <NavigationMenuContent className="p-0">
                <div className="flex w-[680px] gap-6 p-6">
                  <div className="flex w-52 shrink-0 flex-col rounded-card bg-surface p-5">
                    <p className="text-xl font-bold text-heading">{item.label}</p>
                    {item.description && <p className="mt-2 text-sm">{item.description}</p>}
                    <NavigationMenuLink asChild>
                      <Link
                        href={item.href}
                        className="mt-auto inline-flex w-fit items-center gap-2 rounded-pill bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent hover:text-brand focus:bg-brand focus:text-white"
                      >
                        Ver todo
                        <ArrowRightIcon className="size-4" aria-hidden="true" />
                      </Link>
                    </NavigationMenuLink>
                  </div>
                  <div className="flex-1">
                    <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Líneas</p>
                    <ul className="grid grid-cols-2 gap-1">
                      {item.children.map((child) => (
                        <li key={child.id}>
                          <NavigationMenuLink asChild>
                            <Link
                              href={child.href}
                              className="group/line flex min-h-tap items-center justify-between rounded-lg px-3 text-base font-medium text-heading hover:bg-surface hover:text-brand focus:bg-surface"
                            >
                              {child.label}
                              <ArrowRightIcon
                                className="size-4 -translate-x-1 text-brand opacity-0 transition group-hover/line:translate-x-0 group-hover/line:opacity-100"
                                aria-hidden="true"
                              />
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          ) : (
            <NavigationMenuItem key={item.id}>
              <NavigationMenuLink asChild>
                <Link
                  href={item.href}
                  className={cn(
                    item.isHighlight
                      ? "mx-2 inline-flex h-8 items-center rounded-pill bg-accent px-4 text-sm font-semibold text-brand transition-colors hover:bg-accent-hover focus:bg-accent-hover"
                      : cn(itemClass, "inline-flex items-center"),
                  )}
                >
                  {item.label}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          ),
        )}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
