import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { db } from "./lib/db";
import { hashPassword, verifyPassword } from "./lib/password";

// Hash de referencia para comparar aunque el correo no exista: así el tiempo de respuesta
// no revela qué correos están registrados.
const dummyHash = hashPassword("contraseña-que-no-existe");

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {}, area: {} },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? "");
        const expectedRole = credentials?.area === "admin" ? "ADMIN" : credentials?.area === "customer" ? "CUSTOMER" : null;
        if (!email || !password || password.length > 200 || !expectedRole) return null;

        const user = await db.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            passwordHash: true,
            role: true,
            permissions: true,
            isActive: true,
          },
        });
        const valid = await verifyPassword(password, user?.passwordHash ?? (await dummyHash));
        if (!user || !user.passwordHash || !valid || !user.isActive || user.role !== expectedRole) return null;

        await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        return { id: user.id, email: user.email, name: user.name, role: user.role, permissions: user.permissions };
      },
    }),
  ],
});
