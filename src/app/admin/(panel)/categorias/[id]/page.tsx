import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeftIcon } from "lucide-react";
import { updateCategory } from "@/app/admin/(panel)/categorias/actions";
import { CategoryForm } from "@/components/admin/categories/category-form";
import { getCategory, listCategories } from "@/lib/admin/categories";
import { requirePermission } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Editar categoría" };

export default function EditCategoryPage({ params }: PageProps<"/admin/categorias/[id]">) {
  return (
    <div className="mt-2">
      <Link
        href="/admin/categorias"
        className="inline-flex min-h-tap items-center gap-2 text-sm font-semibold text-brand hover:underline"
      >
        <ArrowLeftIcon className="size-4" aria-hidden="true" />
        Categorías
      </Link>
      <Suspense fallback={<div className="mt-4 h-96 animate-pulse rounded-card bg-white" aria-busy="true" />}>
        <EditCategory params={params} />
      </Suspense>
    </div>
  );
}

async function EditCategory({ params }: Pick<PageProps<"/admin/categorias/[id]">, "params">) {
  await requirePermission("MANAGE_CATALOG");
  const { id } = await params;
  const [category, parentOptions] = await Promise.all([getCategory(id), listCategories()]);
  if (!category) notFound();

  return (
    <>
      <h1 className="mt-2 text-[1.75rem] leading-tight font-bold lg:text-[2rem]">{category.name}</h1>
      <CategoryForm mode="edit" initial={category} parentOptions={parentOptions} action={updateCategory} />
    </>
  );
}
