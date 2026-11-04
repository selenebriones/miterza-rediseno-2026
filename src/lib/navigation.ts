// Menús (Menu/MenuItem) y barra de aviso (Banner ANNOUNCEMENT), leídos de la base.

import { cacheLife, cacheTag } from "next/cache";
import type { MenuLocation, Prisma } from "@/generated/prisma/client";
import { CACHE_TAGS, db } from "./db";
import { productSummarySelect, toSummary } from "./products";

export type NavItem = {
  id: string;
  label: string;
  href: string;
  description?: string;
  categorySlug?: string; // si el elemento apunta a una categoría: sirve para buscar sus productos
  isHighlight?: boolean;
  children?: NavItem[];
};

// Producto que se muestra en las tarjetas del mega menú.
export type MenuProduct = {
  slug: string;
  name: string;
  price: number;
  hasPriceRange: boolean;
  imageUrl: string | null;
  imageAlt: string;
  areaPerBox: number | null; // pisos: el precio es por caja
};

export type Announcement = {
  id: string;
  title: string;
  ctaLabel?: string;
  ctaUrl?: string;
};

const itemSelect = {
  id: true,
  label: true,
  linkType: true,
  url: true,
  isHighlight: true,
  category: { select: { slug: true, description: true } },
  page: { select: { slug: true, type: true } },
} satisfies Prisma.MenuItemSelect;

type ItemRow = Prisma.MenuItemGetPayload<{ select: typeof itemSelect }> & { children?: ItemRow[] };

function hrefOf(item: ItemRow) {
  if (item.linkType === "CATEGORY" && item.category) return `/productos?categoria=${item.category.slug}`;
  if (item.linkType === "PAGE" && item.page) {
    return item.page.type === "POLICY" ? `/politicas/${item.page.slug}` : `/${item.page.slug}`;
  }
  return item.url ?? "#";
}

function toNavItem(item: ItemRow): NavItem {
  return {
    id: item.id,
    label: item.label,
    href: hrefOf(item),
    description: item.category?.description ?? undefined,
    categorySlug: item.category?.slug,
    isHighlight: item.isHighlight,
    children: item.children?.length ? item.children.map(toNavItem) : undefined,
  };
}

// Dos niveles: elementos raíz y sus hijos, visibles y ordenados.
async function getMenu(location: MenuLocation) {
  const menu = await db.menu.findUnique({
    where: { location },
    select: {
      name: true,
      items: {
        where: { parentId: null, isVisible: true },
        orderBy: { position: "asc" },
        select: {
          ...itemSelect,
          children: { where: { isVisible: true }, orderBy: { position: "asc" }, select: itemSelect },
        },
      },
    },
  });
  return { name: menu?.name ?? "", items: (menu?.items ?? []).map(toNavItem) };
}

export async function getHeaderNavigation() {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.content);

  const [main, top] = await Promise.all([getMenu("HEADER_MAIN"), getMenu("HEADER_TOP")]);
  return { main: main.items, top: top.items };
}

// FOOTER: cada elemento raíz es una columna con sus enlaces. FOOTER_LEGAL: una columna más.
export async function getFooterNavigation() {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.content);

  const [footer, legal] = await Promise.all([getMenu("FOOTER"), getMenu("FOOTER_LEGAL")]);
  const groups = footer.items.map((group) => ({ id: group.id, title: group.label, items: group.children ?? [] }));
  if (legal.items.length) groups.push({ id: "legal", title: legal.name || "Legales", items: legal.items });
  return groups;
}

// Banner ANNOUNCEMENT activo y vigente con menor `position`; null si no hay.
export async function getAnnouncement(): Promise<Announcement | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.content);

  const now = new Date();
  const banner = await db.banner.findFirst({
    where: {
      placement: "ANNOUNCEMENT",
      isActive: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: { position: "asc" },
    select: { id: true, title: true, ctaLabel: true, ctaUrl: true },
  });
  return banner
    ? { id: banner.id, title: banner.title, ctaLabel: banner.ctaLabel ?? undefined, ctaUrl: banner.ctaUrl ?? undefined }
    : null;
}

// Hasta 4 productos por categoría o línea para las tarjetas del mega menú: destacados primero,
// luego los más recientes.
export async function getMenuProducts(slugs: string[]): Promise<Record<string, MenuProduct[]>> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalog);

  const entries = await Promise.all(
    [...new Set(slugs)].map(async (slug) => {
      const rows = await db.product.findMany({
        where: { status: "ACTIVE", categories: { some: { slug } } },
        orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
        take: 4,
        select: productSummarySelect,
      });
      const products = rows.map((row) => {
        const p = toSummary(row);
        return {
          slug: p.slug,
          name: p.name,
          price: p.price,
          hasPriceRange: p.hasPriceRange,
          imageUrl: p.imageUrl,
          imageAlt: p.imageAlt,
          areaPerBox: p.areaPerBox,
        };
      });
      return [slug, products] as const;
    }),
  );
  return Object.fromEntries(entries);
}
