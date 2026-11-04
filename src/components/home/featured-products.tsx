"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, useCarousel } from "@/components/ui/carousel";
import { ProductCard } from "@/components/product/product-card";
import type { ProductSummary } from "@/lib/products";
import { SectionHeader } from "./section-header";

type Props = {
  title: string;
  subtitle: string | null;
  products: ProductSummary[];
};

// Slider de nuevos productos: 4 tarjetas en desktop, 3 en tablet y 1.6 en móvil (la tarjeta cortada
// indica que hay más). Flechas junto a "Ver todo" en desktop; en móvil se desliza con el dedo.
export function FeaturedProducts({ title, subtitle, products }: Props) {
  // Sin productos nuevos la sección no se muestra (no hay estado vacío en el home).
  if (products.length === 0) return null;

  return (
    <section aria-labelledby="destacados" className="container pb-12 lg:pb-20">
      <Carousel opts={{ align: "start", containScroll: "trimSnaps" }} aria-label={title}>
        <SectionHeader
          id="destacados"
          title={title}
          subtitle={subtitle}
          action={{ label: "Ver todo", href: "/productos" }}
        >
          <Arrows />
        </SectionHeader>

        {/* El padding vertical deja ver la sombra de las tarjetas dentro del recorte del carrusel. */}
        <div className="-my-5">
          <CarouselContent className="-ml-3 py-5 lg:-ml-6">
            {products.map((product, index) => (
              <CarouselItem
                key={product.slug}
                aria-label={`${index + 1} de ${products.length}`}
                className="flex basis-[62%] pl-3 sm:basis-[42%] md:basis-1/3 lg:basis-1/4 lg:pl-6"
              >
                <ProductCard
                  product={product}
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 62vw"
                  variant="swatch"
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </div>
      </Carousel>
    </section>
  );
}

// Flechas solo en desktop y solo si hay algo que desplazar.
function Arrows() {
  const { scrollPrev, scrollNext, canScrollPrev, canScrollNext } = useCarousel();
  if (!canScrollPrev && !canScrollNext) return null;

  const arrowClass =
    "grid size-tap place-items-center rounded-full border border-line text-brand transition-colors hover:bg-surface disabled:text-muted-foreground disabled:hover:bg-transparent";

  return (
    <div className="ml-2 hidden gap-2 lg:flex">
      <button
        type="button"
        onClick={scrollPrev}
        disabled={!canScrollPrev}
        aria-label="Productos anteriores"
        className={arrowClass}
      >
        <ChevronLeftIcon className="size-5" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={scrollNext}
        disabled={!canScrollNext}
        aria-label="Más productos"
        className={arrowClass}
      >
        <ChevronRightIcon className="size-5" aria-hidden="true" />
      </button>
    </div>
  );
}
