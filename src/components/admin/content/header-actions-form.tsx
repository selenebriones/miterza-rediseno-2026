"use client";

import { useActionState, useState } from "react";
import { CheckCircle2Icon, ChevronDownIcon, ChevronUpIcon, Loader2Icon } from "lucide-react";
import { saveHeaderActions } from "@/app/admin/(panel)/contenido/sitio/actions";
import { HEADER_ICON_OPTIONS, normalizeHeaderActions } from "@/lib/header-actions";
import type { HeaderActionSetting } from "@/lib/site-settings";
import { HeaderActionIcon } from "@/components/header/header-action-icon";

const titles = { search: "Buscar", favorites: "Favoritos", account: "Mi cuenta", cart: "Carrito" } as const;

export function HeaderActionsForm({ initialActions }: { initialActions: HeaderActionSetting[] }) {
  const [actions, setActions] = useState(() => normalizeHeaderActions(initialActions));
  const [state, formAction, pending] = useActionState(saveHeaderActions, {} as { error?: string; saved?: string });
  const move = (index: number, direction: -1 | 1) => setActions((items) => {
    const next = [...items]; const target = index + direction;
    if (target < 0 || target >= next.length) return items;
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });
  return <form action={formAction} className="space-y-4 rounded-card bg-white p-5 shadow-card">
    <input type="hidden" name="headerActionsJson" value={JSON.stringify(actions)} />
    <div><h2 className="text-lg font-bold">Iconos de acceso rápido</h2><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Elige icono, etiqueta, orden y visibilidad. Favoritos y Mi cuenta aceptan otro destino interno; Buscar y Carrito conservan su acción.</p></div>
    <ol className="space-y-3">{actions.map((item, index) => <li key={item.key} className="space-y-3 rounded-lg border border-line p-4"><div className="flex flex-wrap items-center justify-between gap-3"><label className="flex min-h-10 items-center gap-3 font-medium"><input type="checkbox" checked={item.visible} onChange={(event) => setActions((items) => items.map((entry) => entry.key === item.key ? { ...entry, visible: event.target.checked } : entry))} /><span className="grid size-10 place-items-center rounded-full bg-surface text-sm" aria-hidden="true">{index + 1}</span><span className="grid size-10 place-items-center rounded-full border border-line"><HeaderActionIcon icon={item.icon} className="size-5 text-brand" /></span>{titles[item.key]}</label><div className="flex gap-1"><button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Subir ${titles[item.key]}`} className="grid size-9 place-items-center rounded-md border border-line disabled:opacity-40"><ChevronUpIcon className="size-4" /></button><button type="button" onClick={() => move(index, 1)} disabled={index === actions.length - 1} aria-label={`Bajar ${titles[item.key]}`} className="grid size-9 place-items-center rounded-md border border-line disabled:opacity-40"><ChevronDownIcon className="size-4" /></button></div></div><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-medium text-muted-foreground">Icono<select value={item.icon} onChange={(event) => setActions((items) => items.map((entry) => entry.key === item.key ? { ...entry, icon: event.target.value as HeaderActionSetting["icon"] } : entry))} className="mt-1 h-10 w-full rounded-lg border border-input bg-white px-3 text-sm text-heading">{HEADER_ICON_OPTIONS[item.key].map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><label className="text-xs font-medium text-muted-foreground">Texto accesible<input value={item.label} maxLength={40} onChange={(event) => setActions((items) => items.map((entry) => entry.key === item.key ? { ...entry, label: event.target.value } : entry))} className="mt-1 h-10 w-full rounded-lg border border-input bg-white px-3 text-sm text-heading" /></label>{(item.key === "favorites" || item.key === "account") ? <label className="text-xs font-medium text-muted-foreground sm:col-span-2">Destino interno<input value={item.href ?? ""} maxLength={500} onChange={(event) => setActions((items) => items.map((entry) => entry.key === item.key ? { ...entry, href: event.target.value } : entry))} placeholder={item.key === "favorites" ? "/favoritos" : "/cuenta"} className="mt-1 h-10 w-full rounded-lg border border-input bg-white px-3 text-sm text-heading" /></label> : <p className="self-end text-xs text-muted-foreground sm:col-span-2">Este acceso ejecuta la acción de {item.key === "search" ? "abrir la búsqueda" : "abrir el carrito"}; no usa una URL.</p>}</div></li>)}</ol>
    <p className="text-xs text-muted-foreground">Los destinos editables aceptan rutas del mismo sitio. Los iconos y textos también se aplican al menú móvil.</p>
    <div className="flex flex-wrap items-center gap-3"><button disabled={pending} className="inline-flex h-10 items-center gap-2 rounded-pill bg-brand px-5 text-sm font-semibold text-white disabled:opacity-60">{pending && <Loader2Icon className="size-4 animate-spin" />}{pending ? "Guardando…" : "Guardar iconos"}</button>{state.saved && <p className="flex items-center gap-1 text-sm text-emerald-700"><CheckCircle2Icon className="size-4" />{state.saved}</p>}{state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}</div>
  </form>;
}
