import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getPolicy } from "@/lib/pages";

// Sin generateStaticParams: con Cache Components una lista vacía (base sin políticas aún) rompe
// el build. La página se resuelve al pedirla, dentro de <Suspense>, y getPolicy tiene caché.

export async function generateMetadata({ params }: PageProps<"/politicas/[slug]">): Promise<Metadata> {
  const page = await getPolicy((await params).slug);
  if (!page) return { title: "Página no encontrada | Mi Terza" };
  return {
    title: `${page.seoTitle ?? page.title} | Mi Terza`,
    description: page.seoDescription ?? undefined,
  };
}

// Estilos del texto legal: títulos de sección en verde, subtítulos, listas y las leyendas de
// consentimiento ("No consiento…") en un recuadro (<p class="note">) para que se distingan.
const proseClass = [
  "mx-auto max-w-3xl text-base leading-relaxed text-body",
  "[&_p]:mt-4 [&_p:first-child]:mt-0",
  "[&_h2]:mt-12 [&_h2]:border-t [&_h2]:border-line [&_h2]:pt-8 [&_h2]:text-2xl [&_h2]:leading-tight [&_h2]:font-bold [&_h2]:text-brand",
  "[&_h3]:mt-8 [&_h3]:text-lg [&_h3]:leading-snug [&_h3]:font-semibold [&_h3]:text-heading",
  "[&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_li]:marker:text-brand",
  "[&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:space-y-3 [&_ol]:pl-6 [&_ol>li]:marker:font-bold [&_li_ul]:mt-2",
  "[&_strong]:font-semibold [&_strong]:text-heading",
  "[&_figure]:mt-6 [&_img]:h-auto [&_img]:w-full [&_img]:max-w-2xl [&_img]:rounded-lg [&_img]:border [&_img]:border-line",
  "[&_a]:font-semibold [&_a]:break-words [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:no-underline",
  "[&_.note]:rounded-xl [&_.note]:border-l-4 [&_.note]:border-accent [&_.note]:bg-mist [&_.note]:px-5 [&_.note]:py-4 [&_.note]:font-medium [&_.note]:text-heading",
].join(" ");

export default function PolicyRoute({ params }: PageProps<"/politicas/[slug]">) {
  return (
    <Suspense fallback={<PolicySkeleton />}>
      <PolicyContent params={params} />
    </Suspense>
  );
}

async function PolicyContent({ params }: Pick<PageProps<"/politicas/[slug]">, "params">) {
  const page = await getPolicy((await params).slug);
  if (!page) notFound();

  const updated = new Intl.DateTimeFormat("es-MX", { dateStyle: "long" }).format(page.updatedAt);

  return (
    <>
      <section className="bg-brand text-white">
        {/* Misma columna centrada que el texto, para que el título quede alineado con él. */}
        <div className="container py-14 lg:py-20 [&>*]:mx-auto [&>*]:max-w-3xl">
          <p className="text-sm font-bold tracking-widest text-accent uppercase">Políticas</p>
          <h1 className="mt-4 text-[2.5rem] leading-[1.05] font-bold text-balance text-white lg:text-6xl">
            {page.title}
          </h1>
          <p className="mt-5 text-sm text-white/75">Última actualización: {updated}</p>
        </div>
      </section>

      <div className="container py-12 lg:py-20">
        {/* El HTML viene de la base: del seed o del editor del panel, que lo guarda saneado. */}
        <article className={proseClass} dangerouslySetInnerHTML={{ __html: page.content }} />
      </div>
    </>
  );
}

function PolicySkeleton() {
  return (
    <>
      <div className="h-64 bg-brand lg:h-80" />
      <div className="container max-w-3xl space-y-3 py-12 lg:py-20">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-4 animate-pulse rounded bg-muted" />
        ))}
      </div>
    </>
  );
}
