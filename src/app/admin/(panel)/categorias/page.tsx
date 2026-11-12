import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EyeIcon, FolderTreeIcon, PencilIcon, PlusIcon } from "lucide-react";
import { deleteCategory } from "./actions";
import { ACTION, ACTION_OFF, DeleteRowButton } from "@/components/admin/row-actions";
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
            <th scope="col" className="text-right">
              Acciones
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
              <td className="w-px whitespace-nowrap">
                <div className="flex justify-end gap-2">
                  {c.isVisible ? (
                    <a
                      href={`/productos?categoria=${c.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Ver ${c.name} en la tienda (se abre en otra pestaña)`}
                      title="Ver en la tienda"
                      className={ACTION}
                    >
                      <EyeIcon className="size-[18px]" aria-hidden="true" />
                    </a>
                  ) : (
                    <span aria-hidden="true" title="No se ve en la tienda porque está oculta" className={cn(ACTION, ACTION_OFF)}>
                      <EyeIcon className="size-[18px]" />
                    </span>
                  )}
                  <Link href={`/admin/categorias/${c.id}`} aria-label={`Editar ${c.name}`} title="Editar" className={ACTION}>
                    <PencilIcon className="size-[18px]" aria-hidden="true" />
                  </Link>
                  <DeleteRowButton
                    id={c.id}
                    name={c.name}
                    title="¿Eliminar esta categoría?"
                    description="Se quita del catálogo y del menú de la tienda. No se puede deshacer."
                    action={deleteCategory}
                    disabledReason={
                      c.productCount > 0
                        ? "tiene productos; muévelos a otra categoría primero"
                        : categories.some((other) => other.parentId === c.id)
                          ? "tiene subcategorías; elimínalas o muévelas primero"
                          : undefined
                    }
                  />
                </div>
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
    <span className={cn("insignia", value ? "exito" : "gris")}>
      {value ? "Sí" : "No"}
    </span>
  );
}
