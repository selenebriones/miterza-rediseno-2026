import { issueSignedToken } from "@vercel/blob";
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { authorize } from "@/lib/admin/session";
import { IMAGE_MAX_BYTES, IMAGE_TYPES, isUploadPath } from "@/lib/admin/images";

// Subida de fotos del panel a Vercel Blob. El navegador pide aquí una URL firmada de un solo uso y
// sube el archivo directo a Blob (sin pasar por el servidor, que en Vercel solo acepta 4.5 MB).
// En Vercel la llave sale sola (OIDC + BLOB_STORE_ID); en local sirve también BLOB_READ_WRITE_TOKEN.
// Cada carpeta exige el permiso de su módulo; el proxy además saca a quien no tenga sesión de admin.
export async function POST(request: Request) {
  if (!process.env.BLOB_STORE_ID && !process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Falta conectar Vercel Blob al proyecto. Por ahora usa una ruta local (/tapetes/archivo.webp)." },
      { status: 503 },
    );
  }

  const body = (await request.json()) as HandleUploadPresignedBody;
  try {
    const result = await handleUploadPresigned({
      body,
      request,
      getSignedToken: async (pathname) => {
        if (!isUploadPath(pathname)) throw new Error("Nombre de archivo no permitido.");
        const permission = pathname.startsWith("contenido/") ? "MANAGE_CONTENT" : "MANAGE_CATALOG";
        const user = await authorize(permission);
        if (!user) throw new Error("No tienes permiso para subir imágenes.");
        const limits = { allowedContentTypes: [...IMAGE_TYPES], maximumSizeInBytes: IMAGE_MAX_BYTES };
        const token = await issueSignedToken({
          pathname,
          operations: ["put"],
          validUntil: Date.now() + 10 * 60 * 1000,
          ...limits,
        });
        // El nombre ya trae un sufijo único desde el navegador: nunca pisar una foto existente.
        return { token, urlOptions: { ...limits, allowOverwrite: false } };
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error al autorizar la subida de imagen", error);
    const message = error instanceof Error && /permiso|permitido/.test(error.message) ? error.message : "No se pudo subir la imagen.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
