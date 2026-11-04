"use client";

import Link from "next/link";
import { PhoneIcon, XIcon } from "lucide-react";
import type { Announcement, NavItem } from "@/lib/navigation";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { storeConfig } from "@/lib/store-config";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "miterza-announcement-dismissed";

type Props = {
  announcement: Announcement | null;
  links: NavItem[];
};

// Fuera del header fijo: al bajar se va con la página, sin JavaScript de por medio.
// En móvil solo muestra el aviso; en desktop además los enlaces de información.
export function AnnouncementBar({ announcement, links }: Props) {
  const [dismissedId, setDismissedId] = useLocalStorage<string | null>(DISMISS_KEY, null);
  const dismissed = announcement !== null && dismissedId === announcement.id;

  function dismiss() {
    if (announcement) setDismissedId(announcement.id);
  }

  const showMessage = announcement && !dismissed;

  return (
    <div className={cn("bg-brand text-sm text-white", !showMessage && "max-lg:hidden")}>
      <div className="container flex h-10 items-center gap-4 lg:h-8">
        {showMessage ? (
          <p className="flex-1 truncate text-center font-medium lg:text-left">
            {announcement.title}
            {announcement.ctaUrl && (
              <span className="hidden sm:inline">
                <span aria-hidden="true"> · </span>
                <Link href={announcement.ctaUrl} className="underline underline-offset-2 hover:no-underline">
                  {announcement.ctaLabel ?? "Ver más"}
                </Link>
              </span>
            )}
          </p>
        ) : (
          <span className="flex-1" />
        )}

        <nav aria-label="Información" className="hidden items-center gap-5 lg:flex">
          {links.map((link) => (
            <Link key={link.id} href={link.href} className="hover:underline hover:underline-offset-2">
              {link.label}
            </Link>
          ))}
          <a href={storeConfig.supportPhoneHref} className="flex items-center gap-1.5 font-medium hover:underline">
            <PhoneIcon className="size-3.5" aria-hidden="true" />
            {storeConfig.supportPhone}
          </a>
        </nav>

        {showMessage && (
          <button
            type="button"
            onClick={dismiss}
            aria-label="Cerrar aviso"
            className="-mr-2 grid size-10 shrink-0 place-items-center rounded-full hover:bg-white/15 lg:size-7"
          >
            <XIcon className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
