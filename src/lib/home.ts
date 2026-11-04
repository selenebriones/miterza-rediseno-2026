// Contenido del home leído de la base: HomeSection (orden y ajustes de cada bloque),
// Banner HOME_HERO y Category con showInHome.

import { cacheLife, cacheTag } from "next/cache";
import { CACHE_TAGS, db } from "./db";

export type HomeSectionType =
  "HERO_BANNERS" | "VALUE_PROPOSITION" | "CATEGORY_CAROUSEL" | "FEATURED_PRODUCTS" | "PROMO_BANNERS" | "INSTALL_GUIDE";

export type ValuePropItem = { icon: string; title: string; text: string; showPhone?: boolean };

export type InstallTutorial = { title: string; lines: string; videoUrl: string; imageUrl: string };

// Ajustes de cada sección (HomeSection.settings). Se validan al leerlos: si el JSON del panel
// viene incompleto, la sección usa valores vacíos en lugar de romper la página.
export type HomeSection = {
  type: HomeSectionType;
  title: string | null;
  subtitle: string | null;
  eyebrow: string | null; // supratítulo sobre el título (HomeSection.settings.eyebrow)
  items: ValuePropItem[];
  tutorials: InstallTutorial[];
  limit: number;
};

export type HeroBanner = {
  id: string;
  title: string;
  subtitle: string | null;
  ctaLabel: string;
  ctaUrl: string;
  imageDesktop: string;
  imageMobile: string | null;
  imageAlt: string;
  theme: "light" | "dark";
};

export type HomeCategory = {
  slug: string;
  name: string;
  href: string;
  imageUrl: string;
  imageAlt: string;
  productCount: number; // productos activos (la categoría padre incluye los de sus líneas)
};

const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

export async function getHomeSections(): Promise<HomeSection[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.content);

  const rows = await db.homeSection.findMany({ where: { isActive: true }, orderBy: { position: "asc" } });
  return rows.map((row) => {
    const settings = (row.settings ?? {}) as Record<string, unknown>;
    return {
      type: row.type,
      title: row.title,
      subtitle: row.subtitle,
      eyebrow: typeof settings.eyebrow === "string" && settings.eyebrow.trim() ? settings.eyebrow.trim() : null,
      items: asArray<ValuePropItem>(settings.items),
      tutorials: asArray<InstallTutorial>(settings.tutorials),
      limit: typeof settings.limit === "number" ? settings.limit : 12,
    };
  });
}

// Banners HOME_HERO activos y vigentes, en orden.
export async function getHeroBanners(): Promise<HeroBanner[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.content);

  const now = new Date();
  const rows = await db.banner.findMany({
    where: {
      placement: "HOME_HERO",
      isActive: true,
      imageDesktop: { not: null },
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: { position: "asc" },
  });
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    ctaLabel: row.ctaLabel ?? "Ver más",
    ctaUrl: row.ctaUrl ?? "/productos",
    imageDesktop: row.imageDesktop!,
    imageMobile: row.imageMobile,
    imageAlt: row.imageAlt ?? "",
    theme: row.theme === "dark" ? "dark" : "light",
  }));
}

// Categorías con showInHome e imagen: primero las principales, luego las líneas.
export async function getHomeCategories(): Promise<HomeCategory[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalog);

  const rows = await db.category.findMany({
    where: { showInHome: true, isVisible: true, imageUrl: { not: null } },
    select: {
      slug: true,
      name: true,
      imageUrl: true,
      imageAlt: true,
      position: true,
      parent: { select: { name: true, position: true } },
      _count: { select: { products: { where: { status: "ACTIVE" } } } },
    },
  });
  return rows
    .sort(
      (a, b) =>
        Number(Boolean(a.parent)) - Number(Boolean(b.parent)) ||
        (a.parent?.position ?? 0) - (b.parent?.position ?? 0) ||
        a.position - b.position,
    )
    .map((row) => ({
      slug: row.slug,
      // Las subcategorías ya traen su nombre completo ("Pisos vinílicos"), sin anteponer la sección.
      name: row.name,
      href: `/productos?categoria=${row.slug}`,
      imageUrl: row.imageUrl!,
      imageAlt: row.imageAlt ?? "",
      productCount: row._count.products,
    }));
}
