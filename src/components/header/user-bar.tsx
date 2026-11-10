import Link from "next/link";
import { LogOutIcon, UserIcon } from "lucide-react";
import { customerLogout } from "@/app/(acceso)/cuenta/actions";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

// Franja superior solo con sesión: quién está dentro, acceso a su cuenta y cerrar sesión.
// Verde más oscuro que la barra de aviso para que no se confundan.
export async function UserBar() {
  const session = await getSession();
  if (!session?.user) return null;
  // El nombre sale de la base: así se ve al día justo después de editarlo en "Mis datos" (la cookie de
  // sesión se actualiza en esa misma respuesta y esta lectura todavía tendría la anterior).
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { name: true } });
  const firstName = (user?.name ?? session.user.name)?.split(" ")[0];

  return (
    <div className="bg-brand-dark text-sm text-white">
      <div className="container flex h-10 items-center justify-between gap-4">
        <p className="flex min-w-0 items-center gap-2">
          <UserIcon className="size-4 shrink-0 text-accent" aria-hidden="true" />
          <span className="truncate">
            Hola{firstName ? `, ${firstName}` : ""}
            <span className="hidden text-white/70 sm:inline"> · {session.user.email}</span>
          </span>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          {/* En móvil sobra: el ícono de cuenta del header lleva al mismo lugar. */}
          <Link href="/cuenta" className="rounded-pill px-3 py-1 font-semibold hover:bg-white/10 max-sm:hidden">
            Mi cuenta
          </Link>
          <form action={customerLogout}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-pill bg-white/10 px-3 py-1 font-semibold transition-colors hover:bg-white hover:text-brand"
            >
              <LogOutIcon className="size-3.5" aria-hidden="true" />
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
