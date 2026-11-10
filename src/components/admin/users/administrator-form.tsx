"use client";

import { useActionState } from "react";
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
        <legend className="font-semibold text-heading">Permisos por módulo</legend>
        <p className="mt-1 text-sm">Administradores da acceso total al panel; los demás permisos se pueden combinar.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {ADMIN_NAV.map((item) => (
            <label key={item.permission} className="flex min-h-tap items-center gap-3 rounded-lg border border-input px-3 text-sm">
              <input
                type="checkbox"
                name="permissions"
                value={item.permission}
                defaultChecked={initial?.permissions.includes(item.permission)}
                className="size-5 accent-brand"
              />
              <span>
                <span className="block font-medium text-heading">{item.label}</span>
                {!item.ready && (
                  <span className="block text-xs text-muted-foreground">Módulo todavía no disponible</span>
                )}
              </span>
            </label>
          ))}
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
        {pending ? "Guardando…" : mode === "create" ? "Crear administrador" : "Guardar cambios"}
      </button>
    </form>
  );
}
