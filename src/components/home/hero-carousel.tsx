"use client";

import Link from "next/link";
import { getImageProps } from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, PauseIcon, PlayIcon } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import type { HeroBanner } from "@/lib/home";
import { cn } from "@/lib/utils";

const AUTOPLAY_MS = 7000;

const controlClass =
  "grid size-tap place-items-center rounded-full text-brand transition-colors hover:bg-surface active:bg-brand-50";

export function HeroCarousel({ banners }: { banners: HeroBanner[] }) {
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [interacting, setInteracting] = useState(false); // cursor encima o foco dentro
  const reducedMotion = usePrefersReducedMotion();
  const hasMany = banners.length > 1;
  const autoplay = hasMany && !userPaused && !reducedMotion;

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setSelected(api.selectedScrollSnap());
    // Arrastrar con el dedo o el mouse cuenta como interacción: se detiene la rotación.
    const onDrag = () => setUserPaused(true);
    api.on("select", onSelect);
    api.on("pointerDown", onDrag);
    return () => {
      api.off("select", onSelect);
      api.off("pointerDown", onDrag);
    };
  }, [api]);

  useEffect(() => {
    if (!api || !autoplay || interacting) return;
    const timer = setInterval(() => api.scrollNext(), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [api, autoplay, interacting]);

  return (
    <div className="container pt-4 lg:pt-6">
      <Carousel
        setApi={setApi}
        opts={{ loop: hasMany }}
        aria-label="Promociones destacadas"
        onMouseEnter={() => setInteracting(true)}
        onMouseLeave={() => setInteracting(false)}
        onFocus={() => setInteracting(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setInteracting(false);
        }}
      >
        <CarouselContent className="-ml-0" aria-live={autoplay && !interacting ? "off" : "polite"}>
          {banners.map((banner, index) => (
            <CarouselItem
              key={banner.id}
              aria-label={`${index + 1} de ${banners.length}`}
              className="pl-0"
            >
              <Slide banner={banner} priority={index === 0} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {hasMany && (
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center" role="group" aria-label="Elegir promoción">
            {banners.map((banner, index) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => api?.scrollTo(index)}
                aria-label={`Ver promoción ${index + 1}: ${banner.title}`}
                aria-current={index === selected}
                className="group/dot grid h-tap place-items-center px-1.5"
              >
                <span
                  className={cn(
                    "block h-2 rounded-pill transition-all duration-300",
                    index === selected ? "w-8 bg-brand" : "w-2 bg-line group-hover/dot:bg-brand/40",
                  )}
                />
              </button>
            ))}
          </div>

          <div className="flex items-center">
            {!reducedMotion && (
              <button
                type="button"
                onClick={() => setUserPaused((p) => !p)}
                aria-label={userPaused ? "Reanudar rotación de promociones" : "Pausar rotación de promociones"}
                className={controlClass}
              >
                {userPaused ? <PlayIcon className="size-5" aria-hidden="true" /> : <PauseIcon className="size-5" aria-hidden="true" />}
              </button>
            )}
            <button type="button" onClick={() => api?.scrollPrev()} aria-label="Promoción anterior" className={cn(controlClass, "max-sm:hidden")}>
              <ChevronLeftIcon className="size-5" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => api?.scrollNext()} aria-label="Promoción siguiente" className={cn(controlClass, "max-sm:hidden")}>
              <ChevronRightIcon className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Slide({ banner, priority }: { banner: HeroBanner; priority: boolean }) {
  const dark = banner.theme === "dark";
  // Imagen distinta por tamaño de pantalla: se usa fetchPriority en lugar de `preload` (recomendación de Next 16).
  const common = {
    alt: banner.imageAlt,
    sizes: "(min-width: 1024px) 60vw, 100vw",
    loading: priority ? ("eager" as const) : ("lazy" as const),
    fetchPriority: priority ? ("high" as const) : undefined,
  };
  const {
    props: { srcSet: desktopSrcSet },
  } = getImageProps({ ...common, src: banner.imageDesktop, fill: true });
  const {
    props: { srcSet: mobileSrcSet, ...imgProps },
  } = getImageProps({ ...common, src: banner.imageMobile ?? banner.imageDesktop, fill: true });

  return (
    <div
      className={cn(
        "grid h-full overflow-hidden rounded-card lg:h-[30rem] lg:grid-cols-12",
        dark ? "bg-brand" : "bg-surface",
      )}
    >
      {/* `fill`: el panel guarda solo la URL de la imagen; el tamaño lo da el contenedor. */}
      <picture className="relative block aspect-[4/3] sm:aspect-[16/9] lg:order-2 lg:col-span-7 lg:aspect-auto lg:h-full">
        <source media="(min-width: 1024px)" srcSet={desktopSrcSet} />
        <source srcSet={mobileSrcSet} />
        {/* eslint-disable-next-line jsx-a11y/alt-text -- el alt viene en imgProps */}
        <img {...imgProps} className="object-cover" />
      </picture>

      <div className="flex flex-col gap-4 p-6 sm:p-8 lg:col-span-5 lg:justify-center lg:gap-5 lg:p-12">
        <h2 className={cn("text-[1.75rem] leading-[1.1] font-bold text-balance lg:text-[2.75rem]", dark ? "text-white" : "text-heading")}>
          {banner.title}
        </h2>
        {banner.subtitle && <p className={cn("text-base lg:text-lg", dark ? "text-white/85" : "text-body")}>{banner.subtitle}</p>}
        <Link
          href={banner.ctaUrl}
          className={cn(
            "mt-1 inline-flex h-12 items-center justify-center rounded-pill px-7 font-semibold transition-colors sm:w-fit",
            dark
              ? "bg-accent text-brand hover:bg-white active:bg-accent-hover"
              : "bg-brand text-white hover:bg-accent hover:text-brand active:bg-accent-hover",
          )}
        >
          {banner.ctaLabel}
        </Link>
      </div>
    </div>
  );
}
