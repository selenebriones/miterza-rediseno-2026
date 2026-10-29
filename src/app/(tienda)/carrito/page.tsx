import type { Metadata } from "next";
import { CartPage } from "@/components/cart/cart-page";
import { getCategoryTree } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Tu carrito | Mi Terza",
  robots: { index: false, follow: true },
};

// El contenido vive en el navegador (localStorage) y se valida contra la base al abrir la página.
export default async function CartRoute() {
  const categories = await getCategoryTree();
  return <CartPage categories={categories.map(({ slug, name }) => ({ slug, name }))} />;
}
