"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, Loader2Icon, MailCheckIcon } from "lucide-react";
import { requestPasswordReset, type RecoverState } from "@/app/(acceso)/cuenta/actions";
import { primaryButton, secondaryButton, TextField } from "./auth-ui";

export function RecoverForm() {
  const [state, action, pending] = useActionState<RecoverState, FormData>(requestPasswordReset, {});

  if (state.sent) {
    return (
      <div className="text-center" role="status">
        <MailCheckIcon className="mx-auto size-10 text-brand" aria-hidden="true" />
        <p className="mt-4 text-black">
          Si <strong className="font-bold">{state.email}</strong> está registrado, te enviaremos un enlace para elegir una
          contraseña nueva. Revisa también tu carpeta de spam.
        </p>
        <Link href="/cuenta/ingresar" className={`${secondaryButton} mt-8`}>
          <ChevronLeftIcon className="size-5" aria-hidden="true" />
          Volver a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="space-y-6">
      <TextField
        name="email"
        label="Correo electrónico"
        type="email"
        autoComplete="email"
        required
        autoFocus
        defaultValue={state.email}
        error={state.error}
      />
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <Link href="/cuenta/ingresar" className={secondaryButton}>
          <ChevronLeftIcon className="size-5" aria-hidden="true" />
          Volver
        </Link>
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? <Loader2Icon className="size-5 animate-spin" aria-hidden="true" /> : null}
          Recuperar
          {!pending && <ChevronRightIcon className="size-5" aria-hidden="true" />}
        </button>
      </div>
    </form>
  );
}
