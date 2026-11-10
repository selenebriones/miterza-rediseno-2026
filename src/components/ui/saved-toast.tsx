"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckIcon, XIcon } from "lucide-react";

// Aviso flotante de "guardado" (abajo al centro, como el del carrito). Se va solo a los 4 segundos.
export function useSavedToast() {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const show = useCallback((text: string) => {
    setMessage(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 4000);
  }, []);

  const toast = (
    <div role="status" aria-live="polite" className="fixed inset-x-4 bottom-6 z-toast flex justify-center lg:bottom-8">
      {message && (
        <div className="flex items-center gap-3 rounded-pill bg-brand py-2 pr-2 pl-3 text-sm text-white shadow-card-hover">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-brand">
            <CheckIcon className="size-4" strokeWidth={3} aria-hidden="true" />
          </span>
          <span className="font-semibold">{message}</span>
          <button
            type="button"
            onClick={() => setMessage(null)}
            aria-label="Cerrar aviso"
            className="grid size-8 shrink-0 place-items-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
          >
            <XIcon className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );

  return { show, toast };
}
