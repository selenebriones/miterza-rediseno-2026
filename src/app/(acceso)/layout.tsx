import Link from "next/link";
import { Logo } from "@/components/header/logo";
import { storeConfig } from "@/lib/store-config";

// Ingresar, crear cuenta y recuperar contraseña: solo el logo y la tarjeta del formulario
// (como miterza.com), sin menú ni buscador que distraigan.
export default function AccessLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="contenido" tabIndex={-1} className="flex flex-1 flex-col items-center bg-cream px-4 py-10 outline-none lg:py-16">
      <Logo tone="color" className="h-14 lg:h-20" />
      <div className="mt-10 w-full max-w-lg lg:mt-12">{children}</div>
      <p className="mt-8 text-center text-sm">
        ¿Necesitas ayuda?{" "}
        <a href={storeConfig.supportPhoneHref} className="font-semibold text-brand hover:underline">
          {storeConfig.supportPhone}
        </a>
        {" · "}
        <Link href="/" className="font-semibold text-brand hover:underline">
          Volver a la tienda
        </Link>
      </p>
    </main>
  );
}
