import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeftIcon } from "lucide-react";
import { updateProduct } from "@/app/admin/(panel)/productos/actions";
import { ProductForm } from "@/components/admin/products/product-form";
import { listCategoryOptions } from "@/lib/admin/categories";
import { getProductForEdit } from "@/lib/admin/products";
import { requirePermission } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Editar producto" };

export default function EditProductPage({ params }: PageProps<"/admin/productos/[id]">) {
  return (
    <div className="mt-2">
      <Link
        href="/admin/productos"
        className="inline-flex min-h-tap items-center gap-2 text-sm font-semibold text-brand hover:underline"
      >
        <ArrowLeftIcon className="size-4" aria-hidden="true" />
        Productos
      </Link>
      <Suspense fallback={<div className="mt-4 h-96 animate-pulse rounded-card bg-white" aria-busy="true" />}>
        <EditProduct params={params} />
      </Suspense>
    </div>
  );
}

async function EditProduct({ params }: Pick<PageProps<"/admin/productos/[id]">, "params">) {
  await requirePermission("MANAGE_CATALOG");
  const { id } = await params;
  const [product, categories] = await Promise.all([getProductForEdit(id), listCategoryOptions()]);
  if (!product) notFound();

  return (
    <>
      <h1 className="mt-2 text-[1.75rem] leading-tight font-bold lg:text-[2rem]">{product.name}</h1>
      <ProductForm mode="edit" initial={product} categories={categories} action={updateProduct} />
    </>
  );
}
