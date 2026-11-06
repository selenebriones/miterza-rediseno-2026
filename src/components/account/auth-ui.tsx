"use client";

import { useState } from "react";
import { AlertCircleIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Piezas comunes de ingresar, crear cuenta y recuperar contraseña.

export const primaryButton =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-pill bg-accent px-6 font-semibold text-brand transition-colors hover:bg-accent-hover disabled:opacity-70";
export const secondaryButton =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-pill border-2 border-brand px-6 font-semibold text-brand transition-colors hover:bg-brand hover:text-white";

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[28px] bg-white p-6 shadow-card sm:p-10">
      <h1 className="text-center text-2xl font-bold text-black sm:text-[1.75rem]">{title}</h1>
      {subtitle && <p className="mt-1 text-center text-base text-brand">{subtitle}</p>}
      <div className="mt-8">{children}</div>
    </section>
  );
}

export function FormAlert({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="flex gap-2 rounded-xl border border-danger/30 bg-danger/5 p-3 text-sm text-heading">
      <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
      {children}
    </p>
  );
}

const inputClass =
  "h-12 w-full rounded-xl border border-input bg-white px-4 text-base text-black transition-colors placeholder:text-muted-foreground focus-visible:border-brand focus-visible:outline-brand aria-invalid:border-danger aria-invalid:bg-danger/5";

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & { name: string; label: string; error?: string };

export function TextField({ name, label, error, className, ...props }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1.5 block text-sm font-bold text-brand">
        {label}
      </label>
      <input
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={inputClass}
        {...props}
      />
      {error && (
        <p id={`${name}-error`} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function PasswordField({ name, label, error, hint, ...props }: FieldProps & { hint?: string }) {
  const [visible, setVisible] = useState(false);
  const describedBy = [error && `${name}-error`, hint && `${name}-hint`].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-bold text-brand">
        {label}
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(inputClass, "pr-12")}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
          className="absolute top-1/2 right-1 grid size-10 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-mist hover:text-brand"
        >
          {visible ? <EyeOffIcon className="size-5" aria-hidden="true" /> : <EyeIcon className="size-5" aria-hidden="true" />}
        </button>
      </div>
      {hint && !error && (
        <p id={`${name}-hint`} className="mt-1.5 text-sm">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
