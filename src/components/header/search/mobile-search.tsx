"use client";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import type { SearchCategory } from "@/lib/search-types";
import { SearchBox } from "./search-box";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  popularCategories: SearchCategory[];
};

// Capa de búsqueda que baja desde arriba: a pantalla completa en móvil y como un panel
// centrado en desktop. Radix atrapa el foco y cierra con Esc.
export function MobileSearch({ open, onOpenChange, popularCategories }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="top"
        showCloseButton={false}
        className="gap-0 border-0 bg-white px-4 pt-3 pb-0 data-[side=top]:h-dvh lg:rounded-b-card lg:px-0 lg:pt-10 lg:pb-8 lg:shadow-card-hover lg:data-[side=top]:h-auto lg:data-[side=top]:max-h-[85dvh]"
      >
        <SheetTitle className="sr-only">Buscar productos</SheetTitle>
        <div className="flex min-h-0 flex-1 flex-col lg:mx-auto lg:w-full lg:max-w-2xl lg:px-4">
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
