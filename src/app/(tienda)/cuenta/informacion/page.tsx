import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeftIcon } from "lucide-react";
import { AddressBook } from "@/components/account/address-book";
import { ProfileSection } from "@/components/account/profile-form";
import { getAddresses, MAX_ADDRESSES } from "@/lib/addresses";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Mi información | Mi Terza",
  robots: { index: false, follow: false },
};

// "Mi información": datos de la cuenta (nombre y teléfono) y libreta de direcciones de envío.
export default function AccountInfoPage() {
  return (
    <div className="container py-10 lg:py-16">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-[28px] bg-mist" />}>
        <AccountInfo />
      </Suspense>
    </div>
  );
}

async function AccountInfo() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/cuenta/ingresar?desde=/cuenta/informacion");
  if (session.user.role !== "CUSTOMER") redirect("/admin");

  const [user, addresses] = await Promise.all([
    db.user.findUnique({ where: { id: session.user.id }, select: { name: true, phone: true } }),
    getAddresses(session.user.id),
  ]);
  const [firstName = "", ...lastNames] = (user?.name ?? session.user.name ?? "").split(" ");
  const lastName = lastNames.join(" ");

  return (
    <>
      <Link
        href="/cuenta"
        className="inline-flex items-center gap-2 rounded-pill bg-mist px-5 py-2 text-sm font-bold text-brand transition-colors hover:bg-brand hover:text-white"
      >
        <ArrowLeftIcon className="size-4" aria-hidden="true" />
        Volver a Mi cuenta
      </Link>
      <p className="mt-6 text-sm font-bold tracking-widest text-brand uppercase">Mi cuenta</p>
      <h1 className="mt-2 text-[2rem] leading-tight font-bold lg:text-5xl">Mi información</h1>

      <section aria-labelledby="mis-datos" className="mt-10 rounded-[28px] bg-mist p-6 md:p-8">
        <h2 id="mis-datos" className="text-2xl font-bold text-black">
          Mis datos
        </h2>
        <ProfileSection email={session.user.email ?? ""} firstName={firstName} lastName={lastName} phone={user?.phone ?? ""} />
      </section>

      <section aria-labelledby="mis-direcciones" className="mt-8 rounded-[28px] bg-mist p-6 md:p-8">
        <h2 id="mis-direcciones" className="text-2xl font-bold text-black">
          Mis direcciones de envío
        </h2>
        <p className="mt-1 text-sm">La predeterminada se elige sola al pagar; puedes cambiarla en cada compra.</p>
        <AddressBook
          addresses={addresses}
          defaults={{ firstName, lastName, phone: user?.phone ?? "" }}
          max={MAX_ADDRESSES}
        />
      </section>
    </>
  );
}
