"use server";

import { updateTag } from "next/cache";
import { authorize } from "@/lib/admin/session";
import { CACHE_TAGS, db } from "@/lib/db";
import { sanitizePolicyHtml } from "@/lib/policy-html";

export type PageEditState = { error?: string; saved?: string };

export async function saveEditablePage(_previous: PageEditState, formData: FormData): Promise<PageEditState> {
  if (!(await authorize("MANAGE_CONTENT"))) return { error: "No tienes permiso para editar contenido." };
  const text = (name: string, max: number) => String(formData.get(name) ?? "").trim().slice(0, max);
  const id = text("pageId", 40);
  const title = text("title", 160);
  const rawContent = String(formData.get("content") ?? "");
  const seoTitle = text("seoTitle", 160) || null;
  const seoDescription = text("seoDescription", 320) || null;
  const isPublished = formData.get("isPublished") === "on";
  if (!id || !title || !rawContent.trim() || rawContent.length > 200_000) return { error: "Completa el título y el contenido (máximo 200 KB)." };
  const page = await db.page.findFirst({ where: { id, type: "POLICY" }, select: { id: true } });
  if (!page) return { error: "No encontramos esta página legal." };
  const content = sanitizePolicyHtml(rawContent);
  if (!content.trim()) return { error: "El contenido no tiene texto o elementos permitidos." };
  await db.page.update({ where: { id }, data: { title, content, seoTitle, seoDescription, isPublished } });
  updateTag(CACHE_TAGS.content);
  return { saved: "Página guardada." };
}
