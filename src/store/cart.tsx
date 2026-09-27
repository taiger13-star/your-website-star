import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { ColorId, ShopSystem, SizeCode } from "@/lib/types";

export type { ColorId, ShopSystem, SizeCode } from "@/lib/types";

const CART_KEY = "noir-atelier.cart.v1";

export type CartItem = {
  key: string;
  productId: string;
  sku: string;
  size: SizeCode;
  bodyColor: ColorId;
  insertColor: ColorId;
  system: ShopSystem;
  qty: number;
  unitPrice: number;
};

type CartContextValue = {
  items: CartItem[];
  hydrated: boolean;
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "key">) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  has: (productId: string) => boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

function makeKey(item: Omit<CartItem, "key">): string {
  return [item.productId, item.size, item.bodyColor, item.insertColor, item.system].join("__");
}

function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i): i is CartItem =>
        !!i && typeof i.productId === "string" && typeof i.qty === "number" && i.qty > 0,
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      // storage unavailable (private mode) — cart stays in memory for this session
    }
  }, [items, hydrated]);

  const add = useCallback((item: Omit<CartItem, "key">) => {
    const key = makeKey(item);
    setItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) =>
          i.key === key ? { ...i, qty: Math.min(99, i.qty + item.qty), unitPrice: item.unitPrice } : i,
        );
      }
      return [...prev, { ...item, key }];
    });
  }, []);

  const remove = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.key !== key)
        : prev.map((i) => (i.key === key ? { ...i, qty: Math.min(99, qty) } : i)),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, i) => sum + i.qty, 0);
    const subtotal = items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
    return {
      items,
      hydrated,
      count,
      subtotal,
      add,
      remove,
      setQty,
      clear,
      has: (productId: string) => items.some((i) => i.productId === productId),
    };
  }, [items, hydrated, add, remove, setQty, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
