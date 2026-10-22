"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { trackShop } from "@/lib/analytics";

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  image: string;
  unitPrice: number;
  color?: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (productId: string, color: string | undefined, quantity: number) => void;
  removeItem: (productId: string, color?: string) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);
const STORAGE_KEY = "cybervolt-cart";

function lineKey(productId: string, color?: string) {
  return `${productId}::${color ?? ""}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem: CartContextValue["addItem"] = (item, quantity = 1) => {
    trackShop("add_to_cart", [{ id: item.productId, name: item.name, price: item.unitPrice, quantity }]);
    setItems((prev) => {
      const key = lineKey(item.productId, item.color);
      const existing = prev.find((i) => lineKey(i.productId, i.color) === key);
      if (existing) {
        return prev.map((i) =>
          lineKey(i.productId, i.color) === key
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { ...item, quantity }];
    });
  };

  const updateQuantity: CartContextValue["updateQuantity"] = (productId, color, quantity) => {
    setItems((prev) =>
      prev
        .map((i) =>
          lineKey(i.productId, i.color) === lineKey(productId, color)
            ? { ...i, quantity }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const removeItem: CartContextValue["removeItem"] = (productId, color) => {
    setItems((prev) => prev.filter((i) => lineKey(i.productId, i.color) !== lineKey(productId, color)));
  };

  const clearCart = () => setItems([]);

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQuantity, removeItem, clearCart, itemCount, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
