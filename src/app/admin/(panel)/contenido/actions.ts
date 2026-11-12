"use server";

import { updateTag } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { isAllowedImageUrl } from "@/lib/admin/images";
import { authorize } from "@/lib/admin/session";
import { CACHE_TAGS, db } from "@/lib/db";

export type ContentFormState = { status: "idle" | "saved" | "error"; message?: string };

class ContentFormError extends Error {}

const ID = /^[a-z0-9]{20,40}$/;

const value = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();

function optionalText(formData: FormData, name: string, max: number) {
  const result = value(formData, name);
  if (result.length > max) throw new ContentFormError(`El campo ${name} es demasiado largo.`);
  return result || null;
}

function position(formData: FormData, max: number) {
  const result = Number(value(formData, "position"));
  if (!Number.isInteger(result) || result < 0 || result > max) throw new ContentFormError("La posición no es válida.");
  return result;
}

function settingsJson(formData: FormData) {
  const raw = value(formData, "settingsJson");
  if (!raw || raw.length > 20_000) throw new ContentFormError("La configuración de la sección no es válida.");
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") throw new Error();
    return parsed as Record<string, unknown>;
  } catch {
    throw new ContentFormError("La configuración de la sección no es válida.");
  }
}

function optionalUrl(formData: FormData, name: string, label: string) {
  const result = optionalText(formData, name, 500);
  if (result && !((result.startsWith("/") && !result.startsWith("//")) || /^https:\/\//i.test(result))) {
    throw new ContentFormError(`${label} debe ser una ruta interna o una URL https://.`);
  }
  return result;
}

function optionalImage(formData: FormData, name: string, label: string) {
  const result = optionalText(formData, name, 500);
  if (result && !isAllowedImageUrl(result)) {
    throw new ContentFormError(`${label} debe ser una ruta local o una imagen de Vercel Blob.`);
  }
  return result;
}

function errorState(error: unknown): ContentFormState {
  if (error instanceof ContentFormError) return { status: "error", message: error.message };
  console.error("Error al guardar contenido", error);
  return { status: "error", message: "No pudimos guardar los cambios. Intenta de nuevo." };
}

export async function updateHomeSection(
  _prev: ContentFormState,
  formData: FormData,
): Promise<ContentFormState> {
  const admin = await authorize("MANAGE_CONTENT");
  if (!admin) return { status: "error", message: "Tu sesión ya no tiene permiso para editar contenido." };

  const sectionId = value(formData, "sectionId");
  if (!ID.test(sectionId)) return { status: "error", message: "Sección no válida." };

  try {
    const title = optionalText(formData, "title", 120);
    const subtitle = optionalText(formData, "subtitle", 300);
    const isActive = formData.get("isActive") === "on";
    const nextSettings = settingsJson(formData);

    const current = await db.homeSection.findUnique({ where: { id: sectionId }, select: { type: true } });
    if (!current) throw new ContentFormError("No encontramos esta sección.");

    if (current.type === "CATEGORY_CAROUSEL") {
      if (!Array.isArray(nextSettings.categoryItems) || nextSettings.categoryItems.length < 1 || nextSettings.categoryItems.length > 20) {
        throw new ContentFormError("Captura entre 1 y 20 tarjetas de categoría.");
      }
      nextSettings.categoryItems = nextSettings.categoryItems.map((item) => {
        const row = item as Record<string, unknown>;
        const title = String(row.title ?? "").trim();
        const imageUrl = String(row.imageUrl ?? "").trim();
        const imageAlt = String(row.imageAlt ?? "").trim();
        const href = String(row.href ?? "").trim();
        if (!title || title.length > 80) throw new ContentFormError("Cada tarjeta necesita un título de hasta 80 caracteres.");
        if (!isAllowedImageUrl(imageUrl)) throw new ContentFormError(`La imagen de “${title}” no es válida.`);
        if (!imageAlt || imageAlt.length > 200) throw new ContentFormError(`Escribe el texto alternativo de “${title}”.`);
        if (href.length > 500 || !isAllowedLink(href)) throw new ContentFormError(`El enlace de “${title}” no es válido.`);
        return { title, imageUrl, imageAlt, href };
      });
    }
    if (current.type === "FEATURED_PRODUCTS") {
      const slugs = selectedSlugs(nextSettings.productSlugs, 24, "productos");
      const count = await db.product.count({ where: { slug: { in: slugs }, status: "ACTIVE" } });
      if (count !== slugs.length) throw new ContentFormError("Uno de los productos seleccionados ya no está disponible.");
      nextSettings.productSlugs = slugs;
      nextSettings.limit = slugs.length;
    }
    if (current.type === "VALUE_PROPOSITION") {
      const items = Array.isArray(nextSettings.items) ? nextSettings.items : [];
      if (items.length < 1 || items.length > 8) throw new ContentFormError("Captura entre 1 y 8 beneficios.");
      for (const item of items) {
        const row = item as Record<string, unknown>;
        if (!String(row.title ?? "").trim() || !String(row.text ?? "").trim()) {
          throw new ContentFormError("Cada beneficio necesita título y descripción.");
        }
      }
    }
    if (current.type === "INSTALL_GUIDE") {
      const imageUrl = String(nextSettings.imageUrl ?? "");
      const imageAlt = String(nextSettings.imageAlt ?? "").trim();
      const faq = (nextSettings.faq ?? {}) as Record<string, unknown>;
      if (!isAllowedImageUrl(imageUrl) || !isAllowedImageUrl(String(faq.imageUrl ?? ""))) {
        throw new ContentFormError("La guía y las preguntas frecuentes necesitan imágenes válidas.");
      }
      if (!imageAlt || !String(faq.imageAlt ?? "").trim()) {
        throw new ContentFormError("Escribe el texto alternativo de las dos imágenes.");
      }
      const tutorials = Array.isArray(nextSettings.tutorials) ? nextSettings.tutorials : [];
      for (const tutorial of tutorials) {
        const row = tutorial as Record<string, unknown>;
        if (!String(row.title ?? "").trim() || !/^https:\/\//i.test(String(row.videoUrl ?? ""))) {
          throw new ContentFormError("Cada tutorial necesita título y una URL https:// válida.");
        }
      }
    }

    await db.homeSection.update({
      where: { id: sectionId },
      data: { title, subtitle, isActive, settings: nextSettings as Prisma.InputJsonValue },
    });
  } catch (error) {
    return errorState(error);
  }

  updateTag(CACHE_TAGS.content);
  return { status: "saved", message: "Sección actualizada." };
}

export async function updateBanner(_prev: ContentFormState, formData: FormData): Promise<ContentFormState> {
  const admin = await authorize("MANAGE_CONTENT");
  if (!admin) return { status: "error", message: "Tu sesión ya no tiene permiso para editar contenido." };

  const bannerId = value(formData, "bannerId");
  if (!ID.test(bannerId)) return { status: "error", message: "Banner no válido." };

  try {
    const current = await db.banner.findUnique({ where: { id: bannerId }, select: { placement: true, ctaLabel: true } });
    if (!current) throw new ContentFormError("No encontramos este banner.");

    const title = optionalText(formData, "title", 120);
    if (!title) throw new ContentFormError("Escribe el título.");
    const imageDesktop = optionalImage(formData, "imageDesktop", "La imagen principal");
    if (current.placement !== "ANNOUNCEMENT" && !imageDesktop) {
      throw new ContentFormError("La imagen principal es obligatoria.");
    }
    const imageAlt = optionalText(formData, "imageAlt", 200);
    if (current.placement !== "ANNOUNCEMENT" && !imageAlt) {
      throw new ContentFormError("Escribe el texto alternativo de la imagen.");
    }

    const ctaUrl = optionalUrl(formData, "ctaUrl", "El enlace");
    if (current.placement === "HOME_PROMO" && !ctaUrl) {
      throw new ContentFormError("Escribe el enlace de la promoción.");
    }
    const discount = value(formData, "discountPercent");
    const discountPrefix = optionalText(formData, "discountPrefix", 32);
    const discountSuffix = optionalText(formData, "discountSuffix", 32);
    if (current.placement === "HOME_PROMO" && discount) {
      const percent = Number(discount);
      if (!Number.isInteger(percent) || percent < 1 || percent > 99) {
        throw new ContentFormError("El descuento debe ser un porcentaje entre 1 y 99.");
      }
    }

    await db.banner.update({
      where: { id: bannerId },
      data: {
        title,
        subtitle: current.placement === "HOME_PROMO" ? discount || null : optionalText(formData, "subtitle", 300),
        ctaLabel: current.placement === "HOME_PROMO" ? discountPrefix : optionalText(formData, "ctaLabel", 60),
        ctaUrl,
        imageDesktop,
        imageMobile: null,
        imageAlt: current.placement === "HOME_PROMO" ? `badge:${discountSuffix ?? ""}` : imageAlt,
        theme: current.placement === "HOME_PROMO" ? current.placement : value(formData, "theme") === "dark" ? "dark" : "light",
        position: position(formData, 49),
        isActive: formData.get("isActive") === "on",
      },
    });
  } catch (error) {
    return errorState(error);
  }

  updateTag(CACHE_TAGS.content);
  return { status: "saved", message: "Banner actualizado." };
}

function selectedSlugs(input: unknown, max: number, label: string) {
  if (!Array.isArray(input)) throw new ContentFormError(`Selecciona los ${label} que aparecerán.`);
  const slugs = input.filter((slug): slug is string => typeof slug === "string" && /^[a-z0-9-]{1,120}$/.test(slug));
  if (slugs.length < 1 || slugs.length > max || new Set(slugs).size !== slugs.length) {
    throw new ContentFormError(`Selecciona entre 1 y ${max} ${label}, sin repetirlos.`);
  }
  return slugs;
}

function isAllowedLink(href: string) {
  return (href.startsWith("/") && !href.startsWith("//")) || /^https:\/\//i.test(href);
}
