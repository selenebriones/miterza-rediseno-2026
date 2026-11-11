"use client";

import { useActionState, useEffect } from "react";
import { Loader2Icon, LockIcon } from "lucide-react";
import { useSavedToast } from "@/components/ui/saved-toast";
import { updateProfile, type ProfileFormState } from "@/app/(acceso)/cuenta/actions";
import { cn } from "@/lib/utils";

type Props = { email: string; firstName: string; lastName: string; phone: string };

// Sección "Mis datos" de "Mi información", con el aviso flotante al guardar.
export function ProfileSection(props: Props) {
  const { show, toast } = useSavedToast();
  return (
    <>
      <ProfileForm {...props} onSaved={() => show("Guardamos tus datos")} />
      {toast}
    </>
  );
}

// "Mis datos": el cliente cambia su nombre y teléfono. El correo se muestra bloqueado porque es su
// acceso. Se guarda con una acción de servidor (POST, funciona sin JavaScript).
export function ProfileForm({ email, firstName, lastName, phone, onSaved }: Props & { onSaved?: () => void }) {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(updateProfile, {});
  // Al guardar con éxito, avisa a quien lo abrió (la ventana se cierra).
  useEffect(() => {
    if (state.status === "saved") onSaved?.();
  }, [state, onSaved]);
  const values = state.values ?? { firstName, lastName, phone };
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} noValidate className="mt-5 space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nombre" name="firstName" autoComplete="given-name" defaultValue={values.firstName} error={errors.firstName} />
        <Field
          label="Apellidos"
          name="lastName"
          autoComplete="family-name"
          defaultValue={values.lastName}
          error={errors.lastName}
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Teléfono"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          defaultValue={values.phone}
          error={errors.phone}
          hint="10 dígitos. Lo usamos para coordinar tus entregas."
        />
        <div>
          <label htmlFor="perfil-correo" className="mb-1.5 block text-sm font-bold text-brand">
            Correo electrónico
          </label>
          <div className="relative">
            <input
              id="perfil-correo"
              value={email}
              readOnly
              aria-readonly="true"
              aria-describedby="perfil-correo-ayuda"
              className="h-12 w-full cursor-not-allowed rounded-card border border-input bg-mist pr-10 pl-4 text-base text-muted-foreground"
            />
            <LockIcon
              className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <p id="perfil-correo-ayuda" className="mt-1.5 text-xs text-muted-foreground">
            Es tu acceso a la cuenta, por eso no se puede cambiar.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-pill bg-brand px-8 font-semibold text-white transition-colors hover:bg-brand-hover disabled:bg-line disabled:text-muted-foreground sm:w-auto"
        >
          {pending && <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />}
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
        {/* El "guardado" se avisa con el aviso flotante; aquí solo los errores. */}
        <p aria-live="polite" className="text-sm font-medium text-danger">
          {!pending && state.status === "error" && state.message}
        </p>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  error,
  hint,
  ...props
}: { label: string; name: string; error?: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = `perfil-${name}`;
  const describedBy = error ? `${id}-error` : hint ? `${id}-ayuda` : undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold text-brand">
        {label}
      </label>
      <input
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "h-12 w-full rounded-card border bg-white px-4 text-base text-heading focus-visible:ring-2 focus-visible:outline-none",
          error ? "border-danger focus-visible:ring-danger/25" : "border-input focus-visible:border-brand focus-visible:ring-brand/25",
        )}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-ayuda`} className="mt-1.5 text-xs text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
