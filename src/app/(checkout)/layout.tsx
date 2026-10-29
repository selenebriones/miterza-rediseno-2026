import Link from "next/link";
import { LockIcon } from "lucide-react";
import { CartProvider } from "@/components/cart/cart-provider";
import { Logo } from "@/components/header/logo";
import { storeConfig } from "@/lib/store-config";

// Checkout sin menú, buscador ni footer completo: menos salidas, más pedidos completados.
export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <header className="border-b border-line bg-white">
        <div className="container flex h-16 items-center justify-between gap-4 lg:h-20">
          <Logo tone="color" className="h-9 lg:h-10" />
          <p className="flex items-center gap-2 text-sm font-semibold text-brand">
            <LockIcon className="size-4" aria-hidden="true" />
            Compra segura
          </p>
        </div>
      </header>
      <main id="contenido" tabIndex={-1} className="flex-1 bg-white outline-none">
        {children}
      </main>
      <footer className="border-t border-line">
        <div className="container flex flex-wrap items-center gap-x-6 gap-y-2 py-6 text-sm">
          <span>
            ¿Dudas con tu compra?{" "}
            <a href={storeConfig.supportPhoneHref} className="font-semibold text-brand hover:underline">
              {storeConfig.supportPhone}
            </a>
          </span>
          <Link href="/politicas/privacidad" className="hover:text-brand hover:underline">
            Aviso de privacidad
          </Link>
          <Link href="/politicas/devoluciones" className="hover:text-brand hover:underline">
            Devoluciones
          </Link>
        </div>
      </footer>
    </CartProvider>
  );
}
