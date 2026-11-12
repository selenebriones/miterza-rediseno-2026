import { Suspense } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { getAdminUser } from "@/lib/admin/session";

// Marco del panel (barra superior + menú lateral, estilos en ../admin.css). La navegación depende de la sesión
// (permisos), así que se transmite dentro de <Suspense>; el contenido de cada página verifica su propio permiso.
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-marco">
      <Suspense fallback={<NavFallback />}>
        <Navigation />
      </Suspense>
      <main id="contenido" className="admin-contenido">
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
      <div className="admin-superior" />
      <div className="admin-lateral max-lg:hidden" />
    </>
  );
}
