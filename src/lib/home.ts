// Contenido del home leído de la base: HomeSection (orden y ajustes de cada bloque),
// Banner HOME_HERO y HOME_PROMO, y Category con showInHome.

import { cacheLife, cacheTag } from "next/cache";
import { CACHE_TAGS, db } from "./db";

export type HomeSectionType =
  "HERO_BANNERS" | "VALUE_PROPOSITION" | "CATEGORY_CAROUSEL" | "FEATURED_PRODUCTS" | "PROMO_BANNERS" | "INSTALL_GUIDE";

export type ValuePropItem = { icon: string; title: string; text: string; showPhone?: boolean };

// Banda de ayuda (sección INSTALL_GUIDE): guía de instalación a la izquierda y preguntas frecuentes a la
// derecha. La guía usa el título, subtítulo y supratítulo de la sección; lo demás vive en settings.
export type HelpBand = {
  guide: {
    eyebrow: string | null;
    title: string;
    text: string | null;
    imageUrl: string;
    imageAlt: string;
    tutorials: { title: string; lines: string; videoUrl: string }[]; // videos de YouTube
  };
  faq: {
    eyebrow: string | null;
    title: string;
    highlight: string | null; // remate del título en lima ("dudas.")
    text: string | null;
    ctaLabel: string;
    ctaUrl: string;
    imageUrl: string;
    imageAlt: string;
  };
};

// Ajustes de cada sección (HomeSection.settings). Se validan al leerlos: si el JSON del panel
// viene incompleto, la sección usa valores vacíos en lugar de romper la página.
export type HomeSection = {
  type: HomeSectionType;
  title: string | null;
  subtitle: string | null;
  eyebrow: string | null; // supratítulo sobre el título (HomeSection.settings.eyebrow)
  items: ValuePropItem[];
  help: HelpBand | null;
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

// Banner de "Nuestras promociones". El descuento no se captura: se calcula con las ofertas reales del
// destino del enlace (un producto o una categoría) para no anunciar un ahorro que no existe.
export type PromoBanner = {
  id: string;
  title: string; // etiqueta sobre la foto ("Pisos de madera")
  href: string;
  imageUrl: string;
  imageAlt: string;
  discount: number | null; // % de ahorro; null si el destino no tiene ofertas
  upTo: boolean; // categoría: "Hasta N %"; producto: "N %"
};

const text = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);

// Sin foto o sin título de cada columna la banda no se muestra (no rompe el home).
function toHelpBand(title: string | null, subtitle: string | null, settings: Record<string, unknown>): HelpBand | null {
  const faq = (settings.faq ?? {}) as Record<string, unknown>;
  const guideImage = text(settings.imageUrl);
  const faqImage = text(faq.imageUrl);
  const faqTitle = text(faq.title);
  if (!title || !guideImage || !faqImage || !faqTitle) return null;
  return {
    guide: {
      eyebrow: text(settings.eyebrow),
      title,
      text: subtitle,
      imageUrl: guideImage,
      imageAlt: text(settings.imageAlt) ?? "",
      tutorials: asArray<{ title: string; lines: string; videoUrl: string }>(settings.tutorials).filter(
        (t) => text(t?.title) && text(t?.videoUrl),
      ),
    },
    faq: {
      eyebrow: text(faq.eyebrow),
      title: faqTitle,
      highlight: text(faq.highlight),
      text: text(faq.text),
      ctaLabel: text(faq.ctaLabel) ?? "Ver preguntas frecuentes",
      ctaUrl: text(faq.ctaUrl) ?? "/preguntas-frecuentes",
      imageUrl: faqImage,
      imageAlt: text(faq.imageAlt) ?? "",
    },
  };
}

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
      help: row.type === "INSTALL_GUIDE" ? toHelpBand(row.title, row.subtitle, settings) : null,
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

// Categorías con showInHome e imagen, en el orden del menú: por sección y, dentro, por posición.
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
        (a.parent?.position ?? a.position) - (b.parent?.position ?? b.position) ||
        Number(Boolean(a.parent)) - Number(Boolean(b.parent)) ||
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

const percentOff = (price: unknown, compareAt: unknown) => Math.round((1 - Number(price) / Number(compareAt)) * 100);

// Mayor descuento vigente del destino: /productos/<slug> (producto) o /productos?categoria=<slug>.
async function discountFor(href: string): Promise<{ discount: number | null; upTo: boolean }> {
  const url = new URL(href, "https://miterza.local");
  const productSlug = url.pathname.match(/^\/productos\/([^/]+)$/)?.[1];
  if (productSlug) {
    const p = await db.product.findUnique({
      where: { slug: productSlug, status: "ACTIVE" },
      select: { price: true, compareAtPrice: true },
    });
    const off =
      p?.compareAtPrice && Number(p.compareAtPrice) > Number(p.price) ? percentOff(p.price, p.compareAtPrice) : 0;
    return { discount: off > 0 ? off : null, upTo: false };
  }
  const category = url.searchParams.get("categoria");
  const offers = await db.product.findMany({
    where: {
      status: "ACTIVE",
      compareAtPrice: { gt: db.product.fields.price },
      ...(category ? { categories: { some: { slug: { in: category.split(",") } } } } : {}),
    },
    select: { price: true, compareAtPrice: true },
  });
  const best = Math.max(0, ...offers.map((o) => percentOff(o.price, o.compareAtPrice)));
  return { discount: best > 0 ? best : null, upTo: true };
}

// Banners HOME_PROMO activos y vigentes, en orden, con su descuento calculado.
export async function getPromoBanners(): Promise<PromoBanner[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.content, CACHE_TAGS.catalog);

  const now = new Date();
  const rows = await db.banner.findMany({
    where: {
      placement: "HOME_PROMO",
      isActive: true,
      imageDesktop: { not: null },
      ctaUrl: { not: null },
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: { position: "asc" },
  });
  return Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      title: row.title,
      href: row.ctaUrl!,
      imageUrl: row.imageDesktop!,
      imageAlt: row.imageAlt ?? "",
      ...(await discountFor(row.ctaUrl!)),
    })),
  );
}
