import { Suspense } from "react";
import { CartProvider } from "@/components/cart/cart-provider";
import { SiteFooter } from "@/components/footer/site-footer";
import { SiteHeader } from "@/components/header/site-header";
import { UserBar } from "@/components/header/user-bar";

// Layout de la tienda pública. El panel (/admin) tendrá su propio layout sin este header.
// La franja del usuario lee la sesión (dinámica): va en <Suspense> para no frenar el resto.
export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <CartProvider>
      <Suspense fallback={null}>
        <UserBar />
      </Suspense>
      <SiteHeader />
      <main id="contenido" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <SiteFooter />
    </CartProvider>
  );
}
