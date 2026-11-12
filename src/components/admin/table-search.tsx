import Link from "next/link";
import { SearchIcon, XIcon } from "lucide-react";

// Tarjeta de los listados del panel, como en terza-sitio: en escritorio el buscador va arriba, la tabla en medio y
// las páginas abajo, todo en una tarjeta blanca. En celular cada fila es su propia tarjeta (sin marco común).
export const TABLE_CARD = "md:overflow-hidden md:rounded-card md:bg-white md:shadow-card";

// Barra del buscador dentro de la tarjeta. Formulario GET: funciona sin JavaScript y la búsqueda queda en la URL;
// `keep` conserva los filtros de afuera (pestañas, categoría) al buscar.
export function TableSearch({
  action,
  label,
  placeholder,
  value,
  keep = {},
  clearHref,
  aside,
}: {
  action: string;
  label: string;
  placeholder: string;
  value: string;
  keep?: Record<string, string | null | undefined>;
  clearHref: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 md:border-b md:border-line md:px-8 md:py-6">
      <form action={action} role="search" className="flex w-full max-w-xl gap-2 md:w-auto md:flex-1">
        {Object.entries(keep).map(([name, v]) => (v ? <input key={name} type="hidden" name={name} value={v} /> : null))}
        <div className="relative flex-1">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-[#98a6ad]"
            aria-hidden="true"
          />
          <label htmlFor="q" className="sr-only">
            {label}
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={value}
            placeholder={placeholder}
            className="h-12 w-full rounded-card border border-input bg-white pr-4 pl-11 text-base text-heading"
          />
        </div>
        <button
          type="submit"
          className="h-12 shrink-0 rounded-card bg-brand px-5 font-semibold text-white hover:bg-brand-hover"
        >
          Buscar
        </button>
        {value && (
          <Link
            href={clearHref}
            aria-label="Limpiar búsqueda"
            className="grid size-12 shrink-0 place-items-center rounded-card border border-input bg-white text-[#343a40] hover:border-brand hover:text-brand"
          >
            <XIcon className="size-4" aria-hidden="true" />
          </Link>
        )}
      </form>
      {aside && <div className="md:ml-auto">{aside}</div>}
    </div>
  );
}
