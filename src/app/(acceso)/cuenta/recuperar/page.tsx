import type { Metadata } from "next";
import { RecoverForm } from "@/components/account/recover-form";

export const metadata: Metadata = {
  title: "Recuperar contraseña | Mi Terza",
  robots: { index: false, follow: true },
};

// Pendiente: el envío del enlace (falta el servicio de correo). Ver requestPasswordReset.
export default function RecoverPage() {
  return (
    <section className="rounded-[28px] bg-white p-6 shadow-card sm:p-10">
      <h1 className="text-2xl font-bold tracking-wide text-brand uppercase sm:text-[1.75rem]">Recuperar contraseña</h1>
      <p className="mt-2 text-brand">
        Escribe el correo con el que te registraste. Te enviaremos un enlace para que elijas una contraseña nueva.
      </p>
      <div className="mt-6">
        <RecoverForm />
      </div>
    </section>
  );
}
