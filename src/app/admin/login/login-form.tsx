"use client";

import { useActionState, useState } from "react";
import { AlertCircleIcon, EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react";
import { login, type LoginState } from "../actions";

const inputClass =
  "h-12 w-full rounded-lg border border-input bg-white px-4 text-base text-heading transition-colors focus-visible:border-brand";

export function LoginForm({ returnTo }: { returnTo: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {}, "/admin/login");
  const [showPassword, setShowPassword] = useState(false);

  return (
    // Acción de servidor en `action`: se envía por POST incluso si JavaScript aún no cargó
    // (un <form> sin método haría GET y pondría la contraseña en la URL).
    <form
      action={action}
      className="space-y-5"
    >
      <input type="hidden" name="desde" value={returnTo} />

      {state.error && (
        <p
          role="alert"
          className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-heading"
        >
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-heading">
          Correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          autoFocus
          defaultValue={state.email}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-heading">
          Contraseña
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className={`${inputClass} pr-12`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={showPassword}
            className="absolute top-1/2 right-1 grid size-10 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-brand"
          >
            {showPassword ? (
              <EyeOffIcon className="size-5" aria-hidden="true" />
            ) : (
              <EyeIcon className="size-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-pill bg-brand font-semibold text-white transition-colors hover:bg-brand-hover disabled:bg-line disabled:text-muted-foreground"
      >
        {pending && <Loader2Icon className="size-5 animate-spin" aria-hidden="true" />}
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
