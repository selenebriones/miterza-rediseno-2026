import type { Metadata } from "next";
import Image from "next/image";
import { MailIcon, PhoneIcon } from "lucide-react";
import { FaqAnswer } from "@/components/store/faq-answer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getFaq } from "@/lib/faq";
import { storeConfig } from "@/lib/store-config";

export const metadata: Metadata = {
  title: "Preguntas frecuentes | Mi Terza",
  description:
    "Resolvemos tus dudas sobre persianas: tipos, medición, instalación, limpieza, garantías, devoluciones y envíos.",
};

// Encabezado verde oscuro con el remate en lima (como la banda de ayuda del home), las preguntas
// en acordeón agrupadas por categoría y, a un lado, el contacto para quien no encontró su respuesta.
export default async function FaqPage() {
  const groups = await getFaq();
  const showGroupTitles = groups.length > 1;

  return (
    <>
      <section className="bg-brand text-white">
        <div className="container py-14 lg:py-20">
          <p className="text-sm font-bold tracking-widest text-accent uppercase">Preguntas frecuentes</p>
          <h1 className="mt-4 text-[2.5rem] leading-[1.05] font-bold text-balance text-white lg:text-6xl">
            Resolvemos tus <span className="text-accent">dudas.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-white/85 lg:text-lg">
            Encuentra respuestas rápidas antes de hacer tu pedido. Si no ves la tuya, escríbenos o llámanos.
          </p>
        </div>
      </section>

      <div className="container grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16 lg:py-20">
        <div className="space-y-12">
          {groups.length === 0 && <p>Pronto publicaremos las preguntas frecuentes.</p>}
          {groups.map((group) => (
            <section key={group.slug} aria-labelledby={showGroupTitles ? `faq-${group.slug}` : undefined}>
              {showGroupTitles && (
                <h2 id={`faq-${group.slug}`} className="mb-4 text-2xl font-bold text-heading">
                  {group.name}
                </h2>
              )}
              <Accordion type="multiple" className="border-t border-line">
                {group.items.map((item) => (
                  <AccordionItem key={item.id} value={item.id} className="border-b border-line">
                    <AccordionTrigger className="gap-6 rounded-none py-5 text-lg font-semibold text-heading hover:no-underline hover:text-brand lg:text-xl **:data-[slot=accordion-trigger-icon]:mt-1 **:data-[slot=accordion-trigger-icon]:size-5 **:data-[slot=accordion-trigger-icon]:text-brand">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="max-w-3xl pb-6 text-base text-body">
                      <FaqAnswer text={item.answer} />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>

        <aside className="lg:sticky lg:top-32 lg:self-start">
          {/* Igual que el bloque "Contáctanos" de terza-sitio: degradado de verde pálido a lima y la foto
              del equipo abajo, desvanecida hacia el texto. */}
          <div className="relative isolate flex min-h-[38rem] flex-col overflow-hidden rounded-card bg-[linear-gradient(to_right,#f7fbe2_0%,#f7fbe2_35%,#e3f38f_55%,#c9ea2c_75%,#c2e812_100%)] p-8 text-brand">
            <Image
              src="/faq/equipo-terza.webp"
              alt="Colaborador de Terza en la planta, junto a una tarima de producto"
              width={1200}
              height={800}
              sizes="(min-width: 1024px) 22rem, 100vw"
              className="absolute inset-x-0 bottom-0 -z-10 h-[50%] w-full object-cover object-[30%_30%] [mask-image:linear-gradient(to_top,black_0%,black_60%,transparent_100%)]"
            />
            <p className="text-xs font-bold tracking-widest uppercase">Contáctanos</p>
            <h2 className="mt-2 text-3xl leading-[1.15] font-bold text-brand">¿En qué podemos ayudarte?</h2>
            <p className="mt-3 text-sm">
              Ya sea que estés transformando un espacio o desarrollando un proyecto, estamos aquí para asesorarte.
            </p>
            <div className="mt-6 flex flex-col items-start gap-3">
              <a
                href={storeConfig.supportPhoneHref}
                className="inline-flex h-11 items-center gap-2 rounded-pill bg-brand px-6 font-semibold text-white transition-colors hover:bg-brand-dark"
              >
                <PhoneIcon className="size-4" aria-hidden="true" />
                {storeConfig.supportPhone}
              </a>
              <a
                href={`mailto:${storeConfig.supportEmail}`}
                className="inline-flex h-11 items-center gap-2 rounded-pill border-2 border-brand bg-white/60 px-6 font-semibold transition-colors hover:bg-brand hover:text-white"
              >
                <MailIcon className="size-4" aria-hidden="true" />
                {storeConfig.supportEmail}
              </a>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
