import Image from "next/image";
import Link from "next/link";
import type { PromoBanner } from "@/lib/home";
import { cn } from "@/lib/utils";
import { SectionHeader } from "./section-header";

type Props = {
  title: string;
  subtitle: string | null;
  banners: PromoBanner[];
};

// "Ofertas y promociones": cuadrícula de banners que enlazan a un producto o a una categoría.
// Desktop: el primero grande a la izquierda; a la derecha, arriba dos cuadros y abajo uno ancho.
// Móvil: el grande arriba, los dos chicos lado a lado y el ancho al final.
export function PromoBanners({ title, subtitle, banners }: Props) {
  if (banners.length === 0) return null;
  const [main, first, second, wide] = banners;

  return (
    <section aria-labelledby="promociones" className="container pb-12 lg:pb-20">
      <SectionHeader
        id="promociones"
        title={title}
        subtitle={subtitle}
        action={{ label: "Ver ofertas", href: "/productos?ofertas=1" }}
      />

      {banners.length < 4 ? (
        // Con menos de 4 banners la composición no se sostiene: se muestran en una cuadrícula simple.
        <div className="grid gap-3 sm:grid-cols-2 lg:gap-6">
          {banners.map((banner) => (
            <PromoTile key={banner.id} banner={banner} size="md" className="aspect-[4/3]" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2 lg:gap-6">
          <PromoTile banner={main} size="lg" className="aspect-[4/3] lg:aspect-auto lg:h-full" />
          <div className="grid gap-3 lg:gap-6">
            <div className="grid grid-cols-2 gap-3 lg:gap-6">
              <PromoTile banner={first} size="sm" className="aspect-square sm:aspect-[4/3]" />
              <PromoTile banner={second} size="sm" className="aspect-square sm:aspect-[4/3]" />
            </div>
            <PromoTile banner={wide} size="md" className="aspect-[16/9]" />
          </div>
        </div>
      )}
    </section>
  );
}

// Círculo de ahorro por tamaño de banner. Con "Hasta" son tres renglones, así que el número y las
// leyendas bajan un paso para que quepan con aire dentro del círculo.
const badgeSize = {
  sm: "size-16 px-1 lg:size-20",
  md: "size-20 px-1.5 lg:size-24",
  lg: "size-24 px-2 lg:size-28",
};

const badgeText = {
  // [con "Hasta", sin "Hasta"]
  sm: [
    "[&_small]:text-[0.4375rem] lg:[&_small]:text-[0.5rem] [&_strong]:text-base lg:[&_strong]:text-lg",
    "[&_small]:text-[0.5rem] lg:[&_small]:text-[0.5625rem] [&_strong]:text-lg lg:[&_strong]:text-[1.375rem]",
  ],
  md: [
    "[&_small]:text-[0.5rem] lg:[&_small]:text-[0.5625rem] [&_strong]:text-xl lg:[&_strong]:text-2xl",
    "[&_small]:text-[0.5625rem] lg:[&_small]:text-[0.625rem] [&_strong]:text-2xl lg:[&_strong]:text-3xl",
  ],
  lg: [
    "[&_small]:text-[0.5625rem] lg:[&_small]:text-[0.625rem] [&_strong]:text-2xl lg:[&_strong]:text-3xl",
    "[&_small]:text-[0.625rem] lg:[&_small]:text-xs [&_strong]:text-3xl lg:[&_strong]:text-4xl",
  ],
};

const labelSize = {
  sm: "text-base lg:text-xl",
  md: "text-xl lg:text-3xl",
  lg: "text-2xl lg:text-4xl",
};

function PromoTile({ banner, size, className }: { banner: PromoBanner; size: "sm" | "md" | "lg"; className?: string }) {
  return (
    <Link
      href={banner.href}
      className={cn(
        "group/promo relative block overflow-hidden rounded-card bg-surface shadow-card transition-shadow duration-300 hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand",
        className,
      )}
    >
      <Image
        src={banner.imageUrl}
        alt={banner.imageAlt}
        fill
        sizes={size === "sm" ? "(min-width: 1024px) 25vw, 50vw" : "(min-width: 1024px) 50vw, 100vw"}
        className="object-cover transition-transform duration-700 ease-out group-hover/promo:scale-105"
      />
      {/* Degradado inferior para que la etiqueta se lea sobre cualquier foto. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/55 to-transparent"
      />

      {banner.discount && (
        <span
          className={cn(
            "absolute top-3 left-3 flex flex-col items-center justify-center rounded-full bg-accent text-center leading-none font-bold text-brand uppercase shadow-lg lg:top-4 lg:left-4",
            badgeSize[size],
            badgeText[size][banner.discountPrefix || banner.discountSuffix ? 0 : 1],
          )}
        >
          {banner.discountPrefix && <small className="tracking-wide">{banner.discountPrefix}</small>}
          <strong className="font-extrabold tracking-tight">{banner.discount}%</strong>
          {banner.discountSuffix && <small className="tracking-wide">{banner.discountSuffix}</small>}
        </span>
      )}

      <span
        className={cn(
          "absolute right-4 bottom-3 left-4 text-right leading-tight font-extrabold tracking-tight text-white uppercase drop-shadow-md lg:right-6 lg:bottom-5",
          labelSize[size],
        )}
      >
        {banner.title}
      </span>
    </Link>
  );
}
