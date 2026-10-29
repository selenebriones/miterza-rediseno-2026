import { Suspense } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { getAdminUser } from "@/lib/admin/session";

// La navegación depende de la sesión (permisos), así que se transmite dentro de <Suspense>;
// el contenido de cada página verifica su propio permiso.
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 lg:grid lg:grid-cols-[17rem_1fr]">
      <Suspense fallback={<NavFallback />}>
        <Navigation />
      </Suspense>
      <main id="contenido" className="min-w-0 px-4 py-6 lg:px-10 lg:py-10">
        {children}
      </main>
    </div>
  );
}

async function Navigation() {
  const user = await getAdminUser();
  if (!user) return <NavFallback />;
  return <AdminNav user={user} />;
}

function NavFallback() {
  return (
    <>
      <div className="hidden h-dvh bg-brand lg:block" />
      <div className="h-14 bg-brand lg:hidden" />
    </>
  );
}
