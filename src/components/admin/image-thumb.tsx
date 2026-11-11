"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { isAllowedImageUrl } from "@/lib/admin/images";

// Miniatura de la foto en los formularios del panel, para confirmar que la ruta o la subida es la correcta.
export function ImageThumb({ url }: { url: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  const show = url && isAllowedImageUrl(url) && failed !== url;
  return (
    <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-mist">
      {show ? (
        // eslint-disable-next-line @next/next/no-img-element -- vista previa del panel, sin optimizar
        <img src={url} alt="" className="size-full object-cover" onError={() => setFailed(url)} />
      ) : (
        <ImageIcon className="size-4 text-muted-foreground" aria-hidden="true" />
      )}
    </span>
  );
}
