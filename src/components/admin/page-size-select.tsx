"use client";

import { useRouter } from "next/navigation";
import { PAGE_SIZES } from "@/lib/admin/table-params";

// Cuántos resultados ver por página (10, 20, 50 o 100), como el selector del datatable de terza-sitio. El servidor
// arma la dirección de cada opción (conserva búsqueda, filtros y orden, y regresa a la página 1).
export function PageSizeSelect({ value, hrefs }: { value: number; hrefs: Record<number, string> }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-sm">
      <span>Mostrar</span>
      <select
        value={value}
        onChange={(e) => router.push(hrefs[Number(e.target.value)], { scroll: false })}
        aria-label="Resultados por página"
        className="h-12 appearance-none rounded-card border border-input bg-white bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23343a40%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22/%3E%3C/svg%3E')] bg-[length:16px] bg-[right_14px_center] bg-no-repeat pr-10 pl-4 text-base text-heading"
      >
        {PAGE_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </label>
  );
}
