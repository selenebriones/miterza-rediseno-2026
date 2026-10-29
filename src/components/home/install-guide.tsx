import Image from "next/image";
import { ExternalLinkIcon, PhoneIcon, PlayIcon } from "lucide-react";
import type { InstallTutorial } from "@/lib/home";
import { storeConfig } from "@/lib/store-config";

type Props = {
  title: string;
  subtitle: string | null;
  tutorials: InstallTutorial[];
};

// Quita la principal objeción al comprar persianas en línea: "¿y si mido mal?".
// Los videos abren en YouTube; no se carga el reproductor en el home.
export function InstallGuide({ title, subtitle, tutorials }: Props) {
  return (
    <section aria-labelledby="guia-instalacion" className="bg-surface">
      <div className="container grid gap-8 py-12 lg:grid-cols-12 lg:items-center lg:gap-12 lg:py-20">
        <div className="lg:col-span-4">
          <h2 id="guia-instalacion" className="text-2xl leading-tight font-bold lg:text-[2rem]">
            {title}
          </h2>
          {subtitle && <p className="mt-3">{subtitle}</p>}
          <p className="mt-6 text-sm">¿Prefieres que te guiemos?</p>
          <a
            href={storeConfig.supportPhoneHref}
            className="mt-1 inline-flex min-h-tap items-center gap-2 font-semibold text-brand underline-offset-4 hover:underline"
          >
            <PhoneIcon className="size-4" aria-hidden="true" />
            Llámanos al {storeConfig.supportPhone}
          </a>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 lg:col-span-8 lg:gap-6">
          {tutorials.map((tutorial) => (
            <li key={tutorial.videoUrl + tutorial.title}>
              <a
                href={tutorial.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group/video block overflow-hidden rounded-card bg-white shadow-card transition-shadow hover:shadow-card-hover"
              >
                <span className="relative block aspect-video overflow-hidden">
                  <Image
                    src={tutorial.imageUrl}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-300 group-hover/video:scale-105"
                  />
                  <span className="absolute inset-0 grid place-items-center bg-black/15">
                    <span className="grid size-14 place-items-center rounded-full bg-white text-brand shadow-card transition-transform group-hover/video:scale-110">
                      <PlayIcon className="ml-0.5 size-6 fill-current" aria-hidden="true" />
                    </span>
                  </span>
                </span>
                <span className="flex items-center justify-between gap-3 p-4">
                  <span>
                    <span className="block font-semibold text-heading">{tutorial.title}</span>
                    <span className="block text-sm">Líneas {tutorial.lines}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-brand">
                    Ver video
                    <ExternalLinkIcon className="size-4" aria-hidden="true" />
                    <span className="sr-only">(se abre en YouTube)</span>
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
