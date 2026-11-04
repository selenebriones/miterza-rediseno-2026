import type { Metadata } from "next";
import { CategoryCarousel } from "@/components/home/category-carousel";
import { FeaturedProducts } from "@/components/home/featured-products";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { InstallGuide } from "@/components/home/install-guide";
import { ValueProposition } from "@/components/home/value-proposition";
import { getHeroBanners, getHomeCategories, getHomeSections, type HomeSection } from "@/lib/home";
import { getFeaturedProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Mi Terza | Pisos, muros y persianas en línea",
  description:
    "Compra pisos, alfombras, muros, persianas y productos para exterior Terza en línea, con más de 40 años de respaldo y las mejores garantías.",
};

export default async function HomePage() {
  const sections = await getHomeSections();
  const featuredLimit = sections.find((s) => s.type === "FEATURED_PRODUCTS")?.limit ?? 12;
  const [banners, categories, featured] = await Promise.all([
    getHeroBanners(),
    getHomeCategories(),
    getFeaturedProducts(featuredLimit),
  ]);

  // El orden y la visibilidad de cada bloque se administran desde el panel (HomeSection).
  function renderSection(section: HomeSection) {
    switch (section.type) {
      case "HERO_BANNERS":
        return banners.length > 0 && <HeroCarousel banners={banners} />;
      case "VALUE_PROPOSITION":
        return <ValueProposition title={section.title} items={section.items} />;
      case "CATEGORY_CAROUSEL":
        return (
          categories.length > 0 && <CategoryCarousel title={section.title ?? "Categoría"} categories={categories} />
        );
      case "FEATURED_PRODUCTS":
        return (
          <FeaturedProducts title={section.title ?? "Destacados"} subtitle={section.subtitle} products={featured} />
        );
      case "INSTALL_GUIDE":
        return (
          section.tutorials.length > 0 && (
            <InstallGuide
              title={section.title ?? "Guía de instalación"}
              subtitle={section.subtitle}
              eyebrow={section.eyebrow}
              tutorials={section.tutorials}
            />
          )
        );
      default:
        return null; // PROMO_BANNERS aún no tiene diseño
    }
  }

  return (
    <>
      <h1 className="sr-only">Mi Terza: pisos, muros y persianas Terza en línea</h1>
      {sections.map((section) => (
        <div key={section.type}>{renderSection(section)}</div>
      ))}
    </>
  );
}
