"use client";

import { useId, useRef, useState } from "react";
import { uploadPresigned } from "@vercel/blob/client";
import { Loader2Icon, UploadIcon } from "lucide-react";
import { IMAGE_MAX_BYTES, IMAGE_MAX_LABEL, IMAGE_TYPES, type ImageFolder } from "@/lib/admin/images";

// Botón "Subir foto" del panel: sube el archivo directo del navegador a Vercel Blob (la ruta
// /admin/imagenes solo firma la URL) y entrega la URL pública para guardarla con el producto o categoría.
export function ImageUploadButton({
  folder,
  onUploaded,
  label = "Subir foto",
}: {
  folder: ImageFolder;
  onUploaded: (url: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const uploading = progress !== null;

  async function handleFile(file: File) {
    setError(null);
    if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) {
      setError("Usa una foto WEBP, JPG, PNG o AVIF.");
      return;
    }
    if (file.size > IMAGE_MAX_BYTES) {
      setError(`La foto pesa más de ${IMAGE_MAX_LABEL}. Redúcela e intenta de nuevo.`);
      return;
    }
    setProgress(0);
    try {
      const blob = await uploadPresigned(`${folder}/${safeName(file.name)}`, file, {
        access: "public",
        handleUploadUrl: "/admin/imagenes",
        onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
      });
      onUploaded(blob.url);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void handleFile(file);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-describedby={error ? errorId : undefined}
        className="inline-flex h-11 shrink-0 items-center gap-2 rounded-pill border border-brand px-4 text-sm font-semibold whitespace-nowrap text-brand transition-colors hover:bg-brand hover:text-white disabled:border-line disabled:text-muted-foreground disabled:hover:bg-transparent"
      >
        {uploading ? (
          <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <UploadIcon className="size-4" aria-hidden="true" />
        )}
        {uploading ? `Subiendo… ${progress}%` : label}
      </button>
      {error && (
        <p id={errorId} role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

// Nombre de archivo sin acentos ni espacios, con un sufijo único para no pisar otra foto.
function safeName(name: string) {
  const dot = name.lastIndexOf(".");
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
  const ext = (dot > 0 ? name.slice(dot + 1).toLowerCase() : "").replace("jpeg", "jpg");
  const suffix = crypto.randomUUID().slice(0, 8);
  return `${base || "foto"}-${suffix}.${["webp", "jpg", "png", "avif"].includes(ext) ? ext : "webp"}`;
}

function friendlyError(err: unknown) {
  const message = err instanceof Error ? err.message : "";
  if (/Vercel Blob/i.test(message) && /conectar/i.test(message)) return message;
  if (/permiso/i.test(message)) return "No tienes permiso para subir imágenes.";
  if (/presigned|client token|503/i.test(message)) {
    return "No se pudo subir: falta conectar Vercel Blob al proyecto o tu sesión terminó.";
  }
  return "No se pudo subir la foto. Revisa tu conexión e intenta de nuevo.";
}
