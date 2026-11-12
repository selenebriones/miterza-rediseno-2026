import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = Omit<React.ComponentProps<typeof Link>, "href" | "children"> & {
  // "light": logo en blanco para fondos brand; "color": original para fondos claros.
  tone?: "light" | "color";
  href?: React.ComponentProps<typeof Link>["href"];
  src?: string;
};

// Pendiente: pedir al cliente el logo en SVG (versión a color y versión en blanco).
export function Logo({ className, tone = "light", href = "/", src = "/brand/mi-terza-logo.png", ...props }: LogoProps) {
  return (
    <Link
      href={href}
      aria-label="Mi Terza, ir al inicio"
      className={cn("flex h-9 shrink-0 items-center rounded-md lg:h-11", className)}
      {...props}
    >
      <Image
        src={src}
        alt=""
        width={206}
        height={90}
        loading="eager"
        unoptimized={src.startsWith("https://")}
        className={cn("h-full w-auto", tone === "light" && "brightness-0 invert")}
      />
    </Link>
  );
}
