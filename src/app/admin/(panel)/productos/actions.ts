"use server";

import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import type { ProductStatus } from "@/generated/prisma/enums";
import { ATTRIBUTE_FILTERS } from "@/lib/catalog-params";
import { isAllowedImageUrl } from "@/lib/admin/images";
import { authorize } from "@/lib/admin/session";
import { CACHE_TAGS, db } from "@/lib/db";
import { PRODUCT_STATUSES } from "@/lib/product-status";

export type ProductFormState = {
  status: "idle" | "error";
  message?: string;
};

class ProductFormError extends Error {}

function parseJson<T>(raw: FormDataEntryValue | null, fallback: T): T {
  if (typeof raw !== "string" || !raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function parseCore(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim().slice(0, 200);
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase().slice(0, 200);
  if (!name) throw new ProductFormError("Escribe el nombre del producto.");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    throw new ProductFormError("El slug solo puede tener minúsculas, números y guiones (ej. tapete-bilbao-gris).");
  }

  const status = String(formData.get("status") ?? "") as ProductStatus;
  if (!PRODUCT_STATUSES.includes(status)) throw new ProductFormError("Elige un estado válido.");

  const areaRaw = formData.get("areaPerBox");
  const areaPerBox = areaRaw ? Number(areaRaw) : null;
  if (areaPerBox !== null && (!Number.isFinite(areaPerBox) || areaPerBox <= 0)) {
    throw new ProductFormError("Los m² por caja deben ser un número positivo.");
  }

  const categoryIds = parseJson<string[]>(formData.get("categoryIds"), [])
    .filter((id): id is string => typeof id === "string" && /^[a-z0-9]{20,40}$/.test(id))
    .slice(0, 10);
  if (categoryIds.length === 0) throw new ProductFormError("Elige al menos una categoría.");

  const attributesRaw = parseJson<Record<string, string>>(formData.get("attributes"), {});
  const attributes: Record<string, string> = {};
  for (const { key } of ATTRIBUTE_FILTERS) {
    const value = attributesRaw[key]?.trim().slice(0, 60);
    if (value) attributes[key] = value;
  }

  const specs = parseJson<{ label: string; value: string }[]>(formData.get("specs"), [])
    .map((s) => ({ label: String(s?.label ?? "").trim().slice(0, 60), value: String(s?.value ?? "").trim().slice(0, 200) }))
    .filter((s) => s.label && s.value)
    .slice(0, 30);

  const images = parseJson<{ url: string; alt: string }[]>(formData.get("images"), [])
    .map((img) => ({ url: String(img?.url ?? "").trim().slice(0, 500), alt: String(img?.alt ?? "").trim().slice(0, 200) }))
    .filter((img) => img.url)
    .slice(0, 20);
  if (images.length === 0) throw new ProductFormError("Agrega al menos una imagen.");
  // Solo rutas locales (/public) o fotos subidas a Vercel Blob: una URL externa no listada en
  // `images.remotePatterns` rompe la foto en la tienda (usa next/image).
  if (images.some((img) => !isAllowedImageUrl(img.url))) {
    throw new ProductFormError(
      "Las imágenes deben subirse con el botón «Subir foto» o ser rutas locales (que empiecen con /), como /tapetes/archivo.webp.",
    );
  }

  const optionName = String(formData.get("optionName") ?? "").trim().slice(0, 40);
  const variants = parseJson<Record<string, unknown>[]>(formData.get("variants"), [])
    .map((v) => ({
      id: typeof v?.id === "string" && /^[a-z0-9]{20,40}$/.test(v.id) ? v.id : null,
      label: String(v?.label ?? "").trim().slice(0, 60),
      sku: String(v?.sku ?? "").trim().slice(0, 60),
      price: Number(v?.price),
      compareAtPrice: v?.compareAtPrice !== "" && v?.compareAtPrice != null ? Number(v.compareAtPrice) : null,
      stock: Math.max(0, Math.trunc(Number(v?.stock) || 0)),
      isActive: Boolean(v?.isActive),
    }))
    .filter((v) => v.sku && Number.isFinite(v.price) && v.price >= 0)
    .slice(0, 50);
  if (variants.length === 0) throw new ProductFormError("Agrega al menos una variante con SKU y precio.");
  const skus = new Set(variants.map((v) => v.sku));
  if (skus.size !== variants.length) throw new ProductFormError("Hay SKUs repetidos entre las variantes.");
  for (const v of variants) {
    if (v.compareAtPrice !== null && (!Number.isFinite(v.compareAtPrice) || v.compareAtPrice <= v.price)) {
      throw new ProductFormError(`El precio tachado de "${v.sku}" debe ser mayor que su precio.`);
    }
  }
  const hasLabels = variants.some((v) => v.label);

  // El precio y el precio tachado del producto (los que se muestran en listados y tarjetas) se
  // calculan de la variante activa más barata — igual que lo hace la tienda al leer el catálogo
  // (ver toSummary en lib/products.ts). No se capturan aparte para que no queden desincronizados.
  const withStock = variants.filter((v) => v.isActive);
  const cheapest = (withStock.length ? withStock : variants).reduce((min, v) => (v.price < min.price ? v : min));

  return {
    name,
    slug,
    brand: String(formData.get("brand") ?? "").trim().slice(0, 120) || null,
    shortDescription: String(formData.get("shortDescription") ?? "").trim().slice(0, 300) || null,
    description: String(formData.get("description") ?? "").trim().slice(0, 5000) || null,
    status,
    isFeatured: formData.get("isFeatured") === "on",
    price: cheapest.price,
    compareAtPrice: cheapest.compareAtPrice,
    format: String(formData.get("format") ?? "").trim().slice(0, 120) || null,
    areaPerBox,
    seoTitle: String(formData.get("seoTitle") ?? "").trim().slice(0, 160) || null,
    seoDescription: String(formData.get("seoDescription") ?? "").trim().slice(0, 300) || null,
    categoryIds,
    attributes,
    specs,
    images,
    optionName: hasLabels ? optionName || "Opción" : null,
    variants,
    hasLabels,
  };
}

// Reemplaza imágenes y el eje de opción completos (nadie más los referencia por id); conserva el id
// de las variantes que ya existían para no invalidar los carritos guardados con ese id.
async function writeNestedData(tx: Prisma.TransactionClient, productId: string, data: ReturnType<typeof parseCore>) {
  await tx.productImage.deleteMany({ where: { productId } });
  await tx.productImage.createMany({
    data: data.images.map((img, i) => ({ productId, url: img.url, alt: img.alt, position: i })),
  });

  await tx.productOption.deleteMany({ where: { productId } }); // en cascada: valores y sus vínculos con variantes
  const valueIds: string[] = [];
  if (data.hasLabels) {
    const option = await tx.productOption.create({ data: { productId, name: data.optionName! } });
    for (const [i, v] of data.variants.entries()) {
      const value = await tx.productOptionValue.create({
        data: { optionId: option.id, value: v.label || `Variante ${i + 1}`, position: i },
      });
      valueIds.push(value.id);
    }
  }

  const existing = await tx.productVariant.findMany({ where: { productId }, select: { id: true } });
  const existingIds = new Set(existing.map((v) => v.id));
  const keepIds = new Set(data.variants.map((v) => v.id).filter(Boolean) as string[]);
  const toDelete = [...existingIds].filter((id) => !keepIds.has(id));
  if (toDelete.length) await tx.productVariant.deleteMany({ where: { id: { in: toDelete } } });

  for (const [i, v] of data.variants.entries()) {
    const variantData = {
      sku: v.sku,
      price: v.price,
      compareAtPrice: v.compareAtPrice,
      stock: v.stock,
      isActive: v.isActive,
      isDefault: i === 0,
      position: i,
    };
    const variantId =
      v.id && existingIds.has(v.id)
        ? (await tx.productVariant.update({ where: { id: v.id }, data: variantData, select: { id: true } })).id
        : (await tx.productVariant.create({ data: { ...variantData, productId }, select: { id: true } })).id;
    if (data.hasLabels) {
      await tx.variantOptionValue.deleteMany({ where: { variantId } });
      await tx.variantOptionValue.create({ data: { variantId, optionValueId: valueIds[i] } });
    }
  }
}

export async function createProduct(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  const admin = await authorize("MANAGE_CATALOG");
  if (!admin) return { status: "error", message: "Tu sesión ya no tiene permiso para editar el catálogo." };

  let data: ReturnType<typeof parseCore>;
  try {
    data = parseCore(formData);
  } catch (error) {
    if (error instanceof ProductFormError) return { status: "error", message: error.message };
    throw error;
  }

  let productId: string;
  try {
    productId = await db.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: data.name,
          slug: data.slug,
          brand: data.brand,
          shortDescription: data.shortDescription,
          description: data.description,
          status: data.status,
          isFeatured: data.isFeatured,
          price: data.price,
          compareAtPrice: data.compareAtPrice,
          format: data.format,
          areaPerBox: data.areaPerBox,
          seoTitle: data.seoTitle,
          seoDescription: data.seoDescription,
          attributes: data.attributes,
          specs: data.specs,
          publishedAt: data.status === "ACTIVE" ? new Date() : null,
          categories: { connect: data.categoryIds.map((id) => ({ id })) },
        },
      });
      await writeNestedData(tx, product.id, data);
      return product.id;
    });
  } catch (error) {
    return { status: "error", message: slugOrSkuErrorMessage(error) };
  }

  revalidateTag(CACHE_TAGS.catalog, "max");
  redirect(`/admin/productos/${productId}`);
}

export async function updateProduct(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  const admin = await authorize("MANAGE_CATALOG");
  if (!admin) return { status: "error", message: "Tu sesión ya no tiene permiso para editar el catálogo." };

  const productId = String(formData.get("productId") ?? "");
  if (!/^[a-z0-9]{20,40}$/.test(productId)) return { status: "error", message: "Producto no válido." };

  let data: ReturnType<typeof parseCore>;
  try {
    data = parseCore(formData);
  } catch (error) {
    if (error instanceof ProductFormError) return { status: "error", message: error.message };
    throw error;
  }

  try {
    await db.$transaction(async (tx) => {
      const current = await tx.product.findUnique({ where: { id: productId }, select: { status: true } });
      if (!current) throw new ProductFormError("No encontramos este producto.");
      await tx.product.update({
        where: { id: productId },
        data: {
          name: data.name,
          slug: data.slug,
          brand: data.brand,
          shortDescription: data.shortDescription,
          description: data.description,
          status: data.status,
          isFeatured: data.isFeatured,
          price: data.price,
          compareAtPrice: data.compareAtPrice,
          format: data.format,
          areaPerBox: data.areaPerBox,
          seoTitle: data.seoTitle,
          seoDescription: data.seoDescription,
          attributes: data.attributes,
          specs: data.specs,
          publishedAt: current.status !== "ACTIVE" && data.status === "ACTIVE" ? new Date() : undefined,
          categories: { set: data.categoryIds.map((id) => ({ id })) },
        },
      });
      await writeNestedData(tx, productId, data);
    });
  } catch (error) {
    if (error instanceof ProductFormError) return { status: "error", message: error.message };
    return { status: "error", message: slugOrSkuErrorMessage(error) };
  }

  revalidateTag(CACHE_TAGS.catalog, "max");
  redirect(`/admin/productos/${productId}`);
}

function slugOrSkuErrorMessage(error: unknown): string {
  const code = (error as { code?: string } | null)?.code;
  const meta = (error as { meta?: { target?: string[]; modelName?: string } } | null)?.meta;
  const target = meta?.target?.join(",") ?? "";
  if (code === "P2002" && (target.includes("slug") || meta?.modelName === "Product")) {
    return "Ese slug ya lo usa otro producto.";
  }
  if (code === "P2002" && (target.includes("sku") || meta?.modelName === "ProductVariant")) {
    return "Uno de los SKU ya existe en otra variante.";
  }
  console.error("Error al guardar el producto", error);
  return "No pudimos guardar el producto. Intenta de nuevo.";
}
