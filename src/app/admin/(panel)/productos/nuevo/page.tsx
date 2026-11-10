import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeftIcon } from "lucide-react";
import { createProduct } from "@/app/admin/(panel)/productos/actions";
import { ProductForm } from "@/components/admin/products/product-form";
import { listCategoryOptions } from "@/lib/admin/categories";
import { requirePermission } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Nuevo producto" };

export default function NewProductPage() {
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
        <NewProduct />
      </Suspense>
    </div>
  );
}

async function NewProduct() {
  await requirePermission("MANAGE_CATALOG");
  const categories = await listCategoryOptions();

  return (
    <>
      <h1 className="mt-2 text-[1.75rem] leading-tight font-bold lg:text-[2rem]">Nuevo producto</h1>
      <ProductForm mode="create" categories={categories} action={createProduct} />
    </>
  );
}
