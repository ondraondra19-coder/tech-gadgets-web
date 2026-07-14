// lib/discounts.ts
// Typy a čisté (bezstavové) pomocné funkce pro slevové kódy — bez závislosti
// na Redisu, takže tenhle modul může být bezpečně importovaný i z klientských
// komponent (lib/cart.tsx, DiscountWidget.tsx). Načítání/ukládání kódů žije
// v lib/discountsStore.ts (server-only, Upstash Redis).
// ─────────────────────────────────────────────────────────────────────────────

export type DiscountType = "percent" | "fixed";

export type Discount = {
  // id/createdAt chybí u toho, co posílá /api/discounts/check klientovi
  // (veřejný endpoint vrací jen pole potřebná pro zobrazení v košíku).
  id?: string;
  code: string;         // kód (case-insensitive při porovnání)
  type: DiscountType;   // "percent" = 10 % z ceny | "fixed" = 50 Kč fixně
  value: number;        // pro percent: 0–100, pro fixed: částka v CZK
  label: string;        // popisek zobrazený zákazníkovi
  minOrderCZK?: number; // volitelně: minimální cena celého košíku v CZK
  active: boolean | string[]; // true = celý košík | false = vypnutý | ["slug1"] = jen tyto produkty
  expiresAt?: string;   // volitelné datum platnosti "YYYY-MM-DD" (platí do konce dne)
  createdAt?: string;
};

// ── Orientační kurzy pro zobrazení v jiných měnách ───────────────────────────
export const APPROX_RATES: Record<string, number> = {
  EUR: 25,
  USD: 23,
  CZK: 1,
};

export function approxConvert(czk: number, currencyCode: string): number {
  const rate = APPROX_RATES[currencyCode] ?? 1;
  return czk / rate;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Vrátí true pokud je kód aktivní (active !== false) a ještě nevypršel. */
export function isActive(discount: Discount): boolean {
  if (discount.active === false) return false;
  if (discount.expiresAt) {
    const expiry = new Date(`${discount.expiresAt}T23:59:59`);
    if (Date.now() > expiry.getTime()) return false;
  }
  return true;
}

/** Vrátí slugy produktů na které se sleva vztahuje, nebo null = celý košík */
export function getActiveSlugs(discount: Discount): string[] | null {
  if (Array.isArray(discount.active)) return discount.active;
  return null; // true/false = celý košík
}

/**
 * Vypočítá výši slevy v dané měně.
 * eligibleInCurrency = částka způsobilých položek v aktuální měně
 * eligibleCZK        = stejné v CZK (pro přepočet fixed slev)
 */
export function calcDiscount(
  discount: Discount,
  eligibleCZK: number,
  eligibleInCurrency: number,
): number {
  if (discount.type === "percent") {
    return (eligibleInCurrency * discount.value) / 100;
  }
  if (eligibleCZK === 0) return 0;
  const ratio = eligibleInCurrency / eligibleCZK;
  return discount.value * ratio;
}

export type ResolvedDiscount = {
  discountCode: string | null;
  discountLabel: string | null;
  discountAmountCZK: number; // pro uložení/zobrazení v objednávce
  discountInCurrency: number; // částka k odečtení v měně objednávky
};

export type DiscountCartItem = {
  slug: string;
  quantity: number;
  variants?: Record<string, string>;
};
