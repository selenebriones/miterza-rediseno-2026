"use client";

import { createContext, useContext, useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { catalogHref, type CatalogFilters, type CategoryNode } from "@/lib/catalog-params";
import { cn } from "@/lib/utils";

type CatalogContextValue = {
  // Filtros optimistas: cambian en cuanto el usuario toca un control, antes de que llegue la respuesta.
  filters: CatalogFilters;
  navigate: (changes: Partial<CatalogFilters>) => void;
  isPending: boolean;
  tree: CategoryNode[]; // árbol de categorías para filtros y chips
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({
  filters,
  tree,
  children,
}: {
  filters: CatalogFilters;
  tree: CategoryNode[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(filters);

  function navigate(changes: Partial<CatalogFilters>) {
    startTransition(() => {
      setOptimistic({ ...optimistic, page: 1, ...changes });
      router.push(catalogHref(optimistic, changes), { scroll: false });
    });
  }

  return (
    <CatalogContext.Provider value={{ filters: optimistic, navigate, isPending, tree }}>
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) throw new Error("useCatalog debe usarse dentro de <CatalogProvider>");
  return context;
}

// Atenúa los resultados mientras llega la nueva página, sin bloquear los filtros.
export function PendingRegion({ children, className }: { children: React.ReactNode; className?: string }) {
  const { isPending } = useCatalog();
  return (
    <div
      aria-busy={isPending}
      className={cn("transition-opacity duration-200", isPending && "pointer-events-none opacity-50", className)}
    >
      {children}
    </div>
  );
}
