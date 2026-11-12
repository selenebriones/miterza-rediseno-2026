import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeftIcon, ExternalLinkIcon } from "lucide-react";
import { SiteMenusForm, type EditableMenu } from "@/components/admin/content/site-menus-form";
import { SiteSettingsForm } from "@/components/admin/content/site-settings-form";
import { ContentTabs } from "@/components/admin/content/content-tabs";
import { listEditablePages, listSiteMenus } from "@/lib/admin/content";
import { requirePermission } from "@/lib/admin/session";
import { getSiteContentSettings } from "@/lib/site-settings";

export const metadata: Metadata = { title: "Footer" };
const LOCATIONS = ["FOOTER", "FOOTER_LEGAL"] as const;

export default function FooterContentPage() {
  return <Suspense fallback={<div className="mt-6 h-96 animate-pulse rounded-card bg-white" aria-busy="true" />}><FooterContentData /></Suspense>;
}

async function FooterContentData() {
  await requirePermission("MANAGE_CONTENT");
  const [settings, rows, pages] = await Promise.all([getSiteContentSettings(), listSiteMenus(), listEditablePages()]);
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
    <h1 className="mt-4 text-[1.75rem] leading-tight font-bold lg:text-[2rem]">Footer</h1>
    <p className="mt-1 max-w-2xl text-sm">Administra el contenido, datos de contacto, redes sociales y enlaces del pie de página.</p>
    <ContentTabs items={[
      { value: "footer", label: "Footer", content: <div className="space-y-8"><section><h2 className="text-xl font-bold">Columnas y enlaces</h2><SiteMenusForm initialMenus={menus} /></section><section><h2 className="text-xl font-bold">Información del pie</h2><SiteSettingsForm settings={settings} /></section></div> },
      { value: "pages", label: "Páginas legales", content: <section id="paginas-footer" className="space-y-4"><div><h2 className="text-xl font-bold">Páginas legales del Footer</h2><p className="mt-1 max-w-3xl text-sm text-muted-foreground">Edita el contenido de las páginas enlazadas desde los avisos legales del pie de página.</p></div><div className="grid gap-3 lg:grid-cols-2">{pages.map((page) => <article key={page.id} className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-white p-5 shadow-card"><div><h3 className="font-bold text-heading">{page.title}</h3><p className="mt-1 text-sm text-muted-foreground">/politicas/{page.slug} · {page.isPublished ? "Publicada" : "Borrador"}</p></div><div className="flex gap-2"><Link href={`/politicas/${page.slug}`} target="_blank" className="inline-flex h-10 items-center gap-2 rounded-pill border border-line px-3 text-sm font-semibold text-heading"><ExternalLinkIcon className="size-4" />Ver</Link><Link href={`/admin/contenido/paginas/${page.id}`} className="inline-flex h-10 items-center rounded-pill bg-brand px-4 text-sm font-semibold text-white">Editar</Link></div></article>)}{!pages.length && <p className="rounded-card bg-white p-5 text-sm">No hay páginas legales para editar.</p>}</div></section> },
    ]} />
  </div>;
}
