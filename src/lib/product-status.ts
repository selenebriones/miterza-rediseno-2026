// Estados de producto: etiqueta, color y slug para la URL. Mismo patrón que order-status.ts.

import type { ProductStatus } from "@/generated/prisma/enums";

export const PRODUCT_STATUSES: ProductStatus[] = ["DRAFT", "ACTIVE", "ARCHIVED"];

// `tone`: color de la etiqueta en el panel (clase .insignia de admin.css).
export const PRODUCT_STATUS_META: Record<
  ProductStatus,
  { label: string; slug: string; badge: string; tone: "aviso" | "exito" | "gris" }
> = {
  DRAFT: { label: "Borrador", slug: "borradores", badge: "bg-amber-50 text-amber-800 ring-amber-200", tone: "aviso" },
  ACTIVE: { label: "Activo", slug: "activos", badge: "bg-emerald-50 text-emerald-800 ring-emerald-200", tone: "exito" },
  ARCHIVED: { label: "Archivado", slug: "archivados", badge: "bg-zinc-100 text-zinc-700 ring-zinc-200", tone: "gris" },
};

export function productStatusFromSlug(slug: string | undefined): ProductStatus | null {
  return PRODUCT_STATUSES.find((s) => PRODUCT_STATUS_META[s].slug === slug) ?? null;
}
