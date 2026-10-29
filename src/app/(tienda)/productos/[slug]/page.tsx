import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ExternalLinkIcon } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { ProductMain } from "@/components/product/product-main";
import { Breadcrumbs } from "@/components/store/breadcrumbs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getProductBySlug, getProductSlugs, getRelatedProducts, type ProductDetail } from "@/lib/products";
import { storeConfig } from "@/lib/store-config";

export async function generateStaticParams() {
  return (await getProductSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/productos/[slug]">): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return { title: "Producto no encontrado | Mi Terza" };
  return {
    title: `${product.name} | Mi Terza`,
    description: product.description[0],
    openGraph: product.images[0] ? { images: [{ url: product.images[0].url, alt: product.images[0].alt }] } : undefined,
  };
}

// El contenido lee `params`, así que va en <Suspense>: al navegar entre productos se muestra
// el esqueleto al instante en lugar de esperar al servidor.
export default function ProductPage({ params }: PageProps<"/productos/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductContent params={params} />
    </Suspense>
  );
}

async function ProductContent({ params }: Pick<PageProps<"/productos/[slug]">, "params">) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();
  const related = await getRelatedProducts(product);
  const categorySlug = product.category.toLowerCase();

  return (
    <div className="container pt-5 pb-16 lg:pt-8 lg:pb-24">
      <ProductJsonLd product={product} />

      <Breadcrumbs
        items={[
          { label: "Productos", href: "/productos" },
          { label: product.category, href: `/productos?categoria=${categorySlug}` },
          { label: product.line, href: `/productos?categoria=${product.line.toLowerCase()}` },
          { label: product.name },
        ]}
      />

      <div className="mt-4 lg:mt-6">
        <ProductMain product={product} />
      </div>

      <section aria-label="Información del producto" className="mt-12 max-w-3xl lg:mt-16">
        <Accordion type="multiple" defaultValue={["descripcion"]} className="border-t border-line">
          <AccordionItem value="descripcion" className="border-line">
            <AccordionTrigger className="min-h-14 items-center py-0 text-lg font-semibold text-heading hover:no-underline">
              Descripción
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-5 text-base">
              {product.description.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="caracteristicas" className="border-line">
            <AccordionTrigger className="min-h-14 items-center py-0 text-lg font-semibold text-heading hover:no-underline">
              Características
            </AccordionTrigger>
            <AccordionContent className="pb-5 text-base">
              <dl className="divide-y divide-line rounded-card border border-line">
                {product.features.map((feature) => (
                  <div key={feature.label} className="grid gap-1 px-4 py-3 sm:grid-cols-3 sm:gap-4">
                    <dt className="font-medium text-heading">{feature.label}</dt>
                    <dd className="sm:col-span-2">{feature.value}</dd>
                  </div>
                ))}
              </dl>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="envios" className="border-line">
            <AccordionTrigger className="min-h-14 items-center py-0 text-lg font-semibold text-heading hover:no-underline">
              Envíos y devoluciones
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-5 text-base [&_a]:text-brand">
              <p>
                Consulta las condiciones en nuestra <Link href="/politicas/devoluciones">política de devoluciones</Link> y en
                la <Link href="/politicas/cancelacion">política de cancelación</Link>.
              </p>
              <p>
                ¿Tienes otra duda? Revisa las <Link href="/preguntas-frecuentes">preguntas frecuentes</Link> o llámanos al{" "}
                <a href={storeConfig.supportPhoneHref}>{storeConfig.supportPhone}</a>.
              </p>
            </AccordionContent>
          </AccordionItem>

          {product.installVideoUrl && (
            <AccordionItem value="instalacion" className="border-line">
              <AccordionTrigger className="min-h-14 items-center py-0 text-lg font-semibold text-heading hover:no-underline">
                Medidas e instalación
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-5 text-base">
                <p>Mira paso a paso cómo medir tu ventana e instalar tu persiana {product.line}.</p>
                <a
                  href={product.installVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-tap items-center gap-2 font-semibold text-brand no-underline hover:underline"
                >
                  Ver tutorial en YouTube
                  <ExternalLinkIcon className="size-4" aria-hidden="true" />
                  <span className="sr-only">(se abre en otra pestaña)</span>
                </a>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </section>

      {related.length > 0 && (
        <section aria-labelledby="relacionados" className="mt-16 lg:mt-20">
          <h2 id="relacionados" className="mb-6 text-2xl font-bold lg:mb-8 lg:text-[2rem]">
            También te puede interesar
          </h2>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 lg:gap-x-6">
            {related.map((item) => (
              <li key={item.slug} className="flex">
                <ProductCard product={item} sizes="(min-width: 768px) 25vw, 50vw" />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="container pt-5 pb-16 lg:pt-8" aria-busy="true" aria-label="Cargando producto">
      <div className="h-4 w-48 animate-pulse rounded bg-muted" />
      <div className="mt-4 lg:mt-6 lg:grid lg:grid-cols-12 lg:gap-12">
        <div className="aspect-[4/5] animate-pulse rounded-card bg-muted lg:col-span-7 lg:aspect-square" />
        <div className="mt-6 space-y-4 lg:col-span-5 lg:mt-0">
          <div className="h-3 w-32 animate-pulse rounded bg-muted" />
          <div className="h-8 w-4/5 animate-pulse rounded bg-muted" />
          <div className="h-8 w-1/3 animate-pulse rounded bg-muted" />
          <div className="flex gap-3 pt-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="size-tap animate-pulse rounded-full bg-muted" />
            ))}
          </div>
          <div className="h-12 animate-pulse rounded-pill bg-muted" />
        </div>
      </div>
    </div>
  );
}

// Datos estructurados para resultados enriquecidos de Google (precio y disponibilidad).
function ProductJsonLd({ product }: { product: ProductDetail }) {
  const prices = product.variants.map((v) => v.price);
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description.join(" "),
    image: product.images.map((img) => `${storeConfig.siteUrl}${img.url}`),
    brand: { "@type": "Brand", name: "Terza" },
    category: `${product.category} > ${product.line}`,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "MXN",
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: product.variants.length,
      availability: product.variants.some((v) => v.stock > 0)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${storeConfig.siteUrl}/productos/${product.slug}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      // Se escapa "<" para que el contenido no pueda cerrar la etiqueta <script>.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
