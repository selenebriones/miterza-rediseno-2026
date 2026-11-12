"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { PauseIcon, PlayIcon } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import type { HeroBanner } from "@/lib/home";
import { cn } from "@/lib/utils";

const AUTOPLAY_MS = 7000;

// Hero a todo el ancho: foto con acercamiento lento, texto centrado que sube al entrar
// y botón rectangular. Estilo tomado de la referencia (Gecko, Home Accessories).
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
    <section aria-label="Promociones" className="relative">
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
            <CarouselItem key={banner.id} aria-label={`${index + 1} de ${banners.length}`} className="pl-0">
              <Slide banner={banner} active={index === selected} priority={index === 0} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {hasMany && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex items-center justify-center lg:bottom-5">
          <div className="pointer-events-auto flex items-center" role="group" aria-label="Elegir promoción">
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
                    index === selected ? "w-8 bg-white" : "w-2 bg-white/55 group-hover/dot:bg-white/85",
                  )}
                />
              </button>
            ))}
          </div>

          {!reducedMotion && (
            <button
              type="button"
              onClick={() => setUserPaused((p) => !p)}
              aria-label={userPaused ? "Reanudar rotación de promociones" : "Pausar rotación de promociones"}
              className="pointer-events-auto absolute right-3 grid size-tap place-items-center rounded-full bg-black/25 text-white backdrop-blur-sm transition-colors hover:bg-black/45 lg:right-6"
            >
              {userPaused ? (
                <PlayIcon className="size-5" aria-hidden="true" />
              ) : (
                <PauseIcon className="size-5" aria-hidden="true" />
              )}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function Slide({ banner, active, priority }: { banner: HeroBanner; active: boolean; priority: boolean }) {
  return (
    <div
      data-active={active}
      className="group/slide relative flex h-[30rem] items-center justify-center overflow-hidden bg-brand sm:h-[34rem] lg:h-[38rem]"
    >
      <Image
        src={banner.imageDesktop}
        alt={banner.imageAlt}
        fill
        sizes="100vw"
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        className="object-cover group-data-[active=true]/slide:animate-hero-zoom"
      />
      {/* Velo para que el texto blanco se lea sobre cualquier foto. */}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/35 to-black/50" />

      <div className="container relative z-10 flex flex-col items-center gap-4 py-12 text-center text-white lg:gap-5">
        <h2
          className="max-w-4xl text-[2rem] leading-[1.08] font-bold text-balance text-white opacity-0 drop-shadow-md group-data-[active=true]/slide:animate-hero-rise sm:text-5xl lg:text-[4rem]"
          style={{ animationDelay: "150ms" }}
        >
          {banner.title}
        </h2>
        {banner.subtitle && (
          <p
            className="max-w-2xl text-base text-white/90 opacity-0 group-data-[active=true]/slide:animate-hero-rise lg:text-xl"
            style={{ animationDelay: "300ms" }}
          >
            {banner.subtitle}
          </p>
        )}
        <Link
          href={banner.ctaUrl}
          className="mt-2 inline-flex h-[3.125rem] items-center justify-center rounded-[5px] bg-accent px-9 font-medium text-brand opacity-0 shadow-card-hover transition-colors group-data-[active=true]/slide:animate-hero-rise hover:bg-white active:bg-accent-hover"
          style={{ animationDelay: "450ms" }}
        >
          {banner.ctaLabel}
        </Link>
      </div>
    </div>
  );
}
