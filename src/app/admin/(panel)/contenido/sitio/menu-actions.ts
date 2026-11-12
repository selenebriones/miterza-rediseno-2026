"use server";

import { updateTag } from "next/cache";
import { authorize } from "@/lib/admin/session";
import { CACHE_TAGS, db } from "@/lib/db";

type MenuItemInput = { label: string; href: string; isVisible: boolean; isHighlight: boolean; openInNewTab: boolean; children: MenuItemInput[] };
type MenuInput = { location: "HEADER_MAIN" | "HEADER_TOP" | "FOOTER" | "FOOTER_LEGAL"; name: string; items: MenuItemInput[] };
const LOCATIONS = ["HEADER_MAIN", "HEADER_TOP", "FOOTER", "FOOTER_LEGAL"] as const;

function validHref(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "mailto:" || url.protocol === "tel:"; } catch { return false; }
}

function parseMenus(raw: string): MenuInput[] | null {
  if (!raw || raw.length > 100_000) return null;
  try {
    const input: unknown = JSON.parse(raw);
    if (!Array.isArray(input) || input.length < 1 || input.length > LOCATIONS.length) return null;
    const seen = new Set<string>();
    const parseItem = (item: unknown, depth: number): MenuItemInput | null => {
      if (!item || typeof item !== "object" || depth > 1) return null;
      const row = item as Record<string, unknown>;
      if (typeof row.label !== "string" || !row.label.trim() || row.label.length > 80 || typeof row.href !== "string" || row.href.length > 500 || !validHref(row.href) || typeof row.isVisible !== "boolean" || typeof row.isHighlight !== "boolean" || typeof row.openInNewTab !== "boolean" || !Array.isArray(row.children) || row.children.length > 50) return null;
      const children = row.children.map((child) => parseItem(child, depth + 1));
      if (children.some((child) => child === null)) return null;
      return { label: row.label.trim(), href: row.href.trim(), isVisible: row.isVisible, isHighlight: row.isHighlight, openInNewTab: row.openInNewTab, children: children as MenuItemInput[] };
    };
    const menus: MenuInput[] = [];
    for (const rawMenu of input) {
      if (!rawMenu || typeof rawMenu !== "object") return null;
      const menu = rawMenu as Record<string, unknown>;
      if (typeof menu.location !== "string" || !LOCATIONS.includes(menu.location as typeof LOCATIONS[number]) || seen.has(menu.location) || typeof menu.name !== "string" || !menu.name.trim() || menu.name.length > 80 || !Array.isArray(menu.items) || menu.items.length > 30) return null;
      seen.add(menu.location);
      const items = menu.items.map((item) => parseItem(item, 0));
      if (items.some((item) => item === null)) return null;
      menus.push({ location: menu.location as MenuInput["location"], name: menu.name.trim(), items: items as MenuItemInput[] });
    }
    return seen.size === menus.length ? menus : null;
  } catch { return null; }
}

export async function saveSiteMenus(_previous: { error?: string; saved?: string }, formData: FormData) {
  if (!(await authorize("MANAGE_CONTENT"))) return { error: "No tienes permiso para editar contenido." };
  const menus = parseMenus(String(formData.get("menusJson") ?? ""));
  if (!menus) return { error: "Revisa los menús: cada elemento necesita texto y un enlace válido." };

  const categories = await db.category.findMany({ select: { id: true, slug: true } });
  const pages = await db.page.findMany({ select: { id: true, slug: true, type: true } });
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));
  const pageBySlug = new Map(pages.map((page) => [page.slug, page]));
  const linkData = (href: string) => {
    const categorySlug = href.match(/^\/productos\?categoria=([a-z0-9-]+)$/i)?.[1];
    const category = categorySlug ? categoryBySlug.get(categorySlug) : undefined;
    if (category) return { linkType: "CATEGORY" as const, categoryId: category.id };
    const pageSlug = href.match(/^\/(?:politicas\/)?([a-z0-9-]+)\/?$/i)?.[1];
    const page = pageSlug ? pageBySlug.get(pageSlug) : undefined;
    if (page && ((href.startsWith("/politicas/") && page.type === "POLICY") || (!href.startsWith("/politicas/") && page.type === "GENERIC"))) return { linkType: "PAGE" as const, pageId: page.id };
    return { linkType: "CUSTOM_URL" as const, url: href };
  };

  await db.$transaction(async (tx) => {
    for (const menu of menus) {
      const savedMenu = await tx.menu.upsert({ where: { location: menu.location }, create: { location: menu.location, name: menu.name }, update: { name: menu.name } });
      await tx.menuItem.deleteMany({ where: { menuId: savedMenu.id } });
      for (const [position, item] of menu.items.entries()) {
        const root = await tx.menuItem.create({ data: { menuId: savedMenu.id, label: item.label, position, isVisible: item.isVisible, isHighlight: item.isHighlight, openInNewTab: item.openInNewTab, ...linkData(item.href) } });
        for (const [childPosition, child] of item.children.entries()) {
          await tx.menuItem.create({ data: { menuId: savedMenu.id, parentId: root.id, label: child.label, position: childPosition, isVisible: child.isVisible, isHighlight: child.isHighlight, openInNewTab: child.openInNewTab, ...linkData(child.href) } });
        }
      }
    }
  });
  updateTag(CACHE_TAGS.content);
  return { saved: "Menús y enlaces guardados." };
}
