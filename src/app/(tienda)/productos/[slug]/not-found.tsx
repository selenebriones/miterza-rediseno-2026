import Link from "next/link";
import { PackageSearchIcon } from "lucide-react";

// Producto inexistente o dado de baja: se ofrecen salidas en lugar de un 404 genérico.
export default function ProductNotFound() {
  return (
    <div className="container flex flex-col items-center py-20 text-center lg:py-28">
      <span className="grid size-20 place-items-center rounded-full bg-surface">
        <PackageSearchIcon className="size-9 text-brand" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-2xl font-bold lg:text-[2rem]">No encontramos este producto</h1>
      <p className="mt-2 max-w-md">Es posible que ya no esté disponible o que el enlace haya cambiado.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/productos"
          className="inline-flex h-12 items-center rounded-pill bg-brand px-6 font-semibold text-white transition-colors hover:bg-accent hover:text-brand"
        >
          Ver todos los productos
        </Link>
        <Link
          href="/productos?categoria=persianas"
          className="inline-flex h-12 items-center rounded-pill border border-brand px-6 font-semibold text-brand hover:bg-surface"
        >
          Persianas
        </Link>
        <Link
          href="/productos?categoria=pisos"
          className="inline-flex h-12 items-center rounded-pill border border-brand px-6 font-semibold text-brand hover:bg-surface"
        >
          Pisos
        </Link>
      </div>
    </div>
  );
}
