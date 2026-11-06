import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "@/lib/session";
import { AuthCard } from "@/components/account/auth-ui";
import { RegisterForm } from "@/components/account/register-form";
import { readReturnPath } from "@/lib/return-path";

export const metadata: Metadata = {
  title: "Crear cuenta | Mi Terza",
  robots: { index: false, follow: true },
};

export default function RegisterPage({ searchParams }: PageProps<"/cuenta/registro">) {
  return (
    <AuthCard title="Hola, bienvenido a Mi Terza" subtitle="Crear cuenta">
      <Suspense fallback={<RegisterForm returnTo="/cuenta" />}>
        <Register searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function Register({ searchParams }: Pick<PageProps<"/cuenta/registro">, "searchParams">) {
  const returnTo = readReturnPath((await searchParams).desde);
  if ((await getSession())?.user) redirect(returnTo);
  return <RegisterForm returnTo={returnTo} />;
}
