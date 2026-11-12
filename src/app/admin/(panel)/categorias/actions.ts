"use server";

import { redirect } from "next/navigation";
import { refresh, revalidateTag } from "next/cache";
import { isAllowedImageUrl } from "@/lib/admin/images";
import { authorize } from "@/lib/admin/session";
import { CACHE_TAGS, db } from "@/lib/db";

export type CategoryFormState = { status: "idle" | "error"; message?: string };

class CategoryFormError extends Error {}

function parseCore(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase().slice(0, 120);
  if (!name) throw new CategoryFormError("Escribe el nombre de la categoría.");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    throw new CategoryFormError("El slug solo puede tener minúsculas, números y guiones.");
  }
  const parentIdRaw = String(formData.get("parentId") ?? "");
  const parentId = /^[a-z0-9]{20,40}$/.test(parentIdRaw) ? parentIdRaw : null;
  const position = Math.max(0, Math.trunc(Number(formData.get("position")) || 0));
  const imageUrl = String(formData.get("imageUrl") ?? "").trim().slice(0, 500) || null;
  // Igual que en productos: una URL externa no permitida rompe la foto en la tienda (next/image).
  if (imageUrl && !isAllowedImageUrl(imageUrl)) {
    throw new CategoryFormError(
      "La imagen debe subirse con el botón «Subir foto» o ser una ruta local (que empiece con /).",
    );
  }

  return {
    name,
    slug,
    parentId,
    position,
    description: String(formData.get("description") ?? "").trim().slice(0, 500) || null,
    imageUrl,
    imageAlt: String(formData.get("imageAlt") ?? "").trim().slice(0, 200) || null,
    installVideoUrl: String(formData.get("installVideoUrl") ?? "").trim().slice(0, 500) || null,
    isVisible: formData.get("isVisible") === "on",
    showInHome: formData.get("showInHome") === "on",
    seoTitle: String(formData.get("seoTitle") ?? "").trim().slice(0, 160) || null,
    seoDescription: String(formData.get("seoDescription") ?? "").trim().slice(0, 300) || null,
  };
}

function slugErrorMessage(error: unknown): string {
  const code = (error as { code?: string } | null)?.code;
  if (code === "P2002") return "Ese slug ya lo usa otra categoría.";
  console.error("Error al guardar la categoría", error);
  return "No pudimos guardar la categoría. Intenta de nuevo.";
}

export async function createCategory(_prev: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
  const admin = await authorize("MANAGE_CATALOG");
  if (!admin) return { status: "error", message: "Tu sesión ya no tiene permiso para editar el catálogo." };

  let data: ReturnType<typeof parseCore>;
  try {
    data = parseCore(formData);
  } catch (error) {
    if (error instanceof CategoryFormError) return { status: "error", message: error.message };
    throw error;
  }

  try {
    await db.category.create({ data });
  } catch (error) {
    return { status: "error", message: slugErrorMessage(error) };
  }

  revalidateTag(CACHE_TAGS.catalog, "max");
  redirect("/admin/categorias");
}

export async function updateCategory(_prev: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
  const admin = await authorize("MANAGE_CATALOG");
  if (!admin) return { status: "error", message: "Tu sesión ya no tiene permiso para editar el catálogo." };

  const categoryId = String(formData.get("categoryId") ?? "");
  if (!/^[a-z0-9]{20,40}$/.test(categoryId)) return { status: "error", message: "Categoría no válida." };

  let data: ReturnType<typeof parseCore>;
  try {
    data = parseCore(formData);
  } catch (error) {
    if (error instanceof CategoryFormError) return { status: "error", message: error.message };
    throw error;
  }
  if (data.parentId === categoryId) return { status: "error", message: "Una categoría no puede ser su propio padre." };

  try {
    await db.category.update({ where: { id: categoryId }, data });
  } catch (error) {
    return { status: "error", message: slugErrorMessage(error) };
  }

  revalidateTag(CACHE_TAGS.catalog, "max");
  redirect("/admin/categorias");
}

// Botón de eliminar del listado. Solo categorías vacías: con productos o subcategorías se perderían del menú y
// del catálogo sin aviso, así que primero hay que moverlos.
export async function deleteCategory(categoryId: string): Promise<{ ok: boolean; message: string }> {
  const admin = await authorize("MANAGE_CATALOG");
  if (!admin) return { ok: false, message: "Tu sesión ya no tiene permiso para editar el catálogo." };
  if (!/^[a-z0-9]{20,40}$/.test(categoryId)) return { ok: false, message: "Categoría no válida." };

  const category = await db.category.findUnique({
    where: { id: categoryId },
    select: { _count: { select: { products: true, children: true } } },
  });
  if (!category) return { ok: false, message: "No encontramos esta categoría." };
  if (category._count.products > 0) {
    return { ok: false, message: "Tiene productos: muévelos a otra categoría antes de eliminarla." };
  }
  if (category._count.children > 0) {
    return { ok: false, message: "Tiene subcategorías: elimínalas o muévelas antes." };
  }

  await db.category.delete({ where: { id: categoryId } });
  revalidateTag(CACHE_TAGS.catalog, "max");
  revalidateTag(CACHE_TAGS.content, "max");
  refresh();
  return { ok: true, message: "Categoría eliminada." };
}
