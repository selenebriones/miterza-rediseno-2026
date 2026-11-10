import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, PlayIcon } from "lucide-react";
import type { HelpBand as HelpBandContent } from "@/lib/home";

// Banda de ayuda a todo el ancho, en dos columnas (estilo terza-sitio):
//  - Izquierda, fondo lima: guía para medir e instalar persianas con sus videos.
//  - Derecha, fondo blanco: invitación a las preguntas frecuentes.
// Cada columna tiene una foto que se desvanece hacia el texto. En móvil se apilan con la foto arriba.
export function HelpBand({ content }: { content: HelpBandContent }) {
  const { guide, faq } = content;

  return (
    // Línea verde oscuro de 5 px arriba que separa la banda de la sección anterior.
    <section aria-label="Ayuda" className="grid border-t-[5px] border-brand-dark lg:grid-cols-2">
      <div className="relative isolate overflow-hidden bg-accent">
        <FadedPhoto src={guide.imageUrl} alt={guide.imageAlt} side="left" />
        <div className="relative flex flex-col items-start px-4 pt-56 pb-12 sm:px-8 lg:min-h-[34rem] lg:items-end lg:justify-center lg:py-16 lg:pr-12 lg:pl-[42%] lg:text-right xl:pr-16">
          {guide.eyebrow && <p className="text-sm font-bold tracking-[0.12em] text-brand uppercase">{guide.eyebrow}</p>}
          <h2 className="mt-4 text-[2rem] leading-[1.05] font-bold text-balance text-brand lg:text-[2.75rem] xl:text-5xl">
            {guide.title}
          </h2>
          {guide.text && <p className="mt-5 max-w-md text-base text-brand lg:text-lg">{guide.text}</p>}

          {guide.tutorials.length > 0 && (
            <ul className="mt-6 flex flex-col gap-2 lg:items-end">
              {guide.tutorials.map((tutorial) => (
                <li key={tutorial.videoUrl}>
                  <a
                    href={tutorial.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/video inline-flex items-center gap-3 text-brand lg:flex-row-reverse"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-brand shadow-sm transition-transform group-hover/video:scale-110">
                      <PlayIcon className="ml-0.5 size-4 fill-current" aria-hidden="true" />
                    </span>
                    <span className="text-left font-semibold underline-offset-4 group-hover/video:underline lg:text-right">
                      {tutorial.title}
                      <span className="sr-only"> ({tutorial.lines}): video en YouTube, se abre en otra pestaña</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}

        </div>
      </div>

      <div className="relative isolate overflow-hidden bg-white">
        {/* La persona de la foto está en el tercio izquierdo: en escritorio la foto se ancla a la izquierda
            para que quede en la parte que no se desvanece. */}
        <FadedPhoto src={faq.imageUrl} alt={faq.imageAlt} side="right" position="object-[30%_25%] lg:object-left" />
        <div className="relative flex flex-col items-start px-4 pt-56 pb-12 sm:px-8 lg:min-h-[34rem] lg:justify-center lg:py-16 lg:pr-[42%] lg:pl-12 xl:pl-16">
          {faq.eyebrow && <p className="text-sm font-bold tracking-[0.12em] text-brand uppercase">{faq.eyebrow}</p>}
          <h2 className="mt-4 text-[2rem] leading-[1.05] font-bold text-balance text-brand lg:text-[2.75rem] xl:text-5xl">
            {faq.title} {faq.highlight && <span className="text-accent">{faq.highlight}</span>}
          </h2>
          {faq.text && <p className="mt-5 max-w-md text-base text-brand lg:text-lg">{faq.text}</p>}
          <Link
            href={faq.ctaUrl}
            className="group/faq mt-8 inline-flex h-12 items-center gap-2 rounded-pill bg-brand px-6 font-semibold text-white transition-colors hover:bg-brand-hover"
          >
            {faq.ctaLabel}
            <ArrowRightIcon
              className="size-4 transition-transform group-hover/faq:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}

// Foto que ocupa un lado de la columna y se desvanece hacia el texto (abajo en móvil).
function FadedPhoto({
  src,
  alt,
  side,
  position = "object-center",
}: {
  src: string;
  alt: string;
  side: "left" | "right";
  position?: string;
}) {
  const mask =
    side === "left"
      ? "lg:[mask-image:linear-gradient(to_right,black_35%,transparent_80%)]"
      : "lg:[mask-image:linear-gradient(to_left,black_35%,transparent_80%)]";
  return (
    <div
      className={`absolute inset-x-0 top-0 -z-10 h-64 [mask-image:linear-gradient(to_bottom,black_45%,transparent)] lg:inset-y-0 lg:h-auto lg:w-[65%] ${side === "left" ? "lg:right-auto lg:left-0" : "lg:right-0 lg:left-auto"} ${mask}`}
    >
      <Image src={src} alt={alt} fill sizes="(min-width: 1024px) 33vw, 100vw" className={`object-cover ${position}`} />
    </div>
  );
}
