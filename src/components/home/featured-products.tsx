import { ProductCard } from "@/components/product/product-card";
import type { ProductSummary } from "@/lib/products";
import { SectionHeader } from "./section-header";

type Props = {
  title: string;
  subtitle: string | null;
  products: ProductSummary[];
};

export function FeaturedProducts({ title, subtitle, products }: Props) {
  // Sin productos destacados la sección no se muestra (no hay estado vacío en el home).
  if (products.length === 0) return null;

  return (
    <section aria-labelledby="destacados" className="container pb-12 lg:pb-20">
      <SectionHeader id="destacados" title={title} subtitle={subtitle} action={{ label: "Ver todo", href: "/productos" }} />
      <ul className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 lg:gap-x-6">
        {products.map((product) => (
          <li key={product.slug} className="flex">
            <ProductCard product={product} sizes="(min-width: 768px) 25vw, 50vw" />
          </li>
        ))}
      </ul>
    </section>
  );
}
