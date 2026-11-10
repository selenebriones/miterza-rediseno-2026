import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PlusIcon, ShieldIcon } from "lucide-react";
import type { AdminPermission } from "@/generated/prisma/enums";
import { listAdministrators } from "@/lib/admin/administrators";
import { ADMIN_NAV } from "@/lib/admin/permissions";
import { requirePermission } from "@/lib/admin/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Administradores" };

const dateFormat = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" });
const permissionLabel = new Map<AdminPermission, string>(ADMIN_NAV.map((item) => [item.permission, item.label]));

export default function AdministratorsPage() {
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[1.75rem] leading-tight font-bold lg:text-[2rem]">Administradores</h1>
        <Link
          href="/admin/usuarios/nuevo"
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-pill bg-brand px-4 font-semibold text-white hover:bg-brand-hover"
        >
          <PlusIcon className="size-4" aria-hidden="true" />
          Nuevo
        </Link>
      </div>
      <Suspense fallback={<div className="mt-6 h-80 animate-pulse rounded-card bg-white" aria-busy="true" />}>
        <Administrators />
      </Suspense>
    </div>
  );
}

async function Administrators() {
  await requirePermission("SUPER_ADMIN");
  const administrators = await listAdministrators();

  if (administrators.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center rounded-card bg-white px-6 py-14 text-center shadow-card">
        <ShieldIcon className="size-10 text-brand" aria-hidden="true" />
        <h2 className="mt-3 text-lg font-bold">Aún no hay administradores</h2>
      </div>
    );
  }

  return (
    <>
      <div className="mt-6 hidden overflow-hidden rounded-card bg-white shadow-card md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs tracking-wide text-muted-foreground uppercase">
            <tr>
              <th className="px-5 py-3 font-semibold" scope="col">Administrador</th>
              <th className="px-5 py-3 font-semibold" scope="col">Permisos</th>
              <th className="px-5 py-3 font-semibold" scope="col">Último acceso</th>
              <th className="px-5 py-3 font-semibold" scope="col">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {administrators.map((administrator) => (
              <tr key={administrator.id} className="relative hover:bg-surface has-[a:focus-visible]:bg-surface">
                <td className="px-5 py-4">
                  <Link
                    href={`/admin/usuarios/${administrator.id}`}
                    className="font-semibold text-brand after:absolute after:inset-0 focus-visible:outline-none"
                  >
                    {administrator.name ?? "Sin nombre"}
                  </Link>
                  <span className="block text-xs text-muted-foreground">{administrator.email}</span>
                </td>
                <td className="px-5 py-4">{permissionsText(administrator.permissions)}</td>
                <td className="px-5 py-4">{administrator.lastLoginAt ? dateFormat.format(administrator.lastLoginAt) : "Nunca"}</td>
                <td className="px-5 py-4"><Status active={administrator.isActive} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="mt-6 space-y-3 md:hidden">
        {administrators.map((administrator) => (
          <li key={administrator.id}>
            <Link href={`/admin/usuarios/${administrator.id}`} className="block rounded-card bg-white p-4 shadow-card active:bg-surface">
              <span className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-heading">{administrator.name ?? "Sin nombre"}</span>
                  <span className="block truncate text-sm">{administrator.email}</span>
                </span>
                <Status active={administrator.isActive} />
              </span>
              <span className="mt-2 block text-sm">{permissionsText(administrator.permissions)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

function permissionsText(permissions: AdminPermission[]) {
  if (permissions.includes("SUPER_ADMIN")) return "Acceso total";
  return permissions.map((permission) => permissionLabel.get(permission) ?? permission).join(", ") || "Sin permisos";
}

function Status({ active }: { active: boolean }) {
  return (
    <span className={cn(
      "inline-flex rounded-pill px-2.5 py-1 text-xs font-semibold whitespace-nowrap ring-1 ring-inset",
      active ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-zinc-100 text-zinc-700 ring-zinc-200",
    )}>
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}
