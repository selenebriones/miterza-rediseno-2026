"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, useCarousel } from "@/components/ui/carousel";
import type { HomeCategory } from "@/lib/home";
import { SectionHeader } from "./section-header";

type Props = {
  title: string;
  categories: HomeCategory[];
};

export function CategoryCarousel({ title, categories }: Props) {
  return (
    <section aria-labelledby="categorias" className="container py-12 lg:py-16">
      <Carousel opts={{ align: "start", containScroll: "trimSnaps" }} aria-label={title}>
        {/* Título a la izquierda y flechas a la derecha, como en "Nuevos productos". */}
        <SectionHeader id="categorias" title={title}>
          <Arrows />
        </SectionHeader>

        {/* Círculos chicos en slider: 3.5 en móvil, 5 en tablet y 8 en desktop. La categoría cortada
            indica que hay más a la derecha. */}
        <CarouselContent className="-ml-3 lg:-ml-5">
          {categories.map((category, index) => (
            <CarouselItem
              key={category.slug}
              aria-label={`${index + 1} de ${categories.length}`}
              className="basis-[28%] pl-3 sm:basis-1/5 md:basis-1/6 lg:basis-[12.5%] lg:pl-5"
            >
              <Link href={category.href} className="group/cat block rounded-card text-center">
                <span className="relative mx-auto block aspect-square w-full overflow-hidden rounded-full bg-surface shadow-card transition-shadow duration-300 group-hover/cat:shadow-card-hover">
                  <Image
                    src={category.imageUrl}
                    alt={category.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 12vw, (min-width: 768px) 16vw, 28vw"
                    className="object-cover transition-transform duration-300 group-hover/cat:scale-105"
                  />
                </span>
                <span className="mt-3 block text-sm leading-snug font-semibold text-heading transition-colors group-hover/cat:text-brand lg:text-base">
                  {category.name}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground lg:text-sm">
                  {category.productCount} {category.productCount === 1 ? "producto" : "productos"}
                </span>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
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
    <div className="hidden gap-2 lg:flex">
      <button
        type="button"
        onClick={scrollPrev}
        disabled={!canScrollPrev}
        aria-label="Categorías anteriores"
        className={arrowClass}
      >
        <ChevronLeftIcon className="size-5" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={scrollNext}
        disabled={!canScrollNext}
        aria-label="Más categorías"
        className={arrowClass}
      >
        <ChevronRightIcon className="size-5" aria-hidden="true" />
      </button>
    </div>
  );
}
