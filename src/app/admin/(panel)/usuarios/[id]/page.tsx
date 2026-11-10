import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeftIcon } from "lucide-react";
import { updateAdministrator } from "@/app/admin/(panel)/usuarios/actions";
import { AdministratorForm } from "@/components/admin/users/administrator-form";
import { getAdministrator } from "@/lib/admin/administrators";
import { requirePermission } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Editar administrador" };

export default function EditAdministratorPage({ params }: PageProps<"/admin/usuarios/[id]">) {
  return (
    <div className="mt-2">
      <Link href="/admin/usuarios" className="inline-flex min-h-tap items-center gap-2 text-sm font-semibold text-brand hover:underline">
        <ArrowLeftIcon className="size-4" aria-hidden="true" />
        Administradores
      </Link>
      <Suspense fallback={<div className="mt-4 h-80 animate-pulse rounded-card bg-white" aria-busy="true" />}>
        <EditAdministrator params={params} />
      </Suspense>
    </div>
  );
}

async function EditAdministrator({ params }: Pick<PageProps<"/admin/usuarios/[id]">, "params">) {
  await requirePermission("SUPER_ADMIN");
  const administrator = await getAdministrator((await params).id);
  if (!administrator) notFound();

  return (
    <>
      <h1 className="mt-2 text-[1.75rem] leading-tight font-bold lg:text-[2rem]">{administrator.name ?? administrator.email}</h1>
      <AdministratorForm mode="edit" initial={administrator} action={updateAdministrator} />
    </>
  );
}
