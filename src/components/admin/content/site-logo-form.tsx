"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { CheckCircle2Icon, Loader2Icon } from "lucide-react";
import { ImageUploadButton } from "@/components/admin/image-upload-button";
import { saveSiteLogo } from "@/app/admin/(panel)/contenido/sitio/actions";

export function SiteLogoForm({ initialLogoUrl }: { initialLogoUrl: string }) {
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [state, action, pending] = useActionState(saveSiteLogo, {} as { error?: string; saved?: string });
  return <form action={action} className="space-y-4 rounded-card bg-white p-5 shadow-card">
    <input type="hidden" name="logoUrl" value={logoUrl} />
    <div><h2 className="text-lg font-bold">Logo del sitio</h2><p className="mt-1 text-sm text-muted-foreground">Se usa en el Header y el Footer.</p></div>
    <div className="flex flex-wrap items-center gap-4">
      <div className="grid h-20 min-w-44 place-items-center rounded-lg border border-line bg-white px-5"><Image src={logoUrl} alt="Vista previa del logo" width={206} height={90} unoptimized={logoUrl.startsWith("https://")} className="max-h-14 w-auto object-contain" /></div>
      <div className="space-y-2"><ImageUploadButton folder="contenido" label="Subir logo" onUploaded={setLogoUrl} /><p className="max-w-sm text-xs text-muted-foreground">Usa una imagen horizontal con fondo transparente.</p></div>
    </div>
    <div className="flex flex-wrap items-center gap-3"><button disabled={pending} className="inline-flex h-10 items-center gap-2 rounded-pill bg-brand px-5 text-sm font-semibold text-white disabled:opacity-60">{pending && <Loader2Icon className="size-4 animate-spin" />}{pending ? "Guardando…" : "Guardar logo"}</button>{state.saved && <p className="flex items-center gap-1 text-sm text-emerald-700"><CheckCircle2Icon className="size-4" />{state.saved}</p>}{state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}</div>
  </form>;
}
