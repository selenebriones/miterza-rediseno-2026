"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, ImageIcon, XIcon, ZoomInIcon } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { ProductImage } from "@/lib/products";
import { cn } from "@/lib/utils";

type Props = {
  images: ProductImage[];
  productName: string;
  // Índice al que saltar cuando cambia la variante (p. ej. un color con foto propia).
  focusIndex?: number;
};

const arrowClass =
  "absolute top-1/2 grid size-tap -translate-y-1/2 place-items-center rounded-full bg-white/90 text-brand shadow-card transition hover:bg-white disabled:opacity-0";

export function ProductGallery({ images, productName, focusIndex }: Props) {
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomSession, setZoomSession] = useState(0); // remonta el visor en cada apertura

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setSelected(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  useEffect(() => {
    if (api && focusIndex !== undefined) api.scrollTo(focusIndex);
  }, [api, focusIndex]);

  // Al navegar en el visor ampliado, la galería principal lo sigue sin animación.
  const syncMain = useCallback((index: number) => api?.scrollTo(index, true), [api]);

  if (images.length === 0) {
    return (
      <div className="grid aspect-[4/5] place-items-center rounded-card bg-surface lg:aspect-square">
        <span className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
          <ImageIcon className="size-12 text-brand/30" aria-hidden="true" />
          Imagen próximamente
        </span>
      </div>
    );
  }

  const many = images.length > 1;

  return (
    <div className="lg:grid lg:grid-cols-[5rem_1fr] lg:gap-4">
      <div className="group/gallery relative lg:order-2">
        <Carousel setApi={setApi} aria-label={`Imágenes de ${productName}`}>
          <CarouselContent className="-ml-0">
            {images.map((image, index) => (
              <CarouselItem key={image.url} className="pl-0" aria-label={`${index + 1} de ${images.length}`}>
                <button
                  type="button"
                  onClick={() => {
                    setZoomSession((n) => n + 1);
                    setZoomOpen(true);
                  }}
                  aria-label={`Ampliar imagen ${index + 1} de ${images.length}`}
                  className="relative block aspect-[4/5] w-full cursor-zoom-in overflow-hidden rounded-card bg-surface lg:aspect-square"
                >
                  <Image
                    src={image.url}
                    alt={image.alt}
                    fill
                    sizes="(min-width: 1024px) 45vw, 100vw"
                    loading={index === 0 ? "eager" : "lazy"}
                    fetchPriority={index === 0 ? "high" : undefined}
                    className="object-cover"
                  />
                </button>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <span className="pointer-events-none absolute top-3 right-3 hidden size-9 place-items-center rounded-full bg-white/90 text-brand opacity-0 shadow-card transition group-hover/gallery:opacity-100 lg:grid">
          <ZoomInIcon className="size-4" aria-hidden="true" />
        </span>

        {many && (
          <>
            {/* Móvil: contador y puntos. Desktop: flechas al pasar el cursor. */}
            <span className="pointer-events-none absolute right-3 bottom-3 rounded-pill bg-black/60 px-2.5 py-1 text-xs font-semibold text-white lg:hidden">
              {selected + 1} / {images.length}
            </span>
            <button
              type="button"
              onClick={() => api?.scrollPrev()}
              disabled={selected === 0}
              aria-label="Imagen anterior"
              className={cn(arrowClass, "left-3 hidden opacity-0 group-hover/gallery:opacity-100 focus-visible:opacity-100 lg:grid")}
            >
              <ChevronLeftIcon className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => api?.scrollNext()}
              disabled={selected === images.length - 1}
              aria-label="Imagen siguiente"
              className={cn(arrowClass, "right-3 hidden opacity-0 group-hover/gallery:opacity-100 focus-visible:opacity-100 lg:grid")}
            >
              <ChevronRightIcon className="size-5" aria-hidden="true" />
            </button>
            <div className="mt-3 flex justify-center gap-1.5 lg:hidden" aria-hidden="true">
              {images.map((image, index) => (
                <span
                  key={image.url}
                  className={cn("h-1.5 rounded-pill transition-all", index === selected ? "w-6 bg-brand" : "w-1.5 bg-line")}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {many && (
        <ul className="hidden flex-col gap-3 lg:order-1 lg:flex">
          {images.map((image, index) => (
            <li key={image.url}>
              <button
                type="button"
                onClick={() => api?.scrollTo(index)}
                aria-label={`Ver imagen ${index + 1} de ${images.length}`}
                aria-current={index === selected}
                className={cn(
                  "relative block aspect-square w-full overflow-hidden rounded-lg bg-surface ring-2 ring-offset-2 transition",
                  index === selected ? "ring-brand" : "ring-transparent hover:ring-line",
                )}
              >
                <Image src={image.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ZoomDialog
        key={zoomSession}
        images={images}
        productName={productName}
        open={zoomOpen}
        onOpenChange={setZoomOpen}
        startIndex={selected}
        onIndexChange={syncMain}
      />
    </div>
  );
}

// Imagen a pantalla completa: en persianas y tapetes la textura decide la compra.
function ZoomDialog({
  images,
  productName,
  open,
  onOpenChange,
  startIndex,
  onIndexChange,
}: {
  images: ProductImage[];
  productName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startIndex: number;
  onIndexChange: (index: number) => void;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(startIndex);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => {
      setSelected(api.selectedScrollSnap());
      onIndexChange(api.selectedScrollSnap());
    };
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, onIndexChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex h-dvh max-h-none w-screen max-w-none flex-col gap-0 rounded-none bg-white p-0 ring-0 sm:max-w-none"
      >
        <DialogTitle className="sr-only">Imágenes de {productName}</DialogTitle>
        <div className="flex h-16 shrink-0 items-center justify-between px-4">
          <span className="text-sm font-medium text-heading">
            {selected + 1} / {images.length}
          </span>
          <DialogClose className="grid size-tap place-items-center rounded-full text-brand hover:bg-surface" aria-label="Cerrar">
            <XIcon className="size-6" aria-hidden="true" />
          </DialogClose>
        </div>
        <Carousel setApi={setApi} opts={{ startIndex }} className="min-h-0 flex-1" aria-label={`Imágenes ampliadas de ${productName}`}>
          <CarouselContent className="-ml-0 h-[calc(100dvh-4rem)]">
            {images.map((image, index) => (
              <CarouselItem key={image.url} className="relative h-full pl-0" aria-label={`${index + 1} de ${images.length}`}>
                <Image src={image.url} alt={image.alt} fill sizes="100vw" className="object-contain" />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => api?.scrollPrev()}
              disabled={selected === 0}
              aria-label="Imagen anterior"
              className={cn(arrowClass, "left-4 max-sm:hidden")}
            >
              <ChevronLeftIcon className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => api?.scrollNext()}
              disabled={selected === images.length - 1}
              aria-label="Imagen siguiente"
              className={cn(arrowClass, "right-4 max-sm:hidden")}
            >
              <ChevronRightIcon className="size-5" aria-hidden="true" />
            </button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
