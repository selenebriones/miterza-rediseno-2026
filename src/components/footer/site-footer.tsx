import Link from "next/link";
import { MailIcon, PhoneIcon } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Logo } from "@/components/header/logo";
import { getFooterNavigation } from "@/lib/navigation";
import { storeConfig } from "@/lib/store-config";
import { SocialIcon } from "./social-icons";

const linkClass =
  "inline-flex min-h-tap items-center text-white/80 transition-colors hover:text-white hover:underline hover:underline-offset-4 lg:min-h-9";

// Con Cache Components, `new Date()` debe ir en una función cacheada para poder prerenderizar.
async function getCurrentYear() {
  "use cache";
  return new Date().getFullYear();
}

export async function SiteFooter() {
  const [groups, year] = await Promise.all([getFooterNavigation(), getCurrentYear()]);

  return (
    <footer className="mt-auto bg-brand text-white/80">
      <div className="container grid gap-10 py-12 lg:grid-cols-12 lg:gap-8 lg:py-16">
        {/* Marca y contacto: siempre visibles, es lo que más se busca en el footer. */}
        <div className="space-y-6 lg:col-span-4">
          <Logo className="h-10 lg:h-12" />
          <p className="max-w-sm text-sm">
            En Terza somos la empresa más importante en México y Latinoamérica en la producción y comercialización de
            superficies, con más de 40 años de respaldo en el mercado.
          </p>

          <div>
            <h2 className="text-base font-semibold text-white">¿Necesitas ayuda?</h2>
            <ul className="mt-1">
              <li>
                <a href={storeConfig.supportPhoneHref} className={`${linkClass} gap-2`}>
                  <PhoneIcon className="size-4 text-accent" aria-hidden="true" />
                  {storeConfig.supportPhone}
                </a>
              </li>
              <li>
                <a href={`mailto:${storeConfig.supportEmail}`} className={`${linkClass} gap-2`}>
                  <MailIcon className="size-4 text-accent" aria-hidden="true" />
                  {storeConfig.supportEmail}
                </a>
              </li>
            </ul>
          </div>

          <ul className="flex gap-2" aria-label="Redes sociales">
            {storeConfig.social.map((item) => (
              <li key={item.network}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Terza en ${item.label} (se abre en otra pestaña)`}
                  className="grid size-tap place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-accent hover:text-brand"
                >
                  <SocialIcon network={item.network} className="size-5" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav aria-label="Pie de página" className="lg:col-span-8">
          {/* Móvil: acordeón para no ocupar dos pantallas de scroll. */}
          <Accordion type="multiple" className="border-t border-white/15 lg:hidden">
            {groups.map((group) => (
              <AccordionItem key={group.id} value={group.id} className="border-white/15 not-last:border-b">
                <AccordionTrigger className="min-h-14 items-center rounded-none py-0 text-base font-semibold text-white hover:no-underline **:data-[slot=accordion-trigger-icon]:size-5 **:data-[slot=accordion-trigger-icon]:text-white/70">
                  {group.title}
                </AccordionTrigger>
                <AccordionContent className="pb-3 [&_a]:no-underline">
                  <ul>
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <Link href={item.href} className={linkClass}>
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Desktop: columnas abiertas. */}
          <div className="hidden grid-cols-3 gap-8 lg:grid">
            {groups.map((group) => (
              <div key={group.id}>
                <h2 className="text-sm font-semibold tracking-wide text-white uppercase">{group.title}</h2>
                <ul className="mt-4">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <Link href={item.href} className={linkClass}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>
      </div>

      <div className="border-t border-white/15">
        <p className="container py-6 text-sm">© {year} Terza. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
