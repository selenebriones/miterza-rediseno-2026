import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeftIcon } from "lucide-react";
import { createCategory } from "@/app/admin/(panel)/categorias/actions";
import { CategoryForm } from "@/components/admin/categories/category-form";
import { listCategories } from "@/lib/admin/categories";
import { requirePermission } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Nueva categoría" };

export default function NewCategoryPage() {
  return (
    <div className="mt-2">
      <Link
        href="/admin/categorias"
        className="inline-flex min-h-tap items-center gap-2 text-sm font-semibold text-brand hover:underline"
      >
        <ArrowLeftIcon className="size-4" aria-hidden="true" />
        Categorías
      </Link>
      <h1 className="mt-2 text-[1.75rem] leading-tight font-bold lg:text-[2rem]">Nueva categoría</h1>
      <Suspense fallback={<div className="mt-6 h-80 animate-pulse rounded-card bg-white" aria-busy="true" />}>
        <NewCategory />
      </Suspense>
    </div>
  );
}

async function NewCategory() {
  await requirePermission("MANAGE_CATALOG");
  const parentOptions = await listCategories();
  return <CategoryForm mode="create" parentOptions={parentOptions} action={createCategory} />;
}
