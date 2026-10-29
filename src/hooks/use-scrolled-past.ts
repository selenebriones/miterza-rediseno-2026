"use client";

import { useEffect, useState, type RefObject } from "react";

// true cuando el elemento ya salió de la pantalla por arriba (el usuario bajó más allá).
// Se usa un listener de scroll pasivo en lugar de IntersectionObserver porque este último
// deja de notificar en pestañas o paneles ocultos y el estado quedaba desfasado.
export function useScrolledPast(ref: RefObject<HTMLElement | null>) {
  const [past, setPast] = useState(false);

  useEffect(() => {
    function check() {
      const element = ref.current;
      if (element) setPast(element.getBoundingClientRect().bottom < 0);
    }
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check, { passive: true });
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [ref]);

  return past;
}
