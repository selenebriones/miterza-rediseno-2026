import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { template: "%s | Panel Mi Terza", default: "Panel Mi Terza" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-full flex-1 flex-col bg-muted">{children}</div>;
}
