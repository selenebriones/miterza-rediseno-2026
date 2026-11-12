"use client";

import { useActionState, useState } from "react";
import { CheckCircle2Icon, ChevronDownIcon, ChevronUpIcon, Loader2Icon, PlusIcon, Trash2Icon } from "lucide-react";
import { saveSiteMenus } from "@/app/admin/(panel)/contenido/sitio/menu-actions";

export type EditableMenuItem = { label: string; href: string; isVisible: boolean; isHighlight: boolean; openInNewTab: boolean; children: EditableMenuItem[] };
export type EditableMenu = { location: "HEADER_MAIN" | "HEADER_TOP" | "FOOTER" | "FOOTER_LEGAL"; name: string; items: EditableMenuItem[] };

const input = "h-10 w-full rounded-lg border border-input bg-white px-3 text-sm text-heading";
const locationLabels: Record<EditableMenu["location"], string> = { HEADER_MAIN: "Navegación principal", HEADER_TOP: "Barra superior", FOOTER: "Columnas del pie", FOOTER_LEGAL: "Enlaces legales" };

function move<T>(items: T[], index: number, delta: number) { const next = [...items]; const target = index + delta; if (target < 0 || target >= next.length) return items; [next[index], next[target]] = [next[target], next[index]]; return next; }

export function SiteMenusForm({ initialMenus }: { initialMenus: EditableMenu[] }) {
  const [menus, setMenus] = useState(initialMenus);
  const [state, action, pending] = useActionState(saveSiteMenus, {} as { error?: string; saved?: string });
  const updateMenu = (index: number, patch: Partial<EditableMenu>) => setMenus((current) => current.map((m, i) => i === index ? { ...m, ...patch } : m));
  const updateItem = (menuIndex: number, path: number[], patch: Partial<EditableMenuItem>) => setMenus((current) => current.map((menu, mi) => {
    if (mi !== menuIndex) return menu;
    const update = (items: EditableMenuItem[], depth: number): EditableMenuItem[] => items.map((item, i) => i !== path[depth] ? item : depth === path.length - 1 ? { ...item, ...patch } : { ...item, children: update(item.children, depth + 1) });
    return { ...menu, items: update(menu.items, 0) };
  }));
  const removeItem = (menuIndex: number, path: number[]) => setMenus((current) => current.map((menu, mi) => {
    if (mi !== menuIndex) return menu;
    const remove = (items: EditableMenuItem[], depth: number): EditableMenuItem[] => depth === path.length - 1 ? items.filter((_, i) => i !== path[depth]) : items.map((item, i) => i === path[depth] ? { ...item, children: remove(item.children, depth + 1) } : item);
    return { ...menu, items: remove(menu.items, 0) };
  }));
  const appendItem = (menuIndex: number, parentPath?: number[]) => setMenus((current) => current.map((menu, mi) => {
    if (mi !== menuIndex) return menu;
    const fresh: EditableMenuItem = { label: "Nuevo enlace", href: "/", isVisible: true, isHighlight: false, openInNewTab: false, children: [] };
    if (!parentPath) return { ...menu, items: [...menu.items, fresh] };
    const add = (items: EditableMenuItem[], depth: number): EditableMenuItem[] => items.map((item, i) => i !== parentPath[depth] ? item : depth === parentPath.length - 1 ? { ...item, children: [...item.children, fresh] } : { ...item, children: add(item.children, depth + 1) });
    return { ...menu, items: add(menu.items, 0) };
  }));

  const renderItem = (menuIndex: number, item: EditableMenuItem, path: number[], nested = false) => {
    const index = path.at(-1)!;
    return <div key={path.join("-")} className={`space-y-3 rounded-lg border border-line p-4 ${nested ? "bg-surface/50" : "bg-white"}`}>
      <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr_auto]">
        <label className="text-xs font-medium text-muted-foreground">Texto<input value={item.label} maxLength={80} onChange={(e) => updateItem(menuIndex, path, { label: e.target.value })} className={`${input} mt-1`} /></label>
        <label className="text-xs font-medium text-muted-foreground">Enlace<input value={item.href} maxLength={500} onChange={(e) => updateItem(menuIndex, path, { href: e.target.value })} placeholder="/productos o https://…" className={`${input} mt-1`} /></label>
        <div className="flex items-end gap-1">
          <button type="button" aria-label="Subir" onClick={() => setMenus((all) => all.map((m, mi) => mi !== menuIndex ? m : { ...m, items: path.length === 1 ? move(m.items, index, -1) : m.items.map((root, ri) => ri === path[0] ? { ...root, children: move(root.children, index, -1) } : root) }))} className="grid size-9 place-items-center rounded-md border border-line"><ChevronUpIcon className="size-4" /></button>
          <button type="button" aria-label="Bajar" onClick={() => setMenus((all) => all.map((m, mi) => mi !== menuIndex ? m : { ...m, items: path.length === 1 ? move(m.items, index, 1) : m.items.map((root, ri) => ri === path[0] ? { ...root, children: move(root.children, index, 1) } : root) }))} className="grid size-9 place-items-center rounded-md border border-line"><ChevronDownIcon className="size-4" /></button>
          <button type="button" aria-label="Eliminar enlace" onClick={() => removeItem(menuIndex, path)} className="grid size-9 place-items-center rounded-md border border-line text-danger"><Trash2Icon className="size-4" /></button>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={item.isVisible} onChange={(e) => updateItem(menuIndex, path, { isVisible: e.target.checked })} />Visible</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={item.isHighlight} onChange={(e) => updateItem(menuIndex, path, { isHighlight: e.target.checked })} />Resaltar</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={item.openInNewTab} onChange={(e) => updateItem(menuIndex, path, { openInNewTab: e.target.checked })} />Abrir en pestaña nueva</label>
      </div>
      {!nested && <><div className="space-y-2 border-l-2 border-line pl-4">{item.children.map((child, childIndex) => renderItem(menuIndex, child, [...path, childIndex], true))}</div><button type="button" onClick={() => appendItem(menuIndex, path)} className="text-sm font-semibold text-brand">+ Agregar subenlace</button></>}
    </div>;
  };

  return <form action={action} className="mt-6 space-y-5">
    <input type="hidden" name="menusJson" value={JSON.stringify(menus)} />
    {menus.map((menu, index) => <section key={menu.location} className="space-y-4 rounded-card bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3"><div><h2 className="text-lg font-bold">{locationLabels[menu.location]}</h2><p className="text-xs text-muted-foreground">{menu.location === "HEADER_MAIN" ? "Los elementos con subenlaces abren un menú desplegable." : menu.location === "FOOTER" ? "Cada elemento principal crea una columna; agrega subenlaces dentro." : "Edita el nombre y los enlaces que aparecen en esta zona."}</p></div><label className="min-w-52 text-xs font-medium text-muted-foreground">Nombre interno<input value={menu.name} maxLength={80} onChange={(e) => updateMenu(index, { name: e.target.value })} className={`${input} mt-1`} /><span className="mt-1 block text-[11px]">En Enlaces legales también es el encabezado visible.</span></label></div>
      <div className="space-y-3">{menu.items.map((item, itemIndex) => renderItem(index, item, [itemIndex]))}</div>
      <button type="button" onClick={() => appendItem(index)} className="inline-flex h-9 items-center gap-1 rounded-pill border border-brand px-4 text-sm font-semibold text-brand"><PlusIcon className="size-4" />Agregar elemento</button>
    </section>)}
    <div className="flex flex-wrap items-center gap-3"><button disabled={pending} className="inline-flex h-11 items-center gap-2 rounded-pill bg-brand px-5 font-semibold text-white disabled:opacity-60">{pending && <Loader2Icon className="size-4 animate-spin" />}{pending ? "Guardando…" : "Guardar menús y enlaces"}</button>{state.saved && <p className="flex items-center gap-1 text-sm text-emerald-700"><CheckCircle2Icon className="size-4" />{state.saved}</p>}{state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}</div>
  </form>;
}
