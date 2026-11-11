"use client";

import { useActionState, useRef, useState } from "react";
import { AlertCircleIcon, Loader2Icon } from "lucide-react";
import type { AdministratorFormState } from "@/app/admin/(panel)/usuarios/actions";
import type { AdminPermission } from "@/generated/prisma/enums";
import { ADMIN_NAV } from "@/lib/admin/permissions";

const inputClass =
  "h-11 w-full rounded-lg border border-input bg-white px-3 text-base text-heading focus-visible:border-brand";
const labelClass = "mb-1.5 block text-sm font-medium text-heading";

type Initial = {
  id: string;
  name: string | null;
  email: string;
  permissions: AdminPermission[];
  isActive: boolean;
};

const PERMISSION_COPY = {
  SUPER_ADMIN: {
    label: "Superadministrador",
    description: "Acceso total al panel, incluida la creación y edición de otros usuarios.",
  },
  MANAGE_CATALOG: {
    label: "Productos y categorías",
    description: "Crear y editar productos, categorías e imágenes.",
  },
  MANAGE_ORDERS: {
    label: "Pedidos",
    description: "Consultar pedidos y actualizar su estado.",
  },
  MANAGE_CONTENT: {
    label: "Contenido",
    description: "Administrar el contenido del sitio.",
  },
  MANAGE_PAYMENTS: {
    label: "Pagos",
    description: "Administrar métodos y opciones de pago.",
  },
  MANAGE_CUSTOMERS: {
    label: "Clientes",
    description: "Consultar y administrar cuentas de clientes.",
  },
} satisfies Record<AdminPermission, { label: string; description: string }>;

export function AdministratorForm({
  mode,
  initial,
  action,
}: {
  mode: "create" | "edit";
  initial?: Initial;
  action: (prev: AdministratorFormState, formData: FormData) => Promise<AdministratorFormState>;
}) {
  const [state, formAction, pending] = useActionState<AdministratorFormState, FormData>(action, { status: "idle" });
  const allPermissions = ADMIN_NAV.map((item) => item.permission);
  const initialPermissions = initial?.permissions ?? [];
  const [selectedPermissions, setSelectedPermissions] = useState<AdminPermission[]>(() =>
    initialPermissions.includes("SUPER_ADMIN") ? allPermissions : initialPermissions,
  );
  const previousPermissions = useRef<AdminPermission[]>(initialPermissions.filter((permission) => permission !== "SUPER_ADMIN"));
  const isSuperAdmin = selectedPermissions.includes("SUPER_ADMIN");

  function changePermission(permission: AdminPermission, checked: boolean) {
    if (permission === "SUPER_ADMIN") {
      if (checked) {
        previousPermissions.current = selectedPermissions.filter((selected) => selected !== "SUPER_ADMIN");
        setSelectedPermissions(allPermissions);
      } else {
        setSelectedPermissions(previousPermissions.current);
      }
      return;
    }

    const next = checked
      ? [...selectedPermissions, permission]
      : selectedPermissions.filter((selected) => selected !== permission);
    previousPermissions.current = next;
    setSelectedPermissions(next);
  }

  return (
    <form action={formAction} className="mt-6 max-w-2xl space-y-6 rounded-card bg-white p-5 shadow-card">
      {initial && <input type="hidden" name="userId" value={initial.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelClass}>
            Nombre
          </label>
          <input id="name" name="name" required defaultValue={initial?.name ?? ""} className={inputClass} />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>
            Correo
          </label>
          <input id="email" name="email" type="email" required defaultValue={initial?.email ?? ""} className={inputClass} />
        </div>
        {mode === "create" && (
          <div className="sm:col-span-2">
            <label htmlFor="password" className={labelClass}>
              Contraseña temporal
            </label>
            <input
              id="password"
              name="password"
              type="password"
              minLength={8}
              maxLength={200}
              autoComplete="new-password"
              required
              className={inputClass}
            />
            <p className="mt-1 text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
          </div>
        )}
      </div>

      <fieldset>
        <legend className="font-semibold text-heading">Permisos del usuario</legend>
        <p className="mt-1 text-sm">Elige solo las secciones que esta persona podrá consultar y modificar.</p>
        {isSuperAdmin && (
          <p className="mt-2 rounded-lg bg-brand/5 px-3 py-2 text-sm font-medium text-brand">
            Acceso total activo: todos los permisos están incluidos.
          </p>
        )}
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {ADMIN_NAV.map((item) => {
            const copy = PERMISSION_COPY[item.permission];
            return (
              <label
                key={item.permission}
                className="flex min-h-tap items-start gap-3 rounded-lg border border-input px-3 py-3 text-sm transition-colors has-checked:border-brand has-checked:bg-brand/5"
              >
                <input
                  type="checkbox"
                  name="permissions"
                  value={item.permission}
                  checked={selectedPermissions.includes(item.permission)}
                  disabled={isSuperAdmin && item.permission !== "SUPER_ADMIN"}
                  onChange={(event) => changePermission(item.permission, event.target.checked)}
                  className="mt-0.5 size-5 shrink-0 accent-brand"
                />
                <span>
                  <span className="block font-medium text-heading">{copy.label}</span>
                  <span className="block text-xs text-muted-foreground">{copy.description}</span>
                  {!item.ready && (
                    <span className="block text-xs text-muted-foreground">Módulo todavía no disponible</span>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <label className="flex min-h-tap items-center gap-3 font-medium text-heading">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={initial?.isActive ?? true}
          className="size-5 accent-brand"
        />
        Cuenta activa
      </label>

      {state.status === "error" && state.message && (
        <p role="alert" className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-heading">
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-pill bg-brand px-6 font-semibold text-white hover:bg-brand-hover disabled:bg-line disabled:text-muted-foreground"
      >
        {pending && <Loader2Icon className="size-5 animate-spin" aria-hidden="true" />}
        {pending ? "Guardando…" : mode === "create" ? "Crear usuario" : "Guardar cambios"}
      </button>
    </form>
  );
}
