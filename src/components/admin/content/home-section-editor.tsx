"use client";

import { useActionState, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowDownIcon, ArrowUpIcon, CheckCircle2Icon, ExternalLinkIcon, Loader2Icon, PlusIcon, Trash2Icon } from "lucide-react";
import { updateHomeSection, type ContentFormState } from "@/app/admin/(panel)/contenido/actions";
import { ImageThumb } from "@/components/admin/image-thumb";
import { ImageUploadButton } from "@/components/admin/image-upload-button";

const inputClass = "h-11 w-full rounded-lg border border-input bg-white px-3 text-base text-heading focus-visible:border-brand";
const labelClass = "mb-1.5 block text-sm font-medium text-heading";
type Benefit = { icon: string; title: string; text: string; showPhone?: boolean };
type Tutorial = { title: string; lines: string; videoUrl: string };
type CategoryItem = { title: string; imageUrl: string; imageAlt: string; href: string };
type Settings = Record<string, unknown> & { items?: Benefit[]; eyebrow?: string; imageUrl?: string; imageAlt?: string; tutorials?: Tutorial[]; faq?: Record<string, string>; categoryItems?: CategoryItem[]; productSlugs?: string[] };

export type ContentChoice = { value: string; label: string; imageUrl: string | null; imageAlt?: string; href?: string; meta?: string | null; selectedByDefault?: boolean; editHref: string };
export type HomeSectionInitial = { id: string; type: string; title: string | null; subtitle: string | null; isActive: boolean; settings: Settings };

const ICONS = [["shield-check", "Escudo"], ["award", "Premio"], ["palette", "Variedad"], ["headset", "Asesoría"], ["truck", "Envíos"]] as const;

export function HomeSectionEditor({ section, description, choices = [] }: { section: HomeSectionInitial; description: string; choices?: ContentChoice[] }) {
  const [state, formAction, pending] = useActionState<ContentFormState, FormData>(updateHomeSection, { status: "idle" });
  const [settings, setSettings] = useState<Settings>(section.settings);
  const benefits = settings.items ?? [];
  const tutorials = settings.tutorials ?? [];
  const faq = settings.faq ?? {};
  const setBenefit = (index: number, change: Partial<Benefit>) => setSettings((current) => ({ ...current, items: (current.items ?? []).map((item, i) => i === index ? { ...item, ...change } : item) }));
  const setTutorial = (index: number, change: Partial<Tutorial>) => setSettings((current) => ({ ...current, tutorials: (current.tutorials ?? []).map((item, i) => i === index ? { ...item, ...change } : item) }));
  const setFaq = (change: Record<string, string>) => setSettings((current) => ({ ...current, faq: { ...(current.faq ?? {}), ...change } }));

  return (
    <form action={formAction} className="space-y-6 rounded-card bg-white p-5 shadow-card">
      <input type="hidden" name="sectionId" value={section.id} />
      <input type="hidden" name="settingsJson" value={JSON.stringify(settings)} />
      <p className="text-sm">{description}</p>
      {section.type !== "HERO_BANNERS" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Título"><input name="title" defaultValue={section.title ?? ""} className={inputClass} /></Field>
          <Field label="Subtítulo"><input name="subtitle" defaultValue={section.subtitle ?? ""} className={inputClass} /></Field>
        </div>
      ) : <><input type="hidden" name="title" value="" /><input type="hidden" name="subtitle" value="" /></>}

      {section.type === "CATEGORY_CAROUSEL" && <CategoryItemsEditor items={settings.categoryItems ?? []} onChange={(categoryItems) => setSettings({ ...settings, categoryItems })} />}
      {section.type === "FEATURED_PRODUCTS" && <ContentPicker label="Productos del carrusel" choices={choices} selected={settings.productSlugs ?? []} onChange={(productSlugs) => setSettings({ ...settings, productSlugs })} />}

      {section.type === "VALUE_PROPOSITION" && <div className="space-y-6">
        {benefits.map((item, index) => <fieldset key={`${item.title}-${index}`} className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
          <legend className="px-2 text-sm font-bold text-muted-foreground">Beneficio {index + 1}</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Ícono"><select value={item.icon} onChange={(event) => setBenefit(index, { icon: event.target.value })} className={inputClass}>{ICONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
            <Field label="Título"><input value={item.title} onChange={(event) => setBenefit(index, { title: event.target.value })} className={inputClass} /></Field>
            <div className="sm:col-span-2"><Field label="Descripción"><input value={item.text} onChange={(event) => setBenefit(index, { text: event.target.value })} className={inputClass} /></Field></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(item.showPhone)} onChange={(event) => setBenefit(index, { showPhone: event.target.checked })} className="size-5 accent-brand" />Mostrar teléfono</label>
            <div className="flex justify-end"><button type="button" onClick={() => setSettings({ ...settings, items: benefits.filter((_, i) => i !== index) })} className="inline-flex items-center gap-2 rounded-lg px-3 text-sm font-semibold text-danger hover:bg-red-50"><Trash2Icon className="size-4" />Quitar beneficio</button></div>
          </div>
        </fieldset>)}
        <AddButton onClick={() => setSettings({ ...settings, items: [...benefits, { icon: "shield-check", title: "", text: "" }] })}>Agregar beneficio</AddButton>
      </div>}

      {section.type === "INSTALL_GUIDE" && <div className="space-y-6">
        <fieldset className="space-y-5 rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
          <legend className="px-2 text-sm font-bold text-muted-foreground">Guía de instalación</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextSetting label="Etiqueta superior" value={String(settings.eyebrow ?? "")} onChange={(eyebrow) => setSettings({ ...settings, eyebrow })} />
            <ImageSetting label="Imagen" value={String(settings.imageUrl ?? "")} onChange={(imageUrl) => setSettings({ ...settings, imageUrl })} />
            <div className="sm:col-span-2"><TextSetting label="Texto alternativo (obligatorio)" value={String(settings.imageAlt ?? "")} onChange={(imageAlt) => setSettings({ ...settings, imageAlt })} /></div>
          </div>
          <div className="space-y-4 border-t border-line pt-5">
            <h3 className="font-semibold text-heading">Tutoriales</h3>
            {tutorials.map((item, index) => <fieldset key={`${item.title}-${index}`} className="grid gap-4 rounded-xl border border-line bg-surface p-4 sm:grid-cols-2">
              <legend className="px-2 text-sm font-semibold text-muted-foreground">Tutorial {index + 1}</legend>
              <TextSetting label="Título" value={item.title} onChange={(title) => setTutorial(index, { title })} />
              <TextSetting label="Líneas" value={item.lines} onChange={(lines) => setTutorial(index, { lines })} />
              <div className="sm:col-span-2"><TextSetting label="URL del video" value={item.videoUrl} onChange={(videoUrl) => setTutorial(index, { videoUrl })} /></div>
              <div className="flex justify-end sm:col-span-2"><button type="button" onClick={() => setSettings({ ...settings, tutorials: tutorials.filter((_, i) => i !== index) })} className="inline-flex items-center gap-2 rounded-lg px-3 text-sm font-semibold text-danger hover:bg-red-50"><Trash2Icon className="size-4" />Quitar tutorial</button></div>
            </fieldset>)}
            <AddButton onClick={() => setSettings({ ...settings, tutorials: [...tutorials, { title: "", lines: "", videoUrl: "" }] })}>Agregar tutorial</AddButton>
          </div>
        </fieldset>
        <fieldset className="grid gap-5 rounded-2xl border border-line bg-white p-5 shadow-sm sm:grid-cols-2 sm:p-6">
          <legend className="px-2 text-sm font-bold text-muted-foreground">Preguntas frecuentes</legend>
          {[["eyebrow", "Etiqueta superior"], ["title", "Título"], ["highlight", "Texto destacado"], ["text", "Descripción"], ["ctaLabel", "Texto del botón"], ["ctaUrl", "Enlace del botón"]].map(([key, label]) => <TextSetting key={key} label={label} value={faq[key] ?? ""} onChange={(value) => setFaq({ [key]: value })} />)}
          <ImageSetting label="Imagen" value={faq.imageUrl ?? ""} onChange={(imageUrl) => setFaq({ imageUrl })} />
          <TextSetting label="Texto alternativo (obligatorio)" value={faq.imageAlt ?? ""} onChange={(imageAlt) => setFaq({ imageAlt })} />
        </fieldset>
      </div>}

      <label className="flex min-h-tap items-center gap-2 font-medium"><input type="checkbox" name="isActive" defaultChecked={section.isActive} className="size-5 accent-brand" />Mostrar sección</label>
      <div className="flex items-center gap-3"><button disabled={pending} className="inline-flex h-11 items-center gap-2 rounded-pill bg-brand px-5 font-semibold text-white disabled:bg-line">{pending && <Loader2Icon className="size-4 animate-spin" />}{pending ? "Guardando…" : "Guardar cambios"}</button><Status state={state} /></div>
    </form>
  );
}

function CategoryItemsEditor({ items, onChange }: { items: CategoryItem[]; onChange: (items: CategoryItem[]) => void }) {
  const update = (index: number, change: Partial<CategoryItem>) => onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...change } : item));
  const move = (index: number, direction: -1 | 1) => {
    const next = [...items];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    onChange(next);
  };
  return <fieldset className="space-y-4 rounded-xl border border-line p-4">
    <legend className="px-2 font-bold">Tarjetas de “Compra por categoría”</legend>
    <p className="text-sm text-muted-foreground">Cada tarjeta es independiente del catálogo. Edita su contenido y ordénala como aparecerá en el Home.</p>
    <div className="space-y-3">{items.map((item, index) => <div key={index} className="grid gap-3 rounded-xl bg-mist p-4 sm:grid-cols-2">
      <div className="flex items-center justify-between gap-3 sm:col-span-2">
        <p className="font-bold text-heading">Tarjeta {index + 1}</p>
        <div className="flex gap-1">
          <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Subir tarjeta ${index + 1}`} className="grid size-9 place-items-center rounded-full bg-white disabled:opacity-30"><ArrowUpIcon className="size-4" /></button>
          <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label={`Bajar tarjeta ${index + 1}`} className="grid size-9 place-items-center rounded-full bg-white disabled:opacity-30"><ArrowDownIcon className="size-4" /></button>
          <button type="button" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Quitar tarjeta ${index + 1}`} className="grid size-9 place-items-center rounded-full bg-white text-danger"><Trash2Icon className="size-4" /></button>
        </div>
      </div>
      <Field label="Título"><input value={item.title} onChange={(event) => update(index, { title: event.target.value })} className={inputClass} /></Field>
      <Field label="Enlace"><input value={item.href} onChange={(event) => update(index, { href: event.target.value })} placeholder="/productos?categoria=tapetes" className={inputClass} /></Field>
      <ImageSetting label="Imagen" value={item.imageUrl} onChange={(imageUrl) => update(index, { imageUrl })} />
      <TextSetting label="Texto alternativo" value={item.imageAlt} onChange={(imageAlt) => update(index, { imageAlt })} />
    </div>)}</div>
    <AddButton onClick={() => onChange([...items, { title: "", imageUrl: "", imageAlt: "", href: "/productos" }])}>Agregar tarjeta</AddButton>
  </fieldset>;
}

function ContentPicker({ label, choices, selected, onChange }: { label: string; choices: ContentChoice[]; selected: string[]; onChange: (values: string[]) => void }) {
  const available = choices.filter((choice) => !selected.includes(choice.value));
  const [nextValue, setNextValue] = useState("");
  const selectedChoices = selected.flatMap((value) => { const choice = choices.find((item) => item.value === value); return choice ? [choice] : []; });
  const selectedValue = available.some((choice) => choice.value === nextValue) ? nextValue : (available[0]?.value ?? "");
  const move = (index: number, direction: -1 | 1) => {
    const next = [...selected];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    onChange(next);
  };
  return <fieldset className="space-y-4 rounded-xl border border-line p-4">
    <legend className="px-2 font-bold">{label}</legend>
    <p className="text-sm text-muted-foreground">Selecciona el contenido y acomódalo en el orden exacto en que aparecerá. Se mostrarán {selectedChoices.length}.</p>
    <div className="flex flex-col gap-2 sm:flex-row">
      <select value={selectedValue} onChange={(event) => setNextValue(event.target.value)} disabled={!available.length} className={inputClass}>{available.length ? available.map((choice) => <option key={choice.value} value={choice.value}>{choice.label}</option>) : <option>Todo el contenido disponible está seleccionado</option>}</select>
      <button type="button" disabled={!selectedValue} onClick={() => { if (selectedValue) { onChange([...selected, selectedValue]); setNextValue(""); } }} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-pill border border-brand px-4 text-sm font-semibold text-brand disabled:border-line disabled:text-muted-foreground"><PlusIcon className="size-4" />Agregar</button>
    </div>
    <div className="grid gap-2 md:grid-cols-2">{selectedChoices.map((choice, index) => <div key={choice.value} className="flex items-center gap-3 rounded-xl bg-mist p-3">
      <ImageThumb url={choice.imageUrl ?? ""} />
      <div className="min-w-0 flex-1"><p className="truncate font-semibold text-heading">{choice.label}</p>{choice.meta && <p className="text-xs text-muted-foreground">{choice.meta}</p>}</div>
      <Link href={choice.editHref} target="_blank" aria-label={`Editar ${choice.label}`} className="grid size-9 shrink-0 place-items-center rounded-full text-brand hover:bg-white"><ExternalLinkIcon className="size-4" /></Link>
      <div className="flex shrink-0 gap-1">
        <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Subir ${choice.label}`} className="grid size-9 place-items-center rounded-full hover:bg-white disabled:opacity-30"><ArrowUpIcon className="size-4" /></button>
        <button type="button" onClick={() => move(index, 1)} disabled={index === selectedChoices.length - 1} aria-label={`Bajar ${choice.label}`} className="grid size-9 place-items-center rounded-full hover:bg-white disabled:opacity-30"><ArrowDownIcon className="size-4" /></button>
        <button type="button" onClick={() => onChange(selected.filter((value) => value !== choice.value))} aria-label={`Quitar ${choice.label}`} className="grid size-9 place-items-center rounded-full text-danger hover:bg-white"><Trash2Icon className="size-4" /></button>
      </div>
    </div>)}</div>
  </fieldset>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <div><label className={labelClass}>{label}</label>{children}</div>; }
function TextSetting({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <Field label={label}><input value={value} onChange={(event) => onChange(event.target.value)} className={inputClass} /></Field>; }
function ImageSetting({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <Field label={label}><div className="flex flex-wrap items-center gap-3"><ImageThumb url={value} /><ImageUploadButton folder="contenido" onUploaded={onChange} label={value ? "Reemplazar imagen" : "Subir imagen"} />{value && <span className="text-xs text-muted-foreground">Imagen actual guardada</span>}</div></Field>; }
function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) { return <button type="button" onClick={onClick} className="inline-flex h-10 items-center gap-2 rounded-pill border border-brand px-4 text-sm font-semibold text-brand"><PlusIcon className="size-4" />{children}</button>; }
function Status({ state }: { state: ContentFormState }) { return state.status !== "idle" && state.message ? <p className={state.status === "saved" ? "flex items-center gap-1 text-sm text-emerald-700" : "text-sm text-danger"}>{state.status === "saved" && <CheckCircle2Icon className="size-4" />}{state.message}</p> : null; }
