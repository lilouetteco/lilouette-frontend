import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  addToCart,
  clearCart,
  createCartSession,
  fetchCart,
  removeFromCart,
  type Product,
} from "@/lib/api";

export type CartItem = Product & { quantity: number };
type RawItem = { product_slug: string; quantity: number };

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (product: Product) => void;
  removeItem: (slug: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);
const SESSION_KEY = "lilouette.cart.session";

export function CartProvider({ children, products }: { children: ReactNode; products: Product[] }) {
  // Read from localStorage immediately so sessionId is never null while init() awaits
  const [sessionId, setSessionId] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem(SESSION_KEY) : null,
  );
  const [rawItems, setRawItems] = useState<RawItem[]>([]);

  // Build a stable product lookup map
  const productMap = useMemo(
    () => Object.fromEntries(products.map((p) => [p.slug, p])),
    [products],
  );

  // Derive CartItem[] reactively — re-computes whenever rawItems OR products change.
  // This eliminates all race-condition bugs between the two async fetches.
  const items = useMemo(
    () =>
      rawItems.flatMap((i) => {
        const p = productMap[i.product_slug];
        return p ? [{ ...p, quantity: i.quantity }] : [];
      }),
    [rawItems, productMap],
  );

  useEffect(() => {
    async function init() {
      const id = localStorage.getItem(SESSION_KEY);
      if (id) {
        try {
          const cart = await fetchCart(id);
          setRawItems(cart.items);
          return;
        } catch {
          localStorage.removeItem(SESSION_KEY);
          setSessionId(null);
        }
      }
      const cart = await createCartSession();
      localStorage.setItem(SESSION_KEY, cart.id);
      setSessionId(cart.id);
    }
    init();
  }, []);

  const addItem = async (product: Product) => {
    if (!sessionId) return;
    const existingBefore = rawItems.find((i) => i.product_slug === product.slug);
    if (existingBefore && existingBefore.quantity >= 1) return;

    // Optimistic update — source of truth for adds
    setRawItems((prev) => {
      const existing = prev.find((i) => i.product_slug === product.slug);
      if (existing) {
        return prev.map((i) =>
          i.product_slug === product.slug ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { product_slug: product.slug, quantity: 1 }];
    });

    try {
      await addToCart(sessionId, product.slug);
      // Do NOT overwrite rawItems from the API response — doing so would clobber
      // any other items added concurrently while this request was in flight.
    } catch {
      // Revert only on error
      setRawItems((prev) => {
        const existing = prev.find((i) => i.product_slug === product.slug);
        if (!existing || existing.quantity <= 1) return prev.filter((i) => i.product_slug !== product.slug);
        return prev.map((i) =>
          i.product_slug === product.slug ? { ...i, quantity: i.quantity - 1 } : i,
        );
      });
    }
  };

  const removeItem = async (slug: string) => {
    if (!sessionId) return;
    const before = rawItems;
    setRawItems((prev) => prev.filter((i) => i.product_slug !== slug));
    try {
      await removeFromCart(sessionId, slug);
    } catch {
      setRawItems(before);
    }
  };

  const clear = async () => {
    if (!sessionId) return;
    setRawItems([]);
    await clearCart(sessionId);
    localStorage.removeItem(SESSION_KEY);
    const cart = await createCartSession();
    localStorage.setItem(SESSION_KEY, cart.id);
    setSessionId(cart.id);
  };

  // Use rawItems for the count badge — stays accurate even before products resolve
  const count = rawItems.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.price, 0);

  return (
    <CartContext.Provider value={{ items, count, subtotal, addItem, removeItem, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
