"use server";

import { updateTag } from "next/cache";
import { authorize } from "@/lib/admin/session";
import { CACHE_TAGS, db } from "@/lib/db";
import { defaultSiteContentSettings } from "@/lib/site-settings";
import { DEFAULT_HEADER_ACTIONS, HEADER_ICON_OPTIONS, type HeaderActionKey } from "@/lib/header-actions";
import { isAllowedImageUrl } from "@/lib/admin/images";

export async function saveSiteContent(_previous: { error?: string; saved?: string }, formData: FormData) {
  if (!(await authorize("MANAGE_CONTENT"))) return { error: "No tienes permiso para editar contenido." };
  const text = (key: string, max: number) => String(formData.get(key) ?? "").trim().slice(0, max);
  const social = defaultSiteContentSettings.social.map((item) => ({
    ...item,
    label: text(`social-label-${item.network}`, 40) || item.label,
    url: text(`social-${item.network}`, 500),
  }));
  const data = {
    footerDescription: text("footerDescription", 500),
    footerCopyright: text("footerCopyright", 160),
    supportPhone: text("supportPhone", 80),
    supportEmail: text("supportEmail", 254),
    social,
  };
  if (!data.footerDescription || !data.footerCopyright || !data.supportPhone || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.supportEmail)) {
    return { error: "Revisa la descripción, el teléfono, la leyenda legal y el correo." };
  }
  if (social.some(({ url }) => url && !/^https:\/\//i.test(url))) return { error: "Cada red social necesita una URL https válida." };
  const current = await db.siteSettings.findUnique({ where: { id: "site" }, select: { content: true } });
  const content = { ...((current?.content ?? {}) as Record<string, unknown>), ...data };
  await db.siteSettings.upsert({ where: { id: "site" }, create: { id: "site", content }, update: { content } });
  updateTag(CACHE_TAGS.content);
  return { saved: "Cambios guardados." };
}

export async function saveSiteLogo(_previous: { error?: string; saved?: string }, formData: FormData) {
  if (!(await authorize("MANAGE_CONTENT"))) return { error: "No tienes permiso para editar contenido." };
  const logoUrl = String(formData.get("logoUrl") ?? "").trim();
  if (logoUrl.length > 1000 || !isAllowedImageUrl(logoUrl)) return { error: "Selecciona un logo válido." };
  const current = await db.siteSettings.findUnique({ where: { id: "site" }, select: { content: true } });
  const content = { ...((current?.content ?? {}) as Record<string, unknown>), logoUrl };
  await db.siteSettings.upsert({ where: { id: "site" }, create: { id: "site", content }, update: { content } });
  updateTag(CACHE_TAGS.content);
  return { saved: "Logo guardado." };
}

export async function saveHeaderActions(_previous: { error?: string; saved?: string }, formData: FormData) {
  if (!(await authorize("MANAGE_CONTENT"))) return { error: "No tienes permiso para editar contenido." };
  const raw = String(formData.get("headerActionsJson") ?? "");
  if (raw.length > 2_000) return { error: "La configuración de iconos no es válida." };
  let requested: unknown;
  try { requested = JSON.parse(raw); } catch { return { error: "La configuración de iconos no es válida." }; }
  const allowed = new Set<HeaderActionKey>(DEFAULT_HEADER_ACTIONS.map(({ key }) => key));
  const validInternalHref = (href: unknown) => typeof href === "string" && href.startsWith("/") && !href.startsWith("//") && !/[\u0000-\u001f]/.test(href) && href.length <= 500;
  if (!Array.isArray(requested) || requested.length !== DEFAULT_HEADER_ACTIONS.length || requested.some((item) => {
    if (!item || !allowed.has(item.key) || typeof item.visible !== "boolean" || typeof item.label !== "string" || !item.label.trim() || item.label.length > 40) return true;
    if (!HEADER_ICON_OPTIONS[item.key as HeaderActionKey].some((option) => option.value === item.icon)) return true;
    return item.key === "favorites" || item.key === "account" ? !validInternalHref(item.href) : item.href !== null;
  }) || new Set(requested.map((item) => item.key)).size !== DEFAULT_HEADER_ACTIONS.length) {
    return { error: "Revisa las etiquetas, iconos, destinos y visibilidad de los accesos." };
  }
  const current = await db.siteSettings.findUnique({ where: { id: "site" }, select: { content: true } });
  const content = { ...((current?.content ?? {}) as Record<string, unknown>), headerActions: requested };
  await db.siteSettings.upsert({ where: { id: "site" }, create: { id: "site", content }, update: { content } });
  updateTag(CACHE_TAGS.content);
  return { saved: "Iconos del Header guardados." };
}
