"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2Icon } from "lucide-react";
import { registerCustomer, type AuthFormState } from "@/app/(acceso)/cuenta/actions";
import { PasswordField, primaryButton, TextField } from "./auth-ui";

export function RegisterForm({ returnTo }: { returnTo: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(registerCustomer, {});
  const errors = state.fieldErrors ?? {};
  const values = state.values ?? {};
  const query = returnTo !== "/cuenta" ? `?desde=${encodeURIComponent(returnTo)}` : "";

  return (
    <form action={action} noValidate className="space-y-5">
      <input type="hidden" name="desde" value={returnTo} />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          name="firstName"
          label="Nombre"
          autoComplete="given-name"
          required
          autoFocus
          defaultValue={values.firstName}
          error={errors.firstName}
        />
        <TextField
          name="lastName"
          label="Apellido"
          autoComplete="family-name"
          required
          defaultValue={values.lastName}
          error={errors.lastName}
        />
      </div>
      <TextField
        name="email"
        label="Correo electrónico"
        type="email"
        autoComplete="email"
        required
        defaultValue={values.email}
        error={errors.email}
      />
      <PasswordField
        name="password"
        label="Contraseña"
        autoComplete="new-password"
        required
        minLength={8}
        hint="Mínimo 8 caracteres."
        error={errors.password}
      />

      <div>
        <label className="flex items-start gap-3 text-sm text-black">
          <input
            type="checkbox"
            name="terms"
            required
            aria-invalid={errors.terms ? true : undefined}
            aria-describedby={errors.terms ? "terms-error" : undefined}
            className="mt-0.5 size-5 shrink-0 accent-brand"
          />
          <span>
            He leído y acepto el{" "}
            <Link
              href="/politicas/privacidad"
              target="_blank"
              className="font-semibold text-brand underline underline-offset-4 hover:no-underline"
            >
              Aviso de privacidad
            </Link>{" "}
            de Mi Terza.
          </span>
        </label>
        {errors.terms && (
          <p id="terms-error" className="mt-1.5 text-sm text-danger">
            {errors.terms}
          </p>
        )}
      </div>

      <button type="submit" disabled={pending} className={primaryButton}>
        {pending && <Loader2Icon className="size-5 animate-spin" aria-hidden="true" />}
        {pending ? "Creando cuenta…" : "Crear cuenta"}
      </button>

      <p className="text-center text-sm text-black">
        ¿Ya tienes una cuenta?{" "}
        <Link
          href={`/cuenta/ingresar${query}`}
          className="font-semibold text-brand underline underline-offset-4 hover:no-underline"
        >
          Iniciar sesión
        </Link>
      </p>
    </form>
  );
}
