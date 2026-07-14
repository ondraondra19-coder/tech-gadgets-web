"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { getPrice, type Currency } from "@/lib/currency";
import { calcDiscount, getActiveSlugs, type Discount } from "@/lib/discounts";

// Kódy teď žijí v Redisu (spravuje je admin) — ověřujeme je přes API, ne
// synchronně z lokálního pole jako dřív.
async function fetchDiscount(code: string): Promise<Discount | null> {
  try {
    const res = await fetch(`/api/discounts/check?code=${encodeURIComponent(code)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.discount ?? null;
  } catch {
    return null;
  }
}

export type PriceRaw = number | Partial<Record<"CZK" | "EUR" | "USD", number>>;

export type CartItem = {
  slug: string;
  name: string;
  priceCZK: number;
  priceRaw: PriceRaw;
  img: string;
  variants?: Record<string, string>;
  quantity: number;
  stockKey?: string | string[]; // klíč (nebo víc klíčů u vrstvených barev) ve formátu "color|size" pro lookup skladu
};

type CartContext = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, maxQuantity?: number) => void;
  removeItem: (slug: string, variants?: Record<string, string>) => void;
  updateQuantity: (slug: string, quantity: number, variants?: Record<string, string>, maxQuantity?: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPriceCZK: number;
  getItemPrice: (item: CartItem, currency: Currency) => number;
  getTotalPrice: (currency: Currency) => number;
  appliedDiscount: Discount | null;
  applyDiscountCode: (code: string) => Promise<"ok" | "invalid">;
  removeDiscount: () => void;
  isDiscountActive: () => boolean;
  getDiscountAmount: (currency: Currency) => number;
  getFinalPrice: (currency: Currency) => number;
};

const CartCtx = createContext<CartContext | null>(null);

function itemKey(slug: string, variants?: Record<string, string>) {
  return slug + JSON.stringify(variants ?? {});
}

const STORAGE_KEY = "hackpack-cart";
const DISCOUNT_KEY = "hackpack-discount";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const migrated = parsed.map((item: any) => ({
          ...item,
          priceCZK: item.priceCZK ?? item.price ?? 0,
          priceRaw: item.priceRaw ?? item.priceCZK ?? item.price ?? 0,
        }));
        setItems(migrated);
      }
    } catch {}
    try {
      const stored = localStorage.getItem(DISCOUNT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Optimisticky rovnou zobrazíme uložený kód, pak na pozadí ověříme,
        // že ještě platí (admin ho mezitím mohl smazat/deaktivovat/nechat vypršet).
        setAppliedDiscount(parsed);
        fetchDiscount(parsed.code).then((live) => {
          if (live) {
            setAppliedDiscount(live);
          } else {
            setAppliedDiscount(null);
            try { localStorage.removeItem(DISCOUNT_KEY); } catch {}
          }
        });
      }
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
  }, [items]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">, maxQuantity?: number) => {
    setItems((prev) => {
      const key = itemKey(item.slug, item.variants);
      const exists = prev.find((i) => itemKey(i.slug, i.variants) === key);
      if (exists) {
        return prev.map((i) => {
          if (itemKey(i.slug, i.variants) !== key) return i;
          const newQty = i.quantity + 1;
          if (maxQuantity !== undefined && newQty > maxQuantity) return i; // nepřekroč sklad
          return { ...i, quantity: newQty };
        });
      }
      if (maxQuantity !== undefined && maxQuantity < 1) return prev; // 0 na skladě
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((slug: string, variants?: Record<string, string>) => {
    setItems((prev) => prev.filter((i) => itemKey(i.slug, i.variants) !== itemKey(slug, variants)));
  }, []);

  const updateQuantity = useCallback((slug: string, quantity: number, variants?: Record<string, string>, maxQuantity?: number) => {
    if (quantity < 1) return;
    const clamped = maxQuantity !== undefined ? Math.min(quantity, maxQuantity) : quantity;
    setItems((prev) =>
      prev.map((i) => itemKey(i.slug, i.variants) === itemKey(slug, variants) ? { ...i, quantity: clamped } : i)
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPriceCZK = items.reduce((s, i) => s + i.priceCZK * i.quantity, 0);

  const getItemPrice = useCallback((item: CartItem, currency: Currency): number => {
    return getPrice(item.priceRaw as any, currency);
  }, []);

  const getTotalPrice = useCallback((currency: Currency): number => {
    return items.reduce((s, i) => s + getPrice(i.priceRaw as any, currency) * i.quantity, 0);
  }, [items]);

  // ── Discount ───────────────────────────────────────────────────────────────

  // Vrátí položky košíku na které se sleva vztahuje
  const getEligibleItems = useCallback((discount: Discount): CartItem[] => {
    const slugs = getActiveSlugs(discount);
    if (!slugs) return items; // active: true = celý košík
    return items.filter(i => slugs.includes(i.slug));
  }, [items]);

  const applyDiscountCode = useCallback(async (code: string): Promise<"ok" | "invalid"> => {
    const discount = await fetchDiscount(code);
    if (!discount) return "invalid";
    setAppliedDiscount(discount);
    try { localStorage.setItem(DISCOUNT_KEY, JSON.stringify(discount)); } catch {}
    return "ok";
  }, []);

  const removeDiscount = useCallback(() => {
    setAppliedDiscount(null);
    try { localStorage.removeItem(DISCOUNT_KEY); } catch {}
  }, []);

  const isDiscountActive = useCallback((): boolean => {
    if (!appliedDiscount) return false;
    const eligible = getEligibleItems(appliedDiscount);
    if (eligible.length === 0) return false; // žádné způsobilé produkty v košíku
    if (appliedDiscount.minOrderCZK && totalPriceCZK < appliedDiscount.minOrderCZK) return false;
    return true;
  }, [appliedDiscount, getEligibleItems, totalPriceCZK]);

  const getDiscountAmount = useCallback((currency: Currency): number => {
    if (!appliedDiscount || !isDiscountActive()) return 0;
    const eligible = getEligibleItems(appliedDiscount);
    const eligibleCZK = eligible.reduce((s, i) => s + i.priceCZK * i.quantity, 0);
    const eligibleInCurrency = eligible.reduce((s, i) => s + getPrice(i.priceRaw as any, currency) * i.quantity, 0);
    return calcDiscount(appliedDiscount, eligibleCZK, eligibleInCurrency);
  }, [appliedDiscount, isDiscountActive, getEligibleItems]);

  const getFinalPrice = useCallback((currency: Currency): number => {
    return Math.max(0, getTotalPrice(currency) - getDiscountAmount(currency));
  }, [getTotalPrice, getDiscountAmount]);

  return (
    <CartCtx.Provider value={{
      items, addItem, removeItem, updateQuantity, clearCart,
      totalItems, totalPriceCZK, getItemPrice, getTotalPrice,
      appliedDiscount, applyDiscountCode, removeDiscount,
      isDiscountActive, getDiscountAmount, getFinalPrice,
    }}>
      {children}
    </CartCtx.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}