import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ExternalLinkIcon } from "lucide-react";
import { BannerEditor, type BannerInitial } from "@/components/admin/content/banner-editor";
import { ContentTabs } from "@/components/admin/content/content-tabs";
import { HomeSectionEditor, type ContentChoice } from "@/components/admin/content/home-section-editor";
import type { HomeSectionType } from "@/generated/prisma/enums";
import { listBanners, listHomeCategoryChoices, listHomeProductChoices, listHomeSections } from "@/lib/admin/content";
import { requirePermission } from "@/lib/admin/session";
import { getFeaturedProducts } from "@/lib/products";

export const metadata: Metadata = { title: "Contenido" };

const SECTION_COPY: Record<HomeSectionType, { label: string; description: string }> = {
  HERO_BANNERS: { label: "Banners principales", description: "Carrusel de campañas al inicio de la página." },
  VALUE_PROPOSITION: { label: "Beneficios", description: "Franja que explica por qué comprar en Mi Terza." },
  CATEGORY_CAROUSEL: { label: "Categorías", description: "Accesos a las categorías destacadas del catálogo." },
  FEATURED_PRODUCTS: { label: "Productos destacados", description: "Carrusel de productos seleccionados y su cantidad." },
  PROMO_BANNERS: { label: "Promociones", description: "Cuadrícula visual de ofertas y campañas." },
  INSTALL_GUIDE: { label: "Guías y ayuda", description: "Bloque de instalación y preguntas frecuentes del inicio." },
};

export default function ContentPage() {
  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] leading-tight font-bold lg:text-[2rem]">Página de Inicio</h1>
          <p className="mt-1 max-w-2xl text-sm">Edita los textos, imágenes y listas dentro de la estructura actual del inicio.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/contenido/header" className="inline-flex h-11 items-center gap-2 rounded-pill border border-brand px-4 font-semibold text-brand hover:bg-surface">Header</Link>
          <Link href="/admin/contenido/footer" className="inline-flex h-11 items-center gap-2 rounded-pill border border-brand px-4 font-semibold text-brand hover:bg-surface">Footer</Link>
          <Link href="/" target="_blank" className="inline-flex h-11 items-center gap-2 rounded-pill border border-brand px-4 font-semibold text-brand hover:bg-surface">Ver inicio <ExternalLinkIcon className="size-4" aria-hidden="true" /></Link>
        </div>
      </div>
      <Suspense fallback={<div className="mt-6 h-96 animate-pulse rounded-card bg-white" aria-busy="true" />}>
        <ContentDashboard />
      </Suspense>
    </div>
  );
}

async function ContentDashboard() {
  await requirePermission("MANAGE_CONTENT");
  const [sections, banners, categoryChoices, productChoices, currentFeatured] = await Promise.all([
    listHomeSections(),
    listBanners(),
    listHomeCategoryChoices(),
    listHomeProductChoices(),
    getFeaturedProducts(12),
  ]);

  const bannerInitial = (banner: (typeof banners)[number]): BannerInitial => banner;

  const sectionEditor = (type: HomeSectionType) => {
    const section = sections.find((row) => row.type === type)!;
    const settings = { ...((section.settings ?? {}) as Record<string, unknown>) };
    let choices: ContentChoice[] = [];
    if (type === "CATEGORY_CAROUSEL") {
      choices = categoryChoices;
      if (!Array.isArray(settings.categoryItems)) {
        const legacySlugs = Array.isArray(settings.categorySlugs) ? settings.categorySlugs : null;
        settings.categoryItems = categoryChoices
          .filter((choice) => legacySlugs ? legacySlugs.includes(choice.value) : choice.selectedByDefault)
          .map((choice) => ({ title: choice.label.split(" / ").at(-1) ?? choice.label, imageUrl: choice.imageUrl, imageAlt: choice.imageAlt, href: choice.href }));
      }
    }
    if (type === "FEATURED_PRODUCTS") {
      choices = productChoices;
      if (!Array.isArray(settings.productSlugs)) settings.productSlugs = currentFeatured.map((product) => product.slug);
    }
    return <HomeSectionEditor section={{ ...section, settings }} description={SECTION_COPY[type].description} choices={choices} />;
  };
  const bannerGroup = (placement: "HOME_HERO" | "HOME_PROMO" | "ANNOUNCEMENT") => (
    <div className="grid gap-4 xl:grid-cols-2">{banners.filter((banner) => banner.placement === placement).map((banner, index) => <BannerEditor key={banner.id} banner={bannerInitial(banner)} number={index + 1} />)}</div>
  );

  return <ContentTabs items={[
    { value: "hero", label: "Banners", content: <div className="space-y-4">{sectionEditor("HERO_BANNERS")}{bannerGroup("HOME_HERO")}</div> },
    { value: "benefits", label: "Beneficios", content: sectionEditor("VALUE_PROPOSITION") },
    { value: "categories", label: "Categorías", content: sectionEditor("CATEGORY_CAROUSEL") },
    { value: "products", label: "Productos destacados", content: sectionEditor("FEATURED_PRODUCTS") },
    { value: "promos", label: "Promociones", content: <div className="space-y-4">{sectionEditor("PROMO_BANNERS")}{bannerGroup("HOME_PROMO")}</div> },
    { value: "help", label: "Guías y ayuda", content: sectionEditor("INSTALL_GUIDE") },
    { value: "announcement", label: "Aviso superior", content: bannerGroup("ANNOUNCEMENT") },
  ]} />;
}
