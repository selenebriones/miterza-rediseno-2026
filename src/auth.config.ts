import type { NextAuthConfig } from "next-auth";
import type { AdminPermission, Role } from "@/generated/prisma/enums";

// Configuración sin acceso a la base: la comparten el proxy y auth.ts.
// El rol y los permisos viajan en el JWT solo para decisiones rápidas (proxy, menú);
// las páginas y acciones del panel los vuelven a leer de la base antes de actuar.
export const authConfig = {
  pages: { signIn: "/admin/login" },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 }, // jornada de trabajo
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.permissions = user.permissions;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub ?? "";
      session.user.role = token.role;
      session.user.permissions = token.permissions ?? [];
      return session;
    },
  },
} satisfies NextAuthConfig;

declare module "next-auth" {
  interface User {
    role?: Role;
    permissions?: AdminPermission[];
  }
  interface Session {
    user: { id: string; role?: Role; permissions: AdminPermission[]; email?: string | null; name?: string | null };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: Role;
    permissions?: AdminPermission[];
  }
}
