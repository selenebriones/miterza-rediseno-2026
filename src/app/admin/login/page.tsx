import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/header/logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px]">
        {/* Tarjeta con el logo sobre la franja verde, como la entrada del panel de terza-sitio. */}
        <div className="overflow-hidden rounded-card bg-white shadow-card">
          <div className="grid place-items-center bg-brand px-6 py-8">
            <Logo href="/" className="h-10 lg:h-10" />
          </div>
          <div className="p-8">
            <h1 className="text-center !text-xl font-bold">Panel de administración</h1>
            <p className="mt-2 text-center text-sm">Entra con tu correo y contraseña.</p>
            <div className="mt-6">
              <Suspense fallback={<LoginForm returnTo="/admin" />}>
                <LoginWithReturn searchParams={searchParams} />
              </Suspense>
            </div>
          </div>
        </div>
        <p className="mt-6 text-center text-sm">
          <Link href="/" className="font-medium text-brand hover:underline">
            Volver a la tienda
          </Link>
        </p>
      </div>
    </div>
  );
}

async function LoginWithReturn({ searchParams }: Pick<PageProps<"/admin/login">, "searchParams">) {
  const desde = (await searchParams).desde;
  return <LoginForm returnTo={typeof desde === "string" ? desde : "/admin"} />;
}
