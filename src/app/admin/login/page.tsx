import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/header/logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex justify-center">
          <Logo tone="color" className="h-10" />
        </div>
        <div className="mt-8 rounded-card bg-white p-6 shadow-card sm:p-8">
          <h1 className="text-2xl font-bold">Panel de administración</h1>
          <p className="mt-1 text-sm">Entra con tu correo y contraseña.</p>
          <div className="mt-6">
            <Suspense fallback={<LoginForm returnTo="/admin" />}>
              <LoginWithReturn searchParams={searchParams} />
            </Suspense>
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
