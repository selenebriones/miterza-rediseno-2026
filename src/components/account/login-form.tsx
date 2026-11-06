"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2Icon } from "lucide-react";
import { customerLogin, type AuthFormState } from "@/app/(acceso)/cuenta/actions";
import { FormAlert, PasswordField, primaryButton, secondaryButton, TextField } from "./auth-ui";

export function LoginForm({ returnTo }: { returnTo: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(customerLogin, {});
  const query = returnTo !== "/cuenta" ? `?desde=${encodeURIComponent(returnTo)}` : "";

  return (
    // Acción de servidor en `action`: POST aunque JavaScript no haya cargado (nunca GET con la contraseña).
    <form action={action} className="space-y-5">
      <input type="hidden" name="desde" value={returnTo} />
      {state.error && <FormAlert>{state.error}</FormAlert>}

      <TextField
        name="email"
        label="Correo electrónico"
        type="email"
        autoComplete="username"
        required
        autoFocus
        defaultValue={state.values?.email}
      />
      <PasswordField name="password" label="Contraseña" autoComplete="current-password" required />

      <p className="text-right text-sm">
        <Link href="/cuenta/recuperar" className="font-semibold text-brand underline underline-offset-4 hover:no-underline">
          Olvidé mi contraseña
        </Link>
      </p>

      <button type="submit" disabled={pending} className={primaryButton}>
        {pending && <Loader2Icon className="size-5 animate-spin" aria-hidden="true" />}
        {pending ? "Ingresando…" : "Ingresar"}
      </button>

      <div className="flex items-center gap-4 text-sm text-body" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        ¿No tienes cuenta?
        <span className="h-px flex-1 bg-line" />
      </div>
      <Link href={`/cuenta/registro${query}`} className={secondaryButton}>
        Crear cuenta
      </Link>
    </form>
  );
}
