"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

// Estado persistido en localStorage, sincronizado entre componentes y pestañas.
// En el servidor (y en el primer render) devuelve `fallback`, así no hay desajuste de hidratación.
// Si el navegador bloquea localStorage (modo privado, cookies bloqueadas) se guarda en memoria.

const listeners = new Set<() => void>();
const memory = new Map<string, string | null>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return memory.get(key) ?? null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    memory.set(key, value);
  }
  listeners.forEach((listener) => listener());
}

function parse<T>(raw: string | null, fallback: T): T {
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// `fallback` debe ser estable (una constante fuera del componente).
export function useLocalStorage<T>(key: string, fallback: T) {
  const raw = useSyncExternalStore(subscribe, () => read(key), () => null);
  const value = useMemo(() => parse(raw, fallback), [raw, fallback]);

  const setValue = useCallback(
    (next: T | null | ((current: T) => T)) => {
      const resolved = next instanceof Function ? next(parse(read(key), fallback)) : next;
      write(key, resolved === null ? null : JSON.stringify(resolved));
    },
    [key, fallback],
  );

  return [value, setValue] as const;
}
