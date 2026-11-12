"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDownIcon,
  ClipboardListIcon,
  CreditCardIcon,
  ExternalLinkIcon,
  LayoutTemplateIcon,
  LogOutIcon,
  MenuIcon,
  PackageIcon,
  SearchIcon,
  ShieldIcon,
  TagIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import { logout } from "@/app/admin/actions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import type { AdminPermission } from "@/generated/prisma/enums";
import { ADMIN_NAV, hasPermission } from "@/lib/admin/permissions";

type User = { name: string | null; email: string; permissions: AdminPermission[] };
type NavLink = { href: string; label: string; icon: LucideIcon; permission: AdminPermission; ready: boolean };

const ICONS: Record<(typeof ADMIN_NAV)[number]["icon"], LucideIcon> = {
  orders: ClipboardListIcon,
  products: PackageIcon,
  content: LayoutTemplateIcon,
  payments: CreditCardIcon,
  customers: UsersIcon,
  admins: ShieldIcon,
};

const fromNav = (href: string): NavLink => {
  const item = ADMIN_NAV.find((i) => i.href === href)!;
  return { href: item.href, label: item.label, icon: ICONS[item.icon], permission: item.permission, ready: item.ready };
};

// Secciones del menú lateral, como en el administrador de terza-sitio. Categorías vive dentro del permiso de
// catálogo (no es un módulo propio en ADMIN_NAV).
const SECTIONS: { title: string; links: NavLink[] }[] = [
  { title: "Ventas", links: [fromNav("/admin/pedidos"), fromNav("/admin/clientes"), fromNav("/admin/pagos")] },
  {
    title: "Catálogo",
    links: [
      fromNav("/admin/productos"),
      { href: "/admin/categorias", label: "Categorías", icon: TagIcon, permission: "MANAGE_CATALOG", ready: true },
    ],
  },
  { title: "Sitio", links: [fromNav("/admin/contenido")] },
  { title: "Administración", links: [fromNav("/admin/usuarios")] },
];

// Marco del panel al estilo de terza-sitio (UBold): barra superior verde con logo, botón de menú, buscador de
// pedidos, enlace a la tienda y menú del usuario; menú lateral blanco con secciones. En escritorio el botón de
// menú oculta o muestra el lateral; en celular lo abre como hoja desde la izquierda.
export function AdminNav({ user }: { user: User }) {
  const [closed, setClosed] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const canSearchOrders = hasPermission(user.permissions, "MANAGE_ORDERS");
  const name = user.name || "Administrador";

  function toggleMenu() {
    if (window.matchMedia("(max-width: 1023.98px)").matches) setSheetOpen(true);
    else setClosed((value) => !value);
  }

  return (
    <>
      <header className="admin-superior">
        <Link href="/admin" className="admin-superior-logo" aria-label="Mi Terza, ir al panel">
          <Image
            src="/brand/mi-terza-logo.png"
            alt=""
            width={206}
            height={90}
            loading="eager"
            className="h-[52px] w-auto brightness-0 invert max-lg:h-10"
          />
        </Link>
        <button
          type="button"
          className="admin-superior-boton"
          data-abrir-menu
          onClick={toggleMenu}
          aria-label="Mostrar u ocultar el menú"
          aria-expanded={!closed}
        >
          <MenuIcon className="size-5" aria-hidden="true" />
        </button>
        {canSearchOrders && (
          <form className="admin-superior-buscar" action="/admin/pedidos" role="search">
            <SearchIcon aria-hidden="true" />
            <input type="search" name="q" placeholder="Buscar pedidos…" aria-label="Buscar pedidos" />
          </form>
        )}
        <a
          className={canSearchOrders ? "admin-superior-boton" : "admin-superior-boton ml-auto"}
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          title="Ver tienda"
          aria-label="Ver tienda (se abre en otra pestaña)"
        >
          <ExternalLinkIcon className="size-5" aria-hidden="true" />
        </a>
        <div className="admin-superior-cuenta">
          <Popover>
            <PopoverTrigger className="admin-usuario" aria-label={`Cuenta de ${name}`}>
              <span className="avatar" aria-hidden="true">
                {name.trim()[0]?.toUpperCase() ?? "A"}
              </span>
              <span className="nombre">{name}</span>
              <ChevronDownIcon className="flecha size-4" aria-hidden="true" />
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={8} className="admin-menu-usuario w-auto gap-0 p-0 ring-0">
              <p>
                <span className="block font-semibold text-[#343a40]">{name}</span>
                {user.email}
              </p>
              <a href="/" target="_blank" rel="noopener noreferrer">
                <ExternalLinkIcon className="size-4" aria-hidden="true" />
                Ver tienda
              </a>
              <form action={logout}>
                <button type="submit" className="salir">
                  <LogOutIcon className="size-4" aria-hidden="true" />
                  Cerrar sesión
                </button>
              </form>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      <Sidebar user={user} closed={closed} />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="admin-ui admin-hoja w-[280px] gap-0 border-0 p-0" showCloseButton={false}>
          <SheetTitle className="sr-only">Menú del panel</SheetTitle>
          <Sidebar user={user} onNavigate={() => setSheetOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}

function Sidebar({ user, closed, onNavigate }: { user: User; closed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const sections = SECTIONS.map((section) => ({
    ...section,
    links: section.links.filter((link) => hasPermission(user.permissions, link.permission)),
  })).filter((section) => section.links.length > 0);

  return (
    <aside className="admin-lateral" data-cerrado={closed ? "" : undefined} aria-label="Menú del panel">
      <nav>
        {sections.map((section) => (
          <div key={section.title}>
            <p className="admin-lateral-seccion">{section.title}</p>
            <ul>
              {section.links.map(({ href, label, icon: Icon, ready }) => (
                <li key={href}>
                  {ready ? (
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined}
                    >
                      <Icon aria-hidden="true" />
                      {label}
                    </Link>
                  ) : (
                    <span className="proximamente" aria-disabled="true">
                      <Icon aria-hidden="true" />
                      {label}
                      <small>Próximamente</small>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <p className="admin-lateral-seccion">Tienda</p>
        <ul>
          <li>
            <a href="/" target="_blank" rel="noopener noreferrer" onClick={onNavigate}>
              <ExternalLinkIcon aria-hidden="true" />
              Ver tienda
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
