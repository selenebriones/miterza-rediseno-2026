import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { storeConfig } from "@/lib/store-config";

const roobert = localFont({
  src: "./fonts/Roobert-Variable.ttf",
  variable: "--font-roobert",
  weight: "300 900",
  display: "swap",
});

export const metadata: Metadata = {
  // Base para URLs absolutas de Open Graph (imágenes al compartir en redes).
  metadataBase: new URL(storeConfig.siteUrl),
  title: "Mi Terza",
  description: "Tienda en línea de Mi Terza",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-MX" className={`${roobert.variable} h-full`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
