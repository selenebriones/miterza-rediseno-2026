import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeftIcon } from "lucide-react";
import { SiteLogoForm } from "@/components/admin/content/site-logo-form";
import { HeaderActionsForm } from "@/components/admin/content/header-actions-form";
import { SiteMenusForm, type EditableMenu } from "@/components/admin/content/site-menus-form";
import { listSiteMenus } from "@/lib/admin/content";
import { requirePermission } from "@/lib/admin/session";
import { getSiteContentSettings } from "@/lib/site-settings";

export const metadata: Metadata = { title: "Header" };
const LOCATIONS = ["HEADER_MAIN", "HEADER_TOP"] as const;

export default function HeaderContentPage() {
  return <Suspense fallback={<div className="mt-6 h-96 animate-pulse rounded-card bg-white" aria-busy="true" />}><HeaderContentData /></Suspense>;
}

async function HeaderContentData() {
  await requirePermission("MANAGE_CONTENT");
  const [settings, rows] = await Promise.all([getSiteContentSettings(), listSiteMenus()]);
  const menus = rows.filter((menu) => LOCATIONS.includes(menu.location as typeof LOCATIONS[number])).map((menu): EditableMenu => ({
    location: menu.location,
    name: menu.name,
    items: menu.items.map((item) => ({
      label: item.label,
      href: item.linkType === "CATEGORY" && item.category ? `/productos?categoria=${item.category.slug}` : item.linkType === "PAGE" && item.page ? item.page.type === "POLICY" ? `/politicas/${item.page.slug}` : `/${item.page.slug}` : item.url ?? "/",
      isVisible: item.isVisible,
      isHighlight: item.isHighlight,
      openInNewTab: item.openInNewTab,
      children: item.children.map((child) => ({
        label: child.label,
        href: child.linkType === "CATEGORY" && child.category ? `/productos?categoria=${child.category.slug}` : child.linkType === "PAGE" && child.page ? child.page.type === "POLICY" ? `/politicas/${child.page.slug}` : `/${child.page.slug}` : child.url ?? "/",
        isVisible: child.isVisible, isHighlight: child.isHighlight, openInNewTab: child.openInNewTab, children: [],
      })),
    })),
  }));
  return <div className="mt-2">
    <Link href="/admin/contenido" className="inline-flex items-center gap-2 text-sm font-semibold text-brand"><ArrowLeftIcon className="size-4" />Volver a Contenido</Link>
    <h1 className="mt-4 text-[1.75rem] leading-tight font-bold lg:text-[2rem]">Header</h1>
    <p className="mt-1 max-w-2xl text-sm">Administra el logo, los enlaces y los menús que aparecen en la parte superior de la tienda.</p>
    <div className="mt-6 space-y-6"><SiteLogoForm initialLogoUrl={settings.logoUrl} /><HeaderActionsForm initialActions={settings.headerActions} /><section><h2 className="text-xl font-bold">Navegación</h2><p className="mt-1 text-sm text-muted-foreground">Configura las categorías del menú principal y los enlaces de la barra superior.</p><SiteMenusForm initialMenus={menus} /></section></div>
  </div>;
}
