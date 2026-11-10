import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

// Revisión rápida por sesión: solo ADMIN cruza al panel. La autorización real (usuario
// activo y permisos específicos) la hacen las páginas y acciones en el servidor.
const { auth } = NextAuth(authConfig);

const PUBLIC_ADMIN_PATHS = ["/admin/login"];

export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const isPublic = PUBLIC_ADMIN_PATHS.includes(pathname);
  const isAdmin = req.auth?.user.role === "ADMIN";

  if (!isAdmin && !isPublic) {
    const url = new URL("/admin/login", req.url);
    url.searchParams.set("desde", pathname + search);
    return NextResponse.redirect(url);
  }
  if (isAdmin && isPublic) {
    return NextResponse.redirect(new URL("/admin/pedidos", req.url));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
