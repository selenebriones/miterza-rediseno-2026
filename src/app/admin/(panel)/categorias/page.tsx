import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FolderTreeIcon, PlusIcon } from "lucide-react";
import { listCategories } from "@/lib/admin/categories";
import { requirePermission } from "@/lib/admin/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Categorías" };

export default function CategoriesPage() {
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[1.75rem] leading-tight font-bold lg:text-[2rem]">Categorías</h1>
        <Link
          href="/admin/categorias/nuevo"
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-pill bg-brand px-4 font-semibold text-white hover:bg-brand-hover"
        >
          <PlusIcon className="size-4" aria-hidden="true" />
          Nueva categoría
        </Link>
      </div>
      <Suspense fallback={<div className="mt-6 h-80 animate-pulse rounded-card bg-white" aria-busy="true" />}>
        <Categories />
      </Suspense>
    </div>
  );
}

async function Categories() {
  await requirePermission("MANAGE_CATALOG");
  const categories = await listCategories();

  if (categories.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center rounded-card bg-white px-6 py-14 text-center shadow-card">
        <FolderTreeIcon className="size-10 text-brand" aria-hidden="true" />
        <h2 className="mt-3 text-lg font-bold">Aún no hay categorías</h2>
        <p className="mt-1 text-sm">Crea la primera con el botón de arriba; los productos necesitan al menos una.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-hidden rounded-card bg-white shadow-card">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line bg-white text-xs tracking-wide text-muted-foreground uppercase">
          <tr>
            <th scope="col" className="px-5 py-3 font-semibold">
              Nombre
            </th>
            <th scope="col" className="px-5 py-3 font-semibold">
              Padre
            </th>
            <th scope="col" className="px-5 py-3 font-semibold">
              Productos
            </th>
            <th scope="col" className="px-5 py-3 font-semibold">
              Visible
            </th>
            <th scope="col" className="px-5 py-3 font-semibold">
              En home
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {categories.map((c) => (
            <tr key={c.id} className="relative transition-colors hover:bg-surface has-[a:focus-visible]:bg-surface">
              <td className="px-5 py-4">
                <Link
                  href={`/admin/categorias/${c.id}`}
                  className="font-semibold text-brand after:absolute after:inset-0 focus-visible:outline-none"
                >
                  {c.name}
                </Link>
                <span className="block text-xs text-muted-foreground">{c.slug}</span>
              </td>
              <td className="px-5 py-4">{c.parentName ?? "—"}</td>
              <td className="px-5 py-4">{c.productCount}</td>
              <td className="px-5 py-4">
                <Dot value={c.isVisible} />
              </td>
              <td className="px-5 py-4">
                <Dot value={c.showInHome} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Dot({ value }: { value: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        value ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-zinc-100 text-zinc-700 ring-zinc-200",
      )}
    >
      {value ? "Sí" : "No"}
    </span>
  );
}
