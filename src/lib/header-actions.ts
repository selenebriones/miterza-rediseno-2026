export type HeaderActionKey = "search" | "favorites" | "account" | "cart";
export type HeaderIconKey = "search" | "search-check" | "package-search" | "heart" | "bookmark" | "heart-handshake" | "user-round" | "circle-user-round" | "contact-round" | "shopping-bag" | "shopping-cart" | "shopping-basket";
export type HeaderActionSetting = { key: HeaderActionKey; visible: boolean; icon: HeaderIconKey; label: string; href: string | null };

export const HEADER_ICON_OPTIONS: Record<HeaderActionKey, { value: HeaderIconKey; label: string }[]> = {
  search: [{ value: "search", label: "Lupa" }, { value: "search-check", label: "Lupa con marca" }, { value: "package-search", label: "Paquete con lupa" }],
  favorites: [{ value: "heart", label: "Corazón" }, { value: "bookmark", label: "Marcador" }, { value: "heart-handshake", label: "Corazón con manos" }],
  account: [{ value: "user-round", label: "Usuario" }, { value: "circle-user-round", label: "Usuario en círculo" }, { value: "contact-round", label: "Contacto" }],
  cart: [{ value: "shopping-bag", label: "Bolsa" }, { value: "shopping-cart", label: "Carrito" }, { value: "shopping-basket", label: "Canasta" }],
};

export const DEFAULT_HEADER_ACTIONS: HeaderActionSetting[] = [
  { key: "search", visible: true, icon: "search", label: "Buscar", href: null },
  { key: "favorites", visible: true, icon: "heart", label: "Favoritos", href: "/favoritos" },
  { key: "account", visible: true, icon: "user-round", label: "Mi cuenta", href: "/cuenta" },
  { key: "cart", visible: true, icon: "shopping-bag", label: "Carrito", href: null },
];

const isInternalHref = (value: unknown): value is string => typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !/[\u0000-\u001f]/.test(value);

export function normalizeHeaderActions(value: unknown): HeaderActionSetting[] {
  const saved = Array.isArray(value) ? value.filter((item) => item !== null && typeof item === "object") as Partial<HeaderActionSetting>[] : [];
  const byKey = new Map(saved.filter((item) => DEFAULT_HEADER_ACTIONS.some((base) => base.key === item.key)).map((item) => [item.key!, item]));
  const order = saved.map((item) => item.key).filter((key): key is HeaderActionKey => DEFAULT_HEADER_ACTIONS.some((base) => base.key === key));
  const uniqueOrder = [...new Set(order)];
  for (const item of DEFAULT_HEADER_ACTIONS) if (!uniqueOrder.includes(item.key)) uniqueOrder.push(item.key);
  return uniqueOrder.map((key) => {
    const base = DEFAULT_HEADER_ACTIONS.find((item) => item.key === key)!;
    const current = byKey.get(key);
    const allowedIcons = HEADER_ICON_OPTIONS[key].map((option) => option.value);
    return {
      key,
      visible: typeof current?.visible === "boolean" ? current.visible : base.visible,
      icon: allowedIcons.includes(current?.icon as HeaderIconKey) ? current!.icon! : base.icon,
      label: typeof current?.label === "string" && current.label.trim().length <= 40 ? current.label.trim() || base.label : base.label,
      href: key === "favorites" || key === "account" ? isInternalHref(current?.href) ? current.href : base.href : null,
    };
  });
}
