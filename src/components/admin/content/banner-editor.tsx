"use client";

import { useActionState, useState } from "react";
import { CheckCircle2Icon, Loader2Icon } from "lucide-react";
import { updateBanner, type ContentFormState } from "@/app/admin/(panel)/contenido/actions";
import { ImageThumb } from "@/components/admin/image-thumb";
import { ImageUploadButton } from "@/components/admin/image-upload-button";

const inputClass =
  "h-11 w-full rounded-lg border border-input bg-white px-3 text-base text-heading focus-visible:border-brand";
const labelClass = "mb-1.5 block text-sm font-medium text-heading";

export type BannerInitial = {
  id: string;
  placement: "HOME_HERO" | "HOME_PROMO" | "ANNOUNCEMENT";
  title: string;
  subtitle: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  imageDesktop: string | null;
  imageAlt: string | null;
  theme: string;
  position: number;
  isActive: boolean;
};

export function BannerEditor({ banner, number }: { banner: BannerInitial; number: number }) {
  const [state, formAction, pending] = useActionState<ContentFormState, FormData>(updateBanner, { status: "idle" });
  const [image, setImage] = useState(banner.imageDesktop ?? "");
  const announcement = banner.placement === "ANNOUNCEMENT";
  const promotion = banner.placement === "HOME_PROMO";

  return (
    <form action={formAction} className="space-y-4 rounded-card bg-white p-5 shadow-card">
      <input type="hidden" name="bannerId" value={banner.id} />
      <input type="hidden" name="position" value={banner.position} />
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-bold text-heading">{announcement ? "Anuncio superior" : `Banner ${number}`}</h3>
        <span className="rounded-pill bg-mist px-2.5 py-1 text-xs font-semibold">Posición {banner.position + 1}</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor={`banner-title-${banner.id}`} className={labelClass}>Título</label>
          <input id={`banner-title-${banner.id}`} name="title" required defaultValue={banner.title} className={inputClass} />
        </div>
        {banner.placement === "HOME_HERO" && (
          <div className="sm:col-span-2">
            <label htmlFor={`banner-subtitle-${banner.id}`} className={labelClass}>Subtítulo</label>
            <textarea id={`banner-subtitle-${banner.id}`} name="subtitle" rows={2} defaultValue={banner.subtitle ?? ""} className="w-full rounded-lg border border-input bg-white px-3 py-2 text-base text-heading focus-visible:border-brand" />
          </div>
        )}
        {!promotion && <div>
          <label htmlFor={`cta-label-${banner.id}`} className={labelClass}>Texto del botón</label>
          <input id={`cta-label-${banner.id}`} name="ctaLabel" defaultValue={banner.ctaLabel ?? ""} className={inputClass} />
        </div>}
        <div>
          <label htmlFor={`cta-url-${banner.id}`} className={labelClass}>Enlace</label>
          <input id={`cta-url-${banner.id}`} name="ctaUrl" defaultValue={banner.ctaUrl ?? ""} placeholder="/productos" className={inputClass} />
        </div>
      </div>

      {!announcement && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <span className={labelClass}>Imagen</span>
            <input type="hidden" name="imageDesktop" value={image} />
            <div className="flex flex-wrap items-center gap-3">
              <ImageThumb url={image} />
              <ImageUploadButton folder="contenido" onUploaded={setImage} label={image ? "Reemplazar imagen" : "Subir imagen"} />
              {image && <span className="max-w-full truncate text-xs text-muted-foreground">Imagen actual guardada</span>}
            </div>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor={`alt-${banner.id}`} className={labelClass}>Texto alternativo de la imagen</label>
            <input id={`alt-${banner.id}`} name="imageAlt" required defaultValue={banner.imageAlt ?? ""} className={inputClass} />
          </div>
          {banner.placement === "HOME_HERO" && <div>
            <label htmlFor={`theme-${banner.id}`} className={labelClass}>Color del texto</label>
            <select id={`theme-${banner.id}`} name="theme" defaultValue={banner.theme} className={inputClass}>
              <option value="light">Oscuro, para imagen clara</option>
              <option value="dark">Claro, para imagen oscura</option>
            </select>
          </div>}
          {promotion && <>
            <div>
              <label htmlFor={`discount-prefix-${banner.id}`} className={labelClass}>Texto antes del porcentaje</label>
              <input id={`discount-prefix-${banner.id}`} name="discountPrefix" maxLength={32} defaultValue={banner.ctaLabel ?? "Hasta"} placeholder="Ej. Hasta, Oferta" className={inputClass} />
            </div>
            <div>
              <label htmlFor={`discount-${banner.id}`} className={labelClass}>Porcentaje de descuento</label>
              <div className="relative max-w-48">
                <input id={`discount-${banner.id}`} name="discountPercent" type="number" min="1" max="99" defaultValue={banner.subtitle ?? ""} placeholder="Ej. 30" className={`${inputClass} pr-10`} />
                <span className="absolute top-3 right-3 font-semibold text-muted-foreground">%</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Vacío: se calcula desde los precios del catálogo.</p>
            </div>
            <div>
              <label htmlFor={`discount-suffix-${banner.id}`} className={labelClass}>Texto después del porcentaje</label>
              <input id={`discount-suffix-${banner.id}`} name="discountSuffix" maxLength={32} defaultValue={banner.imageAlt?.startsWith("badge:") ? banner.imageAlt.slice(6) : "de descuento"} placeholder="Ej. de descuento, de ahorro" className={inputClass} />
            </div>
          </>}
        </div>
      )}

      <label className="flex min-h-tap items-center gap-2 font-medium text-heading">
        <input type="checkbox" name="isActive" defaultChecked={banner.isActive} className="size-5 accent-brand" />
        Visible en la tienda
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="inline-flex h-11 items-center gap-2 rounded-pill bg-brand px-5 font-semibold text-white hover:bg-brand-hover disabled:bg-line disabled:text-muted-foreground">
          {pending && <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />}
          {pending ? "Guardando…" : "Guardar banner"}
        </button>
        {state.status !== "idle" && state.message && (
          <p aria-live="polite" className={state.status === "saved" ? "flex items-center gap-1.5 text-sm font-medium text-emerald-700" : "text-sm font-medium text-danger"}>
            {state.status === "saved" && <CheckCircle2Icon className="size-4" aria-hidden="true" />}
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
