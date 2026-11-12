"use client";

import { useActionState } from "react";
import { CheckCircle2Icon, Loader2Icon } from "lucide-react";
import { saveSiteContent } from "@/app/admin/(panel)/contenido/sitio/actions";
import type { SiteContentSettings } from "@/lib/site-settings";

const input = "h-11 w-full rounded-lg border border-input bg-white px-3 text-base text-heading";
const label = "mb-1.5 block text-sm font-medium text-heading";

export function SiteSettingsForm({ settings }: { settings: SiteContentSettings }) {
  const [state, action, pending] = useActionState(saveSiteContent, {} as { error?: string; saved?: string });
  return <form action={action} className="mt-6 space-y-6">
    <section className="space-y-4 rounded-card bg-white p-5 shadow-card">
      <h2 className="text-lg font-bold">Pie de página</h2>
      <div><label htmlFor="footerDescription" className={label}>Descripción de Terza</label><textarea id="footerDescription" name="footerDescription" rows={4} maxLength={500} defaultValue={settings.footerDescription} className="w-full rounded-lg border border-input bg-white px-3 py-2 text-base text-heading" /></div>
      <div><label htmlFor="footerCopyright" className={label}>Leyenda de derechos reservados</label><input id="footerCopyright" name="footerCopyright" maxLength={160} defaultValue={settings.footerCopyright} className={input} /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="supportPhone" className={label}>Teléfono de contacto</label><input id="supportPhone" name="supportPhone" maxLength={80} defaultValue={settings.supportPhone} className={input} /></div>
        <div><label htmlFor="supportEmail" className={label}>Correo de contacto</label><input id="supportEmail" name="supportEmail" type="email" maxLength={254} defaultValue={settings.supportEmail} className={input} /></div>
      </div>
    </section>
    <section className="space-y-4 rounded-card bg-white p-5 shadow-card">
      <h2 className="text-lg font-bold">Redes sociales</h2>
      <div className="grid gap-4 sm:grid-cols-2">{settings.social.map((item) => <div key={item.network} className="space-y-2"><div><label htmlFor={`social-label-${item.network}`} className={label}>Nombre visible</label><input id={`social-label-${item.network}`} name={`social-label-${item.network}`} maxLength={40} defaultValue={item.label} className={input} /></div><div><label htmlFor={`social-${item.network}`} className={label}>Enlace de {item.label}</label><input id={`social-${item.network}`} name={`social-${item.network}`} type="url" defaultValue={item.url} placeholder="Dejar vacío para ocultar" className={input} /></div></div>)}</div>
    </section>
    <div className="flex flex-wrap items-center gap-3"><button disabled={pending} className="inline-flex h-11 items-center gap-2 rounded-pill bg-brand px-5 font-semibold text-white disabled:opacity-60">{pending && <Loader2Icon className="size-4 animate-spin" />}{pending ? "Guardando…" : "Guardar cambios"}</button>{state.saved && <p className="flex items-center gap-1 text-sm text-emerald-700"><CheckCircle2Icon className="size-4" />{state.saved}</p>}{state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}</div>
  </form>;
}
