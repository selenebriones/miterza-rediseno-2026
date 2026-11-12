import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: { template: "%s | Panel Mi Terza", default: "Panel Mi Terza" },
  robots: { index: false, follow: false },
};

// Todo el panel lleva el diseño del administrador de terza-sitio (admin.css, dentro de .admin-ui).
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-ui flex min-h-full flex-1 flex-col">{children}</div>;
}
