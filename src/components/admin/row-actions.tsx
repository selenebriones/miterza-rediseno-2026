"use client";

import { useState, useTransition } from "react";
import { Loader2Icon, Trash2Icon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useSavedToast } from "@/components/ui/saved-toast";
import { cn } from "@/lib/utils";

// Botones redondos de acción de las tablas del panel, como en terza-sitio: grises con borde, verdes al pasar el
// mouse; el de eliminar se pone rojo.
export const ACTION =
  "relative z-10 inline-grid size-10 shrink-0 place-items-center rounded-full border border-[#dee2e6] bg-white text-[#343a40] transition-colors hover:border-brand hover:bg-brand-50 hover:text-brand";
export const ACTION_DELETE =
  "relative z-10 inline-grid size-10 shrink-0 place-items-center rounded-full border border-[#dee2e6] bg-white text-[#343a40] transition-colors hover:border-[#f1556c] hover:bg-[#fdeef0] hover:text-[#f1556c]";
export const ACTION_OFF = "pointer-events-none opacity-35";

export type DeleteResult = { ok: boolean; message: string };

// Botón de eliminar con ventana de confirmación. `action` es una acción de servidor que recibe el id y responde
// si se pudo (con el motivo si no). Si se borra, la fila desaparece al refrescar la lista.
export function DeleteRowButton({
  id,
  name,
  title,
  description,
  action,
  disabledReason,
}: {
  id: string;
  name: string;
  title: string;
  description: string;
  action: (id: string) => Promise<DeleteResult>;
  disabledReason?: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { show, toast } = useSavedToast();

  if (disabledReason) {
    return (
      <span title={disabledReason} className="relative z-10 inline-flex">
        <span aria-hidden="true" className={cn(ACTION_DELETE, ACTION_OFF)}>
          <Trash2Icon className="size-[18px]" />
        </span>
        <span className="sr-only">
          No se puede eliminar {name}: {disabledReason}
        </span>
      </span>
    );
  }

  function confirm() {
    setError(null);
    startTransition(async () => {
      const result = await action(id);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setOpen(false);
      show(result.message);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Eliminar ${name}`}
        title="Eliminar"
        className={ACTION_DELETE}
      >
        <Trash2Icon className="size-[18px]" aria-hidden="true" />
      </button>
      <Dialog open={open} onOpenChange={(value) => !pending && (setOpen(value), setError(null))}>
        <DialogContent className="gap-0 rounded-[28px] p-6 sm:max-w-md sm:p-8">
          <DialogTitle className="text-xl font-bold text-heading">{title}</DialogTitle>
          <DialogDescription className="mt-3 text-base text-body">
            <span className="block font-semibold text-heading">{name}</span>
            <span className="mt-3 block">{description}</span>
          </DialogDescription>
          {error && (
            <p role="alert" className="mt-4 text-sm font-medium text-danger">
              {error}
            </p>
          )}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={pending}
              className="h-11 rounded-pill px-5 font-semibold text-heading ring-1 ring-line hover:ring-brand"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={pending}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-pill bg-danger px-5 font-semibold text-white hover:bg-danger/90 disabled:opacity-60"
            >
              {pending && <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />}
              Sí, eliminar
            </button>
          </div>
        </DialogContent>
      </Dialog>
      {toast}
    </>
  );
}
