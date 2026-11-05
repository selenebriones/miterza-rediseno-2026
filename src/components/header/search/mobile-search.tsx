"use client";

import { Dialog } from "radix-ui";
import { XIcon } from "lucide-react";
import type { SearchCategory } from "@/lib/search-types";
import { SearchBox } from "./search-box";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  popularCategories: SearchCategory[];
};

// Capa de búsqueda a pantalla completa en verde oscuro translúcido (igual que terza-sitio),
// en móvil y en desktop. Radix atrapa el foco, bloquea el scroll y cierra con Esc.
export function MobileSearch({ open, onOpenChange, popularCategories }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-drawer overflow-y-auto bg-brand-dark/95 px-6 pt-24 pb-16 backdrop-blur-md duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 md:pt-[14vh]"
          onEscapeKeyDown={(event) => {
            // Con texto en el campo, Esc solo lo borra (SearchBox); el siguiente Esc cierra.
            const field = document.activeElement;
            if (field instanceof HTMLInputElement && field.type === "search" && field.value) event.preventDefault();
          }}
          onPointerDown={(event) => {
            // Clic en el fondo (fuera del contenido) cierra, como en terza-sitio.
            if (event.target === event.currentTarget) onOpenChange(false);
          }}
        >
          <Dialog.Title className="sr-only">Buscar productos</Dialog.Title>
          <Dialog.Close
            aria-label="Cerrar buscador"
            className="absolute top-4 right-4 grid size-11 place-items-center rounded-full border-2 border-white text-white transition-colors hover:bg-white hover:text-brand md:top-8 md:right-8"
          >
            <XIcon className="size-4" strokeWidth={2.5} aria-hidden="true" />
          </Dialog.Close>
          <div className="mx-auto w-full max-w-3xl">
            <SearchBox popularCategories={popularCategories} onNavigate={() => onOpenChange(false)} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
