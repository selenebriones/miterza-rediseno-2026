import { BookmarkIcon, ContactRoundIcon, HeartHandshakeIcon, HeartIcon, PackageSearchIcon, SearchCheckIcon, SearchIcon, ShoppingBagIcon, ShoppingBasketIcon, ShoppingCartIcon, CircleUserRoundIcon, UserRoundIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { HeaderIconKey } from "@/lib/header-actions";

const icons = {
  search: SearchIcon,
  "search-check": SearchCheckIcon,
  "package-search": PackageSearchIcon,
  heart: HeartIcon,
  bookmark: BookmarkIcon,
  "heart-handshake": HeartHandshakeIcon,
  "user-round": UserRoundIcon,
  "circle-user-round": CircleUserRoundIcon,
  "contact-round": ContactRoundIcon,
  "shopping-bag": ShoppingBagIcon,
  "shopping-cart": ShoppingCartIcon,
  "shopping-basket": ShoppingBasketIcon,
} satisfies Record<HeaderIconKey, LucideIcon>;

export function HeaderActionIcon({ icon, className }: { icon: HeaderIconKey; className?: string }) {
  const Icon = icons[icon] ?? SearchIcon;
  return <Icon className={className} strokeWidth={1.75} aria-hidden="true" />;
}
