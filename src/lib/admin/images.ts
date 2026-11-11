// Reglas de las fotos que se suben desde el panel a Vercel Blob. Lo comparten la ruta de subida,
// el botón del formulario y la validación al guardar el producto.

export const IMAGE_FOLDERS = ["productos", "categorias"] as const;
export type ImageFolder = (typeof IMAGE_FOLDERS)[number];

export const IMAGE_TYPES = ["image/webp", "image/jpeg", "image/png", "image/avif"] as const;
export const IMAGE_MAX_BYTES = 8 * 1024 * 1024;
export const IMAGE_MAX_LABEL = "8 MB";

// Ruta dentro de Blob que arma el botón: carpeta/nombre-limpio-sufijo.ext
const UPLOAD_PATH = /^([a-z]+)\/[a-z0-9-]{1,80}\.(webp|jpe?g|png|avif)$/;

export function isUploadPath(pathname: string) {
  const match = UPLOAD_PATH.exec(pathname);
  return Boolean(match && IMAGE_FOLDERS.includes(match[1] as ImageFolder));
}

// Las fotos públicas de Blob viven en <id>.public.blob.vercel-storage.com.
const BLOB_HOST = /^[a-z0-9]+\.public\.blob\.vercel-storage\.com$/i;

export function isBlobUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && BLOB_HOST.test(parsed.hostname);
  } catch {
    return false;
  }
}

// Ruta local de /public o foto subida a Blob: lo único que se ve bien en la tienda.
export function isAllowedImageUrl(url: string) {
  return (url.startsWith("/") && !url.startsWith("//")) || isBlobUrl(url);
}
