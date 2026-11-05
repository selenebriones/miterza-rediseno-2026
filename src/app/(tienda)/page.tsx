import type { Metadata } from "next";
import { CategoryCarousel } from "@/components/home/category-carousel";
import { FeaturedProducts } from "@/components/home/featured-products";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { HelpBand } from "@/components/home/help-band";
import { PromoBanners } from "@/components/home/promo-banners";
import { ValueProposition } from "@/components/home/value-proposition";
import { getHeroBanners, getHomeCategories, getHomeSections, getPromoBanners, type HomeSection } from "@/lib/home";
import { getFeaturedProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Mi Terza | Pisos, muros y persianas en línea",
  description:
    "Compra pisos, alfombras, muros, persianas y productos para exterior Terza en línea, con más de 40 años de respaldo y las mejores garantías.",
};

export default async function HomePage() {
  const sections = await getHomeSections();
  const featuredLimit = sections.find((s) => s.type === "FEATURED_PRODUCTS")?.limit ?? 12;
  const [banners, categories, featured, promos] = await Promise.all([
    getHeroBanners(),
    getHomeCategories(),
    getFeaturedProducts(featuredLimit),
    getPromoBanners(),
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
        return section.help && <HelpBand content={section.help} />;
      case "PROMO_BANNERS":
        return (
          <PromoBanners title={section.title ?? "Ofertas y promociones"} subtitle={section.subtitle} banners={promos} />
        );
      default:
        return null;
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
