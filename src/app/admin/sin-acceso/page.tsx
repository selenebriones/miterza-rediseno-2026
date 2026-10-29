import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlertIcon } from "lucide-react";
import { logout } from "../actions";

export const metadata: Metadata = { title: "Sin acceso" };

export default function NoAccessPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-card bg-white p-8 text-center shadow-card">
        <ShieldAlertIcon className="mx-auto size-12 text-warning" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold">No tienes acceso a esta sección</h1>
        <p className="mt-2">Si crees que deberías tenerlo, pide a un administrador que revise tus permisos.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-pill border border-brand px-5 font-semibold text-brand hover:bg-surface"
          >
            Ir a la tienda
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center rounded-pill bg-brand px-5 font-semibold text-white hover:bg-brand-hover"
            >
              Entrar con otra cuenta
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
