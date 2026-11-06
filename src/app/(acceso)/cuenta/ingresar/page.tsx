import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "@/lib/session";
import { AuthCard } from "@/components/account/auth-ui";
import { LoginForm } from "@/components/account/login-form";
import { readReturnPath } from "@/lib/return-path";

export const metadata: Metadata = {
  title: "Iniciar sesión | Mi Terza",
  robots: { index: false, follow: true },
};

export default function LoginPage({ searchParams }: PageProps<"/cuenta/ingresar">) {
  return (
    <AuthCard title="Hola, bienvenido a Mi Terza" subtitle="Iniciar sesión">
      <Suspense fallback={<LoginForm returnTo="/cuenta" />}>
        <Login searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function Login({ searchParams }: Pick<PageProps<"/cuenta/ingresar">, "searchParams">) {
  const returnTo = readReturnPath((await searchParams).desde);
  if ((await getSession())?.user) redirect(returnTo); // ya tiene sesión
  return <LoginForm returnTo={returnTo} />;
}
