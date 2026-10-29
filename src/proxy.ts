import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

// Revisión rápida y optimista: sin sesión → login. La autorización real (rol, permisos,
// usuario activo) la hacen las páginas y acciones del panel en el servidor.
const { auth } = NextAuth(authConfig);

const PUBLIC_ADMIN_PATHS = ["/admin/login"];

export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const isPublic = PUBLIC_ADMIN_PATHS.includes(pathname);

  if (!req.auth && !isPublic) {
    const url = new URL("/admin/login", req.url);
    url.searchParams.set("desde", pathname + search);
    return NextResponse.redirect(url);
  }
  if (req.auth && isPublic) {
    return NextResponse.redirect(new URL("/admin/pedidos", req.url));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
