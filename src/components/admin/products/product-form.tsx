"use client";

import { useActionState, useState } from "react";
import { AlertCircleIcon, Loader2Icon, PlusIcon, Trash2Icon } from "lucide-react";
import type { ProductFormState } from "@/app/admin/(panel)/productos/actions";
import type { ProductForEdit } from "@/lib/admin/products";
import { ImageThumb } from "@/components/admin/image-thumb";
import { ImageUploadButton } from "@/components/admin/image-upload-button";
import { IMAGE_MAX_LABEL } from "@/lib/admin/images";
import { ATTRIBUTE_FILTERS } from "@/lib/catalog-params";
import { PRODUCT_STATUSES, PRODUCT_STATUS_META } from "@/lib/product-status";

const inputClass =
  "h-11 w-full rounded-lg border border-input bg-white px-3 text-base text-heading focus-visible:border-brand";
const labelClass = "mb-1.5 block text-sm font-medium text-heading";
const cardClass = "rounded-card bg-white p-5 shadow-card space-y-4";

type Variant = {
  id: string | null;
  label: string;
  sku: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  isActive: boolean;
};
type Spec = { label: string; value: string };
type Img = { url: string; alt: string };

function emptyVariant(): Variant {
  return { id: null, label: "", sku: "", price: "", compareAtPrice: "", stock: "0", isActive: true };
}

export function ProductForm({
  mode,
  initial,
  categories,
  action,
}: {
  mode: "create" | "edit";
  initial?: ProductForEdit;
  categories: { id: string; label: string }[];
  action: (prev: ProductFormState, formData: FormData) => Promise<ProductFormState>;
}) {
  const [state, formAction, pending] = useActionState<ProductFormState, FormData>(action, { status: "idle" });

  const [categoryIds, setCategoryIds] = useState<string[]>(initial?.categoryIds ?? []);
  const [attributes, setAttributes] = useState<Record<string, string>>(initial?.attributes ?? {});
  const [specs, setSpecs] = useState<Spec[]>(initial?.specs.length ? initial.specs : [{ label: "", value: "" }]);
  const [images, setImages] = useState<Img[]>(initial?.images.length ? initial.images : [{ url: "", alt: "" }]);
  const [optionName, setOptionName] = useState(initial?.optionName ?? "");
  const [variants, setVariants] = useState<Variant[]>(
    initial?.variants.length
      ? initial.variants.map((v) => ({
          ...v,
          price: String(v.price),
          compareAtPrice: v.compareAtPrice === null ? "" : String(v.compareAtPrice),
          stock: String(v.stock),
        }))
      : [emptyVariant()],
  );

  return (
    <form action={formAction} className="mt-6 space-y-6">
      {initial && <input type="hidden" name="productId" value={initial.id} />}
      <input type="hidden" name="categoryIds" value={JSON.stringify(categoryIds)} />
      <input type="hidden" name="attributes" value={JSON.stringify(attributes)} />
      <input type="hidden" name="specs" value={JSON.stringify(specs)} />
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <input type="hidden" name="variants" value={JSON.stringify(variants)} />

      <section className={cardClass}>
        <h2 className="text-lg font-bold">General</h2>
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
            <input
              id="slug"
              name="slug"
              required
              defaultValue={initial?.slug}
              placeholder="tapete-bilbao-gris"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="brand" className={labelClass}>
              Marca
            </label>
            <input id="brand" name="brand" defaultValue={initial?.brand} className={inputClass} />
          </div>
          <div>
            <label htmlFor="status" className={labelClass}>
              Estado
            </label>
            <select id="status" name="status" defaultValue={initial?.status ?? "DRAFT"} className={inputClass}>
              {PRODUCT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {PRODUCT_STATUS_META[s].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex min-h-tap items-center gap-2 font-medium text-heading">
          <input type="checkbox" name="isFeatured" defaultChecked={initial?.isFeatured} className="size-5 accent-brand" />
          Producto destacado (home)
        </label>

        <fieldset>
          <legend className={labelClass}>Categorías</legend>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const checked = categoryIds.includes(c.id);
              return (
                <label
                  key={c.id}
                  className={`flex min-h-tap cursor-pointer items-center gap-2 rounded-pill border px-3 text-sm ${checked ? "border-brand bg-surface" : "border-input"}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      setCategoryIds((prev) => (e.target.checked ? [...prev, c.id] : prev.filter((id) => id !== c.id)))
                    }
                    className="size-4 accent-brand"
                  />
                  {c.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      </section>

      <section className={cardClass}>
        <h2 className="text-lg font-bold">Descripción</h2>
        <div>
          <label htmlFor="shortDescription" className={labelClass}>
            Descripción corta
          </label>
          <input id="shortDescription" name="shortDescription" defaultValue={initial?.shortDescription} className={inputClass} />
        </div>
        <div>
          <label htmlFor="description" className={labelClass}>
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={initial?.description}
            className="w-full rounded-lg border border-input bg-white px-3 py-2 text-base text-heading focus-visible:border-brand"
          />
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="text-lg font-bold">Precio</h2>
        <p className="text-sm">
          El precio y el precio tachado que se muestran en el catálogo se calculan solos, de la variante activa más
          barata (abajo, en &quot;Variantes&quot;). Aquí solo van los datos de formato.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="format" className={labelClass}>
              Formato (medida de la pieza)
            </label>
            <input id="format" name="format" placeholder="22.8 cm x 1.52 m" defaultValue={initial?.format} className={inputClass} />
          </div>
          <div>
            <label htmlFor="areaPerBox" className={labelClass}>
              m² por caja (solo pisos)
            </label>
            <input
              id="areaPerBox"
              name="areaPerBox"
              type="number"
              step="0.001"
              min="0"
              defaultValue={initial?.areaPerBox ?? ""}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="text-lg font-bold">Atributos filtrables</h2>
        <p className="text-sm">Se usan para los filtros del catálogo; deja en blanco los que no apliquen.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {ATTRIBUTE_FILTERS.map(({ key, label }) => (
            <div key={key}>
              <label htmlFor={`attr-${key}`} className={labelClass}>
                {label}
              </label>
              <input
                id={`attr-${key}`}
                value={attributes[key] ?? ""}
                onChange={(e) => setAttributes((prev) => ({ ...prev, [key]: e.target.value }))}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </section>

      <RepeatableSection
        title="Ficha técnica"
        rows={specs}
        onAdd={() => setSpecs((prev) => [...prev, { label: "", value: "" }])}
        onRemove={(i) => setSpecs((prev) => prev.filter((_, idx) => idx !== i))}
        renderRow={(row, i) => (
          <>
            <input
              placeholder="Etiqueta (ej. Ancho)"
              value={row.label}
              onChange={(e) => setSpecs((prev) => prev.map((s, idx) => (idx === i ? { ...s, label: e.target.value } : s)))}
              className={inputClass}
            />
            <input
              placeholder="Valor (ej. 15 a 300 cm)"
              value={row.value}
              onChange={(e) => setSpecs((prev) => prev.map((s, idx) => (idx === i ? { ...s, value: e.target.value } : s)))}
              className={inputClass}
            />
          </>
        )}
      />

      <RepeatableSection
        title="Imágenes"
        hint={`Sube la foto con «Subir foto» (WEBP, JPG, PNG o AVIF, hasta ${IMAGE_MAX_LABEL}) o escribe una ruta local que empiece con /, como /tapetes/archivo.webp. La primera es la foto principal.`}
        rows={images}
        gridClass="grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]"
        onAdd={() => setImages((prev) => [...prev, { url: "", alt: "" }])}
        onRemove={(i) => setImages((prev) => prev.filter((_, idx) => idx !== i))}
        renderRow={(row, i) => (
          <>
            <div className="flex items-start gap-2">
              <ImageThumb url={row.url} />
              <input
                placeholder="URL de la imagen"
                aria-label={`URL de la imagen ${i + 1}`}
                value={row.url}
                onChange={(e) => setImages((prev) => prev.map((s, idx) => (idx === i ? { ...s, url: e.target.value } : s)))}
                className={inputClass}
              />
              <ImageUploadButton
                folder="productos"
                label="Subir foto"
                onUploaded={(url) => setImages((prev) => prev.map((s, idx) => (idx === i ? { ...s, url } : s)))}
              />
            </div>
            <input
              placeholder="Texto alternativo"
              value={row.alt}
              onChange={(e) => setImages((prev) => prev.map((s, idx) => (idx === i ? { ...s, alt: e.target.value } : s)))}
              className={inputClass}
            />
          </>
        )}
      />

      <section className={cardClass}>
        <h2 className="text-lg font-bold">Variantes</h2>
        <p className="text-sm">
          Si el producto se vende en una sola presentación, deja una sola fila y el nombre de la variante en blanco. Si
          tiene varias (p. ej. medidas), ponles un nombre al eje (ej. &quot;Medida&quot;) y una etiqueta por fila (ej.
          &quot;1.20 x 1.80 m&quot;).
        </p>
        <div>
          <label htmlFor="optionName" className={labelClass}>
            Nombre del eje (opcional)
          </label>
          <input
            id="optionName"
            name="optionName"
            value={optionName}
            onChange={(e) => setOptionName(e.target.value)}
            placeholder="Medida, Color…"
            className={`max-w-xs ${inputClass}`}
          />
        </div>
        <div className="space-y-3">
          {variants.map((row, i) => (
            <div key={i} className="grid gap-2 rounded-lg border border-line p-3 sm:grid-cols-[1fr_1fr_6rem_6rem_6rem_auto_auto]">
              <input
                placeholder="Etiqueta (ej. 1.20 x 1.80 m)"
                value={row.label}
                onChange={(e) => setVariants((prev) => prev.map((v, idx) => (idx === i ? { ...v, label: e.target.value } : v)))}
                className={inputClass}
              />
              <input
                placeholder="SKU"
                value={row.sku}
                onChange={(e) => setVariants((prev) => prev.map((v, idx) => (idx === i ? { ...v, sku: e.target.value } : v)))}
                className={inputClass}
              />
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Precio"
                value={row.price}
                onChange={(e) => setVariants((prev) => prev.map((v, idx) => (idx === i ? { ...v, price: e.target.value } : v)))}
                className={inputClass}
              />
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Precio tachado"
                value={row.compareAtPrice}
                onChange={(e) =>
                  setVariants((prev) => prev.map((v, idx) => (idx === i ? { ...v, compareAtPrice: e.target.value } : v)))
                }
                className={inputClass}
              />
              <input
                type="number"
                min="0"
                placeholder="Stock"
                value={row.stock}
                onChange={(e) => setVariants((prev) => prev.map((v, idx) => (idx === i ? { ...v, stock: e.target.value } : v)))}
                className={inputClass}
              />
              <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={row.isActive}
                  onChange={(e) => setVariants((prev) => prev.map((v, idx) => (idx === i ? { ...v, isActive: e.target.checked } : v)))}
                  className="size-5 accent-brand"
                />
                Activa
              </label>
              {variants.length > 1 && (
                <button
                  type="button"
                  onClick={() => setVariants((prev) => prev.filter((_, idx) => idx !== i))}
                  aria-label="Quitar variante"
                  className="grid size-11 place-items-center rounded-full text-destructive hover:bg-destructive/10"
                >
                  <Trash2Icon className="size-4" aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setVariants((prev) => [...prev, emptyVariant()])}
          className="inline-flex h-10 items-center gap-1.5 rounded-pill border border-brand px-3 text-sm font-semibold text-brand hover:bg-surface"
        >
          <PlusIcon className="size-4" aria-hidden="true" />
          Agregar variante
        </button>
      </section>

      <section className={cardClass}>
        <h2 className="text-lg font-bold">SEO (opcional)</h2>
        <div>
          <label htmlFor="seoTitle" className={labelClass}>
            Título SEO
          </label>
          <input id="seoTitle" name="seoTitle" defaultValue={initial?.seoTitle} className={inputClass} />
        </div>
        <div>
          <label htmlFor="seoDescription" className={labelClass}>
            Descripción SEO
          </label>
          <input id="seoDescription" name="seoDescription" defaultValue={initial?.seoDescription} className={inputClass} />
        </div>
      </section>

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
        {pending ? "Guardando…" : mode === "create" ? "Crear producto" : "Guardar cambios"}
      </button>
    </form>
  );
}

function RepeatableSection<T>({
  title,
  hint,
  rows,
  onAdd,
  onRemove,
  renderRow,
  gridClass = "grid-cols-[1fr_1fr_auto]",
}: {
  title: string;
  hint?: string;
  gridClass?: string;
  rows: T[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  renderRow: (row: T, i: number) => React.ReactNode;
}) {
  return (
    <section className={cardClass}>
      <h2 className="text-lg font-bold">{title}</h2>
      {hint && <p className="text-sm">{hint}</p>}
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className={`grid items-center gap-2 ${gridClass}`}>
            {renderRow(row, i)}
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => onRemove(i)}
                aria-label="Quitar fila"
                className="grid size-11 place-items-center rounded-full text-destructive hover:bg-destructive/10"
              >
                <Trash2Icon className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex h-10 items-center gap-1.5 rounded-pill border border-brand px-3 text-sm font-semibold text-brand hover:bg-surface"
      >
        <PlusIcon className="size-4" aria-hidden="true" />
        Agregar
      </button>
    </section>
  );
}
