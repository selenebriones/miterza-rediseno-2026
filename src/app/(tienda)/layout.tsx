import { CartProvider } from "@/components/cart/cart-provider";
import { SiteFooter } from "@/components/footer/site-footer";
import { SiteHeader } from "@/components/header/site-header";

// Layout de la tienda pública. El panel (/admin) tendrá su propio layout sin este header.
export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <CartProvider>
      <SiteHeader />
      <main id="contenido" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <SiteFooter />
    </CartProvider>
  );
}
