"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CheckCircle2Icon, ExternalLinkIcon, Loader2Icon } from "lucide-react";
import { saveEditablePage } from "@/app/admin/(panel)/contenido/paginas/actions";
import { PolicyRichEditor } from "@/components/admin/content/policy-rich-editor";

const input = "h-11 w-full rounded-lg border border-input bg-white px-3 text-base text-heading";
const label = "mb-1.5 block text-sm font-medium text-heading";

export function PageContentForm({ page }: { page: { id: string; slug: string; title: string; content: string; seoTitle: string | null; seoDescription: string | null; isPublished: boolean } }) {
  const [state, action, pending] = useActionState(saveEditablePage, {});
  return <form action={action} className="mt-6 space-y-5">
    <input type="hidden" name="pageId" value={page.id} />
    <section className="space-y-4 rounded-card bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold">Contenido de la página</h2><p className="mt-1 text-sm text-muted-foreground">Ruta: <code className="rounded bg-mist px-1.5 py-0.5">/politicas/{page.slug}</code></p></div><Link href={`/politicas/${page.slug}`} target="_blank" className="inline-flex h-9 items-center gap-2 rounded-pill border border-brand px-3 text-sm font-semibold text-brand">Vista previa <ExternalLinkIcon className="size-4" /></Link></div>
      <div><label className={label} htmlFor="title">Título visible</label><input id="title" name="title" required maxLength={160} defaultValue={page.title} className={input} /></div>
      <div><label className={label}>Texto y estructura</label><PolicyRichEditor initialContent={page.content} /></div>
      <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" name="isPublished" defaultChecked={page.isPublished} />Publicada y visible en la tienda</label>
    </section>
    <section className="space-y-4 rounded-card bg-white p-5 shadow-card">
      <div><h2 className="text-lg font-bold">Buscadores</h2><p className="mt-1 text-sm text-muted-foreground">Opcional: reemplaza los metadatos que se generan a partir del título y el texto.</p></div>
      <div><label className={label} htmlFor="seoTitle">Título SEO</label><input id="seoTitle" name="seoTitle" maxLength={160} defaultValue={page.seoTitle ?? ""} className={input} /></div>
      <div><label className={label} htmlFor="seoDescription">Descripción SEO</label><textarea id="seoDescription" name="seoDescription" rows={3} maxLength={320} defaultValue={page.seoDescription ?? ""} className="w-full rounded-lg border border-input bg-white px-3 py-2 text-base text-heading" /></div>
    </section>
    <div className="flex flex-wrap items-center gap-3"><button disabled={pending} className="inline-flex h-11 items-center gap-2 rounded-pill bg-brand px-5 font-semibold text-white disabled:opacity-60">{pending && <Loader2Icon className="size-4 animate-spin" />}{pending ? "Guardando…" : "Guardar página"}</button>{state.saved && <p className="flex items-center gap-1 text-sm text-emerald-700"><CheckCircle2Icon className="size-4" />{state.saved}</p>}{state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}</div>
  </form>;
}
