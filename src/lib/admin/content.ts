import "server-only";

import { db } from "@/lib/db";

export function listHomeSections() {
  return db.homeSection.findMany({ orderBy: [{ position: "asc" }, { type: "asc" }] });
}

export function listBanners() {
  return db.banner.findMany({ orderBy: [{ placement: "asc" }, { position: "asc" }, { createdAt: "asc" }] });
}

export function listSiteMenus() {
  return db.menu.findMany({
    orderBy: { location: "asc" },
    select: {
      id: true,
      name: true,
      location: true,
      items: {
        where: { parentId: null },
        orderBy: { position: "asc" },
        select: {
          id: true, label: true, url: true, linkType: true, categoryId: true, pageId: true, isVisible: true, isHighlight: true, openInNewTab: true,
          category: { select: { slug: true } },
          page: { select: { slug: true, type: true } },
          children: { orderBy: { position: "asc" }, select: { id: true, label: true, url: true, linkType: true, categoryId: true, pageId: true, isVisible: true, isHighlight: true, openInNewTab: true, category: { select: { slug: true } }, page: { select: { slug: true, type: true } } } },
        },
      },
    },
  });
}

export function listEditablePages() {
  return db.page.findMany({
    where: { type: "POLICY" },
    orderBy: [{ title: "asc" }],
    select: { id: true, slug: true, title: true, seoTitle: true, seoDescription: true, isPublished: true, updatedAt: true },
  });
}

export function getEditablePage(id: string) {
  return db.page.findFirst({
    where: { id, type: "POLICY" },
    select: { id: true, slug: true, title: true, content: true, seoTitle: true, seoDescription: true, isPublished: true, updatedAt: true },
  });
}

export async function listHomeCategoryChoices() {
  const rows = await db.category.findMany({
    where: { isVisible: true, imageUrl: { not: null } },
    select: {
      id: true,
      slug: true,
      name: true,
      imageUrl: true,
      imageAlt: true,
      showInHome: true,
      position: true,
      parent: { select: { name: true, position: true } },
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
      value: row.slug,
      label: row.parent ? `${row.parent.name} / ${row.name}` : row.name,
      imageUrl: row.imageUrl!,
      imageAlt: row.imageAlt ?? row.name,
      href: `/productos?categoria=${row.slug}`,
      editHref: `/admin/categorias/${row.id}`,
      selectedByDefault: row.showInHome,
    }));
}

export async function listHomeProductChoices() {
  const rows = await db.product.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      isFeatured: true,
      images: { take: 1, orderBy: { position: "asc" }, select: { url: true } },
    },
  });
  return rows.map((row) => ({
    value: row.slug,
    label: row.name,
    imageUrl: row.images[0]?.url ?? null,
    meta: row.isFeatured ? "Destacado" : null,
    editHref: `/admin/productos/${row.id}`,
  }));
}

export type HomeSectionRow = Awaited<ReturnType<typeof listHomeSections>>[number];
export type BannerRow = Awaited<ReturnType<typeof listBanners>>[number];
