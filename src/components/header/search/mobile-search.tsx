"use client";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import type { SearchCategory } from "@/lib/search-types";
import { SearchBox } from "./search-box";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  popularCategories: SearchCategory[];
};

// Capa de búsqueda a pantalla completa para móvil. Radix atrapa el foco y cierra con Esc.
export function MobileSearch({ open, onOpenChange, popularCategories }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="top"
        showCloseButton={false}
        className="gap-0 data-[side=top]:h-dvh border-0 bg-white px-4 pt-3 pb-0 lg:hidden"
      >
        <SheetTitle className="sr-only">Buscar productos</SheetTitle>
        <SearchBox
          variant="overlay"
          autoFocus
          popularCategories={popularCategories}
          onNavigate={() => onOpenChange(false)}
          trailing={
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-tap shrink-0 px-2 font-medium text-brand"
            >
              Cancelar
            </button>
          }
        />
      </SheetContent>
    </Sheet>
  );
}
