import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductCard } from "@/components/product/product-card";
import { ProductMain } from "@/components/product/product-main";
import { Breadcrumbs } from "@/components/store/breadcrumbs";
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
    <>
      <div className="container pt-5 pb-16 lg:pt-8 lg:pb-24">
        <ProductJsonLd product={product} />

        <Breadcrumbs
          items={[
            { label: "Productos", href: "/productos" },
            { label: product.category, href: `/productos?categoria=${categorySlug}` },
            { label: product.line, href: `/productos?categoria=${product.lineSlug}` },
            { label: product.name },
          ]}
        />

        <div className="mt-4 lg:mt-6">
          <ProductMain product={product} />
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="relacionados" className="bg-mist py-14 lg:py-20">
          <div className="container">
            <h2 id="relacionados" className="mb-6 text-2xl font-bold lg:mb-8 lg:text-[2rem]">
              También te puede interesar
            </h2>
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-6">
              {related.map((item) => (
                <li key={item.slug} className="flex">
                  <ProductCard product={item} sizes="(min-width: 768px) 25vw, 50vw" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
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
