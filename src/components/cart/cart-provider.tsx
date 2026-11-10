"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { blindSizeKey, type BlindSize } from "@/lib/blind-size";

export type CartItem = {
  variantId: string;
  slug: string;
  name: string;
  variantLabel?: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  // Persianas: medida a la medida del cliente (su leyenda va en variantLabel).
  size?: BlindSize;
};

// Identificador de la línea: la variante y, en persianas, la medida (otra medida es otra línea).
export const cartLineKey = (item: Pick<CartItem, "variantId" | "size">) =>
  item.size ? `${item.variantId}:${blindSizeKey(item.size)}` : item.variantId;

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (lineKey: string, quantity: number) => void;
  removeItem: (lineKey: string) => void;
  replaceItems: (items: CartItem[]) => void; // tras validar contra la base
  // Cupón aplicado (código y monto que confirmó el servidor). El pedido lo vuelve a validar.
  coupon: AppliedCoupon | null;
  setCoupon: (coupon: AppliedCoupon | null) => void;
  clear: () => void;
  // false en el servidor y en el primer render: aún no se leyó localStorage.
  hydrated: boolean;
  // Cambia en cada alta; el badge lo usa como `key` para repetir la animación.
  bumpKey: number;
};

export type AppliedCoupon = { code: string; amount: number };

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "miterza-cart";
const COUPON_KEY = "miterza-coupon";
const EMPTY_CART: CartItem[] = [];

// Descarta líneas dañadas (cantidad o precio que no son números), p. ej. de una versión anterior.
const isValidLine = (i: CartItem) =>
  Number.isInteger(i.quantity) && i.quantity > 0 && Number.isFinite(i.price) && typeof i.variantId === "string";
const clean = (list: CartItem[]) => (list.every(isValidLine) ? list : list.filter(isValidLine));

// Carrito de invitado en localStorage. Al tener sesión se sincronizará con la base.
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [storedItems, setItems] = useLocalStorage(STORAGE_KEY, EMPTY_CART);
  const items = useMemo(() => clean(storedItems), [storedItems]);
  const [coupon, setStoredCoupon] = useLocalStorage<AppliedCoupon | null>(COUPON_KEY, null);
  const [isOpen, setOpen] = useState(false);
  const [bumpKey, setBumpKey] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const addItem = useCallback<CartContextValue["addItem"]>(
    (item, rawQuantity = 1) => {
      const quantity = Number.isInteger(rawQuantity) && rawQuantity > 0 ? rawQuantity : 1;
      setItems((stored) => {
        const current = clean(stored);
        const key = cartLineKey(item);
        const existing = current.find((i) => cartLineKey(i) === key);
        if (existing) {
          return current.map((i) => (cartLineKey(i) === key ? { ...i, quantity: i.quantity + quantity } : i));
        }
        return [...current, { ...item, quantity }];
      });
      setBumpKey((k) => k + 1);
      setAnnouncement(`${item.name} se agregó al carrito`);
    },
    [setItems],
  );

  const updateQuantity = useCallback(
    (lineKey: string, quantity: number) => {
      setItems((stored) => {
        const current = clean(stored);
        return !Number.isInteger(quantity) || quantity <= 0
          ? current.filter((i) => cartLineKey(i) !== lineKey)
          : current.map((i) => (cartLineKey(i) === lineKey ? { ...i, quantity } : i));
      });
    },
    [setItems],
  );

  const removeItem = useCallback(
    (lineKey: string) => {
      setItems((current) => current.filter((i) => cartLineKey(i) !== lineKey));
    },
    [setItems],
  );

  const replaceItems = useCallback((next: CartItem[]) => setItems(next), [setItems]);
  const setCoupon = useCallback((next: AppliedCoupon | null) => setStoredCoupon(next), [setStoredCoupon]);
  const clear = useCallback(() => {
    setItems(null);
    setStoredCoupon(null);
  }, [setItems, setStoredCoupon]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      isOpen,
      setOpen,
      addItem,
      updateQuantity,
      removeItem,
      replaceItems,
      coupon,
      setCoupon,
      clear,
      hydrated,
      bumpKey,
    }),
    [items, isOpen, addItem, updateQuantity, removeItem, replaceItems, coupon, setCoupon, clear, hydrated, bumpKey],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return context;
}
