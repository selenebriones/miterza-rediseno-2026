import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeftIcon } from "lucide-react";
import { createAdministrator } from "@/app/admin/(panel)/usuarios/actions";
import { AdministratorForm } from "@/components/admin/users/administrator-form";
import { requirePermission } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Nuevo usuario" };

export default function NewAdministratorPage() {
  return (
    <div className="mt-2">
      <Link href="/admin/usuarios" className="inline-flex min-h-tap items-center gap-2 text-sm font-semibold text-brand hover:underline">
        <ArrowLeftIcon className="size-4" aria-hidden="true" />
        Usuarios
      </Link>
      <h1 className="mt-2 text-[1.75rem] leading-tight font-bold lg:text-[2rem]">Nuevo usuario del panel</h1>
      <Suspense fallback={<div className="mt-6 h-80 animate-pulse rounded-card bg-white" aria-busy="true" />}>
        <NewAdministrator />
      </Suspense>
    </div>
  );
}

async function NewAdministrator() {
  await requirePermission("SUPER_ADMIN");
  return <AdministratorForm mode="create" action={createAdministrator} />;
}
