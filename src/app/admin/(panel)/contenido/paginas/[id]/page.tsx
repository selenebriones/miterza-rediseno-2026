import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeftIcon } from "lucide-react";
import { PageContentForm } from "@/components/admin/content/page-content-form";
import { getEditablePage } from "@/lib/admin/content";
import { requirePermission } from "@/lib/admin/session";
import { sanitizePolicyHtml } from "@/lib/policy-html";

export const metadata: Metadata = { title: "Editar página con contenido" };

export default function EditPageContent({ params }: PageProps<"/admin/contenido/paginas/[id]">) {
  return <Suspense fallback={<div className="mt-6 h-96 animate-pulse rounded-card bg-white" aria-busy="true" />}><EditPageData params={params} /></Suspense>;
}

async function EditPageData({ params }: Pick<PageProps<"/admin/contenido/paginas/[id]">, "params">) {
  await requirePermission("MANAGE_CONTENT");
  const page = await getEditablePage((await params).id);
  if (!page) notFound();
  return <div className="mt-2">
    <Link href="/admin/contenido/footer" className="inline-flex items-center gap-2 text-sm font-semibold text-brand"><ArrowLeftIcon className="size-4" />Volver a Footer</Link>
    <h1 className="mt-4 text-[1.75rem] leading-tight font-bold lg:text-[2rem]">Editar página</h1>
    <p className="mt-1 max-w-2xl text-sm">Edita el texto que se publica en la ruta de esta página. Su dirección permanece estable para no romper los enlaces.</p>
    <PageContentForm page={{ ...page, content: sanitizePolicyHtml(page.content) }} />
  </div>;
}
