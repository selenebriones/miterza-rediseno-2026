import { AwardIcon, HeadsetIcon, PaletteIcon, ShieldCheckIcon, TruckIcon, type LucideIcon } from "lucide-react";
import type { ValuePropItem } from "@/lib/home";
import { storeConfig } from "@/lib/store-config";

// Íconos disponibles para los elementos de HomeSection.settings.items (VALUE_PROPOSITION).
const ICONS: Record<string, LucideIcon> = {
  "shield-check": ShieldCheckIcon,
  award: AwardIcon,
  palette: PaletteIcon,
  headset: HeadsetIcon,
  truck: TruckIcon,
};

export function ValueProposition({ title, items }: { title: string | null; items: ValuePropItem[] }) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="propuesta-valor" className="bg-surface">
      <h2 id="propuesta-valor" className="sr-only">
        {title ?? "Por qué comprar en Mi Terza"}
      </h2>
      {/* Móvil 2×2: todo visible sin deslizar. Desktop: una franja de 4. */}
      <ul className="container grid grid-cols-2 gap-x-4 gap-y-6 py-8 lg:grid-cols-4 lg:gap-8 lg:py-10">
        {items.map((item) => {
          const Icon = ICONS[item.icon] ?? ShieldCheckIcon;
          return (
            <li key={item.title} className="flex flex-col gap-2 lg:flex-row lg:gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-brand shadow-card">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold text-heading">{item.title}</p>
                <p className="mt-0.5 text-sm">
                  {item.text}
                  {item.showPhone && (
                    <>
                      {" "}
                      <a
                        href={storeConfig.supportPhoneHref}
                        className="font-semibold whitespace-nowrap text-brand underline-offset-2 hover:underline"
                      >
                        {storeConfig.supportPhone}
                      </a>
                    </>
                  )}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
