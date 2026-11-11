"use client";

import { useActionState, useState } from "react";
import { AlertCircleIcon, Loader2Icon } from "lucide-react";
import type { CategoryFormState } from "@/app/admin/(panel)/categorias/actions";
import { ImageThumb } from "@/components/admin/image-thumb";
import { ImageUploadButton } from "@/components/admin/image-upload-button";
import type { CategoryRow } from "@/lib/admin/categories";

const inputClass =
  "h-11 w-full rounded-lg border border-input bg-white px-3 text-base text-heading focus-visible:border-brand";
const labelClass = "mb-1.5 block text-sm font-medium text-heading";

type Initial = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  position: number;
  description: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  installVideoUrl: string | null;
  isVisible: boolean;
  showInHome: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
};

export function CategoryForm({
  mode,
  initial,
  parentOptions,
  action,
}: {
  mode: "create" | "edit";
  initial?: Initial;
  parentOptions: CategoryRow[];
  action: (prev: CategoryFormState, formData: FormData) => Promise<CategoryFormState>;
}) {
  const [state, formAction, pending] = useActionState<CategoryFormState, FormData>(action, { status: "idle" });
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");

  return (
    <form action={formAction} className="mt-6 max-w-2xl space-y-4 rounded-card bg-white p-5 shadow-card">
      {initial && <input type="hidden" name="categoryId" value={initial.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelClass}>
            Nombre
          </label>
          <input id="name" name="name" required defaultValue={initial?.name} className={inputClass} />
        </div>
        <div>
          <label htmlFor="slug" className={labelClass}>
            Slug (URL)
          </label>
          <input id="slug" name="slug" required defaultValue={initial?.slug} placeholder="pisos-laminados" className={inputClass} />
        </div>
        <div>
          <label htmlFor="parentId" className={labelClass}>
            Categoría padre
          </label>
          <select id="parentId" name="parentId" defaultValue={initial?.parentId ?? ""} className={inputClass}>
            <option value="">Ninguna (categoría principal)</option>
            {parentOptions
              .filter((c) => c.id !== initial?.id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.parentName ? `${c.parentName} / ${c.name}` : c.name}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label htmlFor="position" className={labelClass}>
            Posición
          </label>
          <input id="position" name="position" type="number" min="0" defaultValue={initial?.position ?? 0} className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={initial?.description ?? ""}
          className="w-full rounded-lg border border-input bg-white px-3 py-2 text-base text-heading focus-visible:border-brand"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="imageUrl" className={labelClass}>
            Imagen
          </label>
          <div className="flex items-start gap-2">
            <ImageThumb url={imageUrl} />
            <input
              id="imageUrl"
              name="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Sube la foto o escribe una ruta como /home/cat-tapetes.webp"
              className={inputClass}
            />
            <ImageUploadButton folder="categorias" onUploaded={setImageUrl} />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="imageAlt" className={labelClass}>
            Texto alternativo
          </label>
          <input id="imageAlt" name="imageAlt" defaultValue={initial?.imageAlt ?? ""} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="installVideoUrl" className={labelClass}>
            Video de instalación/medidas (opcional, solo persianas)
          </label>
          <input id="installVideoUrl" name="installVideoUrl" defaultValue={initial?.installVideoUrl ?? ""} className={inputClass} />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex min-h-tap items-center gap-2 font-medium text-heading">
          <input type="checkbox" name="isVisible" defaultChecked={initial?.isVisible ?? true} className="size-5 accent-brand" />
          Visible en la tienda
        </label>
        <label className="flex min-h-tap items-center gap-2 font-medium text-heading">
          <input type="checkbox" name="showInHome" defaultChecked={initial?.showInHome ?? false} className="size-5 accent-brand" />
          Mostrar en el home
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="seoTitle" className={labelClass}>
            Título SEO
          </label>
          <input id="seoTitle" name="seoTitle" defaultValue={initial?.seoTitle ?? ""} className={inputClass} />
        </div>
        <div>
          <label htmlFor="seoDescription" className={labelClass}>
            Descripción SEO
          </label>
          <input id="seoDescription" name="seoDescription" defaultValue={initial?.seoDescription ?? ""} className={inputClass} />
        </div>
      </div>

      {state.status === "error" && state.message && (
        <p role="alert" className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-heading">
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-pill bg-brand px-6 font-semibold text-white hover:bg-brand-hover disabled:bg-line disabled:text-muted-foreground"
      >
        {pending && <Loader2Icon className="size-5 animate-spin" aria-hidden="true" />}
        {pending ? "Guardando…" : mode === "create" ? "Crear categoría" : "Guardar cambios"}
      </button>
    </form>
  );
}
