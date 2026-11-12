import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PencilIcon, PlusIcon, ShieldIcon } from "lucide-react";
import { deleteAdministrator } from "./actions";
import { ACTION, DeleteRowButton } from "@/components/admin/row-actions";
import type { AdminPermission } from "@/generated/prisma/enums";
import { listAdministrators } from "@/lib/admin/administrators";
import { ADMIN_NAV } from "@/lib/admin/permissions";
import { requirePermission } from "@/lib/admin/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Usuarios" };

const dateFormat = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" });
const permissionLabel = new Map<AdminPermission, string>(ADMIN_NAV.map((item) => [item.permission, item.label]));

export default function AdministratorsPage() {
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[1.75rem] leading-tight font-bold lg:text-[2rem]">Usuarios</h1>
          <p className="mt-1 text-sm text-muted-foreground">Personas con acceso al panel administrativo.</p>
        </div>
        <Link
          href="/admin/usuarios/nuevo"
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-pill bg-brand px-4 font-semibold text-white hover:bg-brand-hover"
        >
          <PlusIcon className="size-4" aria-hidden="true" />
          Nuevo usuario
        </Link>
      </div>
      <Suspense fallback={<div className="mt-6 h-80 animate-pulse rounded-card bg-white" aria-busy="true" />}>
        <Administrators />
      </Suspense>
    </div>
  );
}

async function Administrators() {
  const me = await requirePermission("SUPER_ADMIN");
  const administrators = await listAdministrators();

  if (administrators.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center rounded-card bg-white px-6 py-14 text-center shadow-card">
        <ShieldIcon className="size-10 text-brand" aria-hidden="true" />
        <h2 className="mt-3 text-lg font-bold">Aún no hay usuarios del panel</h2>
      </div>
    );
  }

  return (
    <>
      <div className="mt-6 hidden overflow-hidden rounded-card bg-white shadow-card md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs tracking-wide text-muted-foreground uppercase">
            <tr>
              <th className="px-5 py-3 font-semibold" scope="col">Usuario</th>
              <th className="px-5 py-3 font-semibold" scope="col">Permisos</th>
              <th className="px-5 py-3 font-semibold" scope="col">Último acceso</th>
              <th className="px-5 py-3 font-semibold" scope="col">Estado</th>
              <th className="text-right" scope="col">Acciones</th>
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
                <td className="w-px whitespace-nowrap">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/usuarios/${administrator.id}`}
                      aria-label={`Editar a ${administrator.name ?? administrator.email}`}
                      title="Editar"
                      className={ACTION}
                    >
                      <PencilIcon className="size-[18px]" aria-hidden="true" />
                    </Link>
                    <DeleteRowButton
                      id={administrator.id}
                      name={administrator.name ?? administrator.email}
                      title="¿Eliminar a este administrador?"
                      description="Ya no podrá entrar al panel y no se puede deshacer. Los cambios que hizo en pedidos se conservan en su historial."
                      action={deleteAdministrator}
                      disabledReason={administrator.id === me.id ? "es tu propia cuenta" : undefined}
                    />
                  </div>
                </td>
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
    <span className={cn("insignia", active ? "exito" : "peligro")}>
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}
