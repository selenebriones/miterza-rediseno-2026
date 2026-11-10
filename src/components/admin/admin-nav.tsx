"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardListIcon,
  CreditCardIcon,
  ExternalLinkIcon,
  LayoutTemplateIcon,
  LogOutIcon,
  MenuIcon,
  PackageIcon,
  ShieldIcon,
  UsersIcon,
} from "lucide-react";
import { logout } from "@/app/admin/actions";
import { Logo } from "@/components/header/logo";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { AdminPermission } from "@/generated/prisma/enums";
import { ADMIN_NAV, hasPermission } from "@/lib/admin/permissions";
import { cn } from "@/lib/utils";

const ICONS = {
  orders: ClipboardListIcon,
  products: PackageIcon,
  content: LayoutTemplateIcon,
  payments: CreditCardIcon,
  customers: UsersIcon,
  admins: ShieldIcon,
};

type Props = { user: { name: string | null; email: string; permissions: AdminPermission[] } };

// Barra lateral (desktop) y encabezado con menú en hoja lateral (móvil).
export function AdminNav({ user }: Props) {
  return (
    <>
      <aside className="sticky top-0 hidden h-dvh flex-col bg-brand text-white lg:flex">
        <NavContent user={user} />
      </aside>

      <header className="sticky top-0 z-header flex h-14 items-center justify-between bg-brand px-2 text-white lg:hidden">
        <Sheet>
          <SheetTrigger
            aria-label="Abrir menú del panel"
            className="grid size-tap place-items-center rounded-full hover:bg-brand-hover"
          >
            <MenuIcon className="size-6" aria-hidden="true" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 gap-0 border-0 bg-brand p-0 text-white" showCloseButton={false}>
            <SheetTitle className="sr-only">Menú del panel</SheetTitle>
            <NavContent user={user} inSheet />
          </SheetContent>
        </Sheet>
        <Logo href="/admin" aria-label="Mi Terza, ir al panel" className="h-8" />
        <span className="w-tap" aria-hidden="true" />
      </header>
    </>
  );
}

function NavContent({ user, inSheet }: Props & { inSheet?: boolean }) {
  const pathname = usePathname();
  const items = ADMIN_NAV.filter((item) => hasPermission(user.permissions, item.permission));
  const Wrap = inSheet ? SheetClose : ({ children }: { children: React.ReactNode }) => <>{children}</>;

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center gap-3 px-5">
        <Logo href="/admin" aria-label="Mi Terza, ir al panel" className="h-9" />
        <span className="rounded-pill bg-white/15 px-2 py-0.5 text-xs font-semibold">Panel</span>
      </div>

      <nav aria-label="Módulos del panel" className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon = ICONS[item.icon];
            const active = pathname.startsWith(item.href);
            if (!item.ready) {
              return (
                <li key={item.href}>
                  <span
                    aria-disabled="true"
                    className="flex min-h-tap items-center gap-3 rounded-lg px-3 text-white/50"
                  >
                    <Icon className="size-5" aria-hidden="true" />
                    <span className="flex-1">{item.label}</span>
                    <span className="shrink-0 rounded-pill bg-white/10 px-1.5 py-0.5 text-[0.625rem]">Próximamente</span>
                  </span>
                </li>
              );
            }
            return (
              <li key={item.href}>
                <Wrap asChild>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-tap items-center gap-3 rounded-lg px-3 font-medium transition-colors",
                      active ? "bg-white text-brand" : "text-white/90 hover:bg-brand-hover",
                    )}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                    {item.label}
                  </Link>
                </Wrap>
              </li>
            );
          })}
        </ul>

        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex min-h-tap items-center gap-3 rounded-lg px-3 text-sm text-white/80 hover:bg-brand-hover"
        >
          <ExternalLinkIcon className="size-4" aria-hidden="true" />
          Ver tienda
        </a>
      </nav>

      <div className="shrink-0 border-t border-white/15 p-4">
        <p className="truncate text-sm font-semibold">{user.name ?? "Administrador"}</p>
        <p className="truncate text-xs text-white/70">{user.email}</p>
        <form action={logout} className="mt-3">
          <button
            type="submit"
            className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm text-white/90 hover:bg-brand-hover"
          >
            <LogOutIcon className="size-4" aria-hidden="true" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
