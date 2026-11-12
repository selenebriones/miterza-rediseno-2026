"use client";

import { useRef, useState } from "react";
import { BoldIcon, Code2Icon, Heading2Icon, Heading3Icon, LinkIcon, ListIcon, ListOrderedIcon, PilcrowIcon } from "lucide-react";

const toolbarButton = "inline-flex h-9 items-center gap-1.5 rounded-md border border-line px-3 text-xs font-semibold text-heading hover:bg-mist";

export function PolicyRichEditor({ initialContent }: { initialContent: string }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState(initialContent);
  const [showSource, setShowSource] = useState(false);
  const syncVisual = () => {
    if (editorRef.current && hiddenRef.current) hiddenRef.current.value = editorRef.current.innerHTML;
  };
  const command = (name: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(name, false, value);
    syncVisual();
  };
  const toggleSource = () => {
    if (!showSource && editorRef.current) {
      const html = editorRef.current.innerHTML;
      setSource(html);
      if (hiddenRef.current) hiddenRef.current.value = html;
    }
    setShowSource((visible) => !visible);
  };

  return <div>
    <input ref={hiddenRef} type="hidden" name="content" defaultValue={initialContent} />
    <div className="mb-2 flex flex-wrap items-center gap-2">
      {!showSource && <>
        <button type="button" onClick={() => command("formatBlock", "<p>")} className={toolbarButton} aria-label="Párrafo"><PilcrowIcon className="size-4" />Párrafo</button>
        <button type="button" onClick={() => command("formatBlock", "<h2>")} className={toolbarButton}><Heading2Icon className="size-4" />Subtítulo</button>
        <button type="button" onClick={() => command("formatBlock", "<h3>")} className={toolbarButton}><Heading3Icon className="size-4" />Sección</button>
        <button type="button" onClick={() => command("bold")} className={toolbarButton} aria-label="Negritas"><BoldIcon className="size-4" /></button>
        <button type="button" onClick={() => command("insertUnorderedList")} className={toolbarButton} aria-label="Lista"><ListIcon className="size-4" /></button>
        <button type="button" onClick={() => command("insertOrderedList")} className={toolbarButton} aria-label="Lista numerada"><ListOrderedIcon className="size-4" /></button>
        <button type="button" onClick={() => { const href = window.prompt("Enlace https:// o mailto:"); if (href) command("createLink", href); }} className={toolbarButton}><LinkIcon className="size-4" />Enlace</button>
      </>}
      <button type="button" onClick={toggleSource} className={`${toolbarButton} ${showSource ? "bg-mist" : ""}`}><Code2Icon className="size-4" />{showSource ? "Vista visual" : "Editar HTML"}</button>
    </div>
    {showSource ? <textarea aria-label="Contenido HTML" rows={22} maxLength={200000} value={source} onChange={(event) => { setSource(event.target.value); if (hiddenRef.current) hiddenRef.current.value = event.target.value; }} spellCheck={false} className="w-full rounded-lg border border-input bg-white px-3 py-2 font-mono text-sm leading-6 text-heading" /> : <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={syncVisual} dangerouslySetInnerHTML={{ __html: source }} className="min-h-80 w-full rounded-lg border border-input bg-white px-4 py-3 text-base leading-relaxed text-heading focus-visible:border-brand focus-visible:outline-none [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_p]:mt-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:text-brand [&_a]:underline" />}
    <p className="mt-2 text-xs text-muted-foreground">Edita visualmente el texto o abre “Editar HTML” para manejar imágenes y estructura avanzada. Al guardar, el sistema limpia etiquetas y enlaces no permitidos.</p>
  </div>;
}
