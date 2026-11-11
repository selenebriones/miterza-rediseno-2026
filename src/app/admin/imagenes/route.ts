import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { authorize } from "@/lib/admin/session";
import { IMAGE_FOLDERS, IMAGE_MAX_BYTES, IMAGE_TYPES } from "@/lib/admin/images";

// Subida de fotos del panel a Vercel Blob. El navegador pide aquí un permiso de un solo uso y sube el
// archivo directo a Blob (sin pasar por el servidor, que en Vercel solo acepta 4.5 MB por petición).
// Solo administradores con permiso de catálogo; el proxy además saca a quien no tenga sesión de admin.
export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Falta conectar Vercel Blob al proyecto. Por ahora usa una ruta local (/tapetes/archivo.webp)." },
      { status: 503 },
    );
  }

  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const user = await authorize("MANAGE_CATALOG");
        if (!user) throw new Error("No tienes permiso para subir imágenes.");
        const folder = pathname.split("/")[0];
        if (!IMAGE_FOLDERS.includes(folder as (typeof IMAGE_FOLDERS)[number])) throw new Error("Carpeta no permitida.");
        return {
          allowedContentTypes: [...IMAGE_TYPES],
          maximumSizeInBytes: IMAGE_MAX_BYTES,
          // Nombre único: subir dos fotos con el mismo nombre no pisa la anterior.
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo subir la imagen.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
