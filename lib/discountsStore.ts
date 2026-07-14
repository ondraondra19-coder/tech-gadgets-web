// lib/discountsStore.ts
// Server-only úložiště slevových kódů v Redisu (stejný vzor jako lib/accounts.ts).
// Odděleno od lib/discounts.ts, protože ten je importovaný i z klientských
// komponent — Redis/crypto tam nesmí, jinak by se nepodařilo sestavit klientský bundle.
import { randomUUID } from "crypto";
import { getRedis } from "./redis";
import {
  isActive,
  calcDiscount,
  getActiveSlugs,
  type Discount,
  type DiscountType,
  type DiscountCartItem,
  type ResolvedDiscount,
} from "./discounts";

const LIST_KEY = "discounts:list";

// Kódy, které dřív žily natvrdo v kódu — naplní se do Redisu při prvním
// čtení, ať přechodem na Redis nezmizí z fungujícího webu.
const DEFAULT_DISCOUNTS: Omit<Discount, "id" | "createdAt">[] = [
  {
    code: "VITEJ10",
    type: "percent",
    value: 10,
    label: "Uvítací sleva 10 %",
    active: ["nahradni-hroty-apple-pencil"],
  },
  {
    code: "LETO2025",
    type: "percent",
    value: 15,
    label: "Letní sleva 15 %",
    minOrderCZK: 500,
    active: true,
  },
  {
    code: "SLEVA50",
    type: "fixed",
    value: 50,
    label: "Sleva 50 Kč",
    minOrderCZK: 300,
    active: true,
  },
];

export async function getAllDiscounts(): Promise<Discount[]> {
  const redis = getRedis();
  const raw = await redis.lrange<string>(LIST_KEY, 0, -1);

  if (raw.length === 0) {
    const seeded: Discount[] = DEFAULT_DISCOUNTS.map((d) => ({
      ...d,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    }));
    await redis.rpush(LIST_KEY, ...seeded.map((d) => JSON.stringify(d)));
    return seeded;
  }

  const discounts: Discount[] = [];
  for (const item of raw) {
    try {
      const parsed: Discount = typeof item === "string" ? JSON.parse(item) : (item as unknown as Discount);
      discounts.push(parsed);
    } catch {
      // Poškozenou položku tiše přeskočíme.
    }
  }
  return discounts;
}

/** Najde kód bez ohledu na velká/malá písmena, pouze aktivní a nevypršelý. */
export async function findDiscount(code: string | null | undefined): Promise<Discount | undefined> {
  if (!code || !code.trim()) return undefined;
  const discounts = await getAllDiscounts();
  const target = code.trim().toUpperCase();
  return discounts.find((d) => d.code.toUpperCase() === target && isActive(d));
}

export type NewDiscountInput = {
  code: string;
  type: DiscountType;
  value: number;
  label: string;
  minOrderCZK?: number;
  active?: boolean;
  expiresAt?: string;
};

export async function addDiscount(input: NewDiscountInput): Promise<Discount> {
  const redis = getRedis();

  const discount: Discount = {
    id: randomUUID(),
    code: input.code.trim().toUpperCase(),
    type: input.type,
    value: input.value,
    label: input.label.trim(),
    minOrderCZK: input.minOrderCZK,
    active: input.active ?? true,
    expiresAt: input.expiresAt,
    createdAt: new Date().toISOString(),
  };

  await redis.rpush(LIST_KEY, JSON.stringify(discount));
  return discount;
}

export async function deleteDiscount(id: string): Promise<boolean> {
  const redis = getRedis();
  const raw = await redis.lrange<string>(LIST_KEY, 0, -1);

  const remaining: string[] = [];
  let found = false;

  for (const item of raw) {
    try {
      const parsed: Discount = typeof item === "string" ? JSON.parse(item) : (item as unknown as Discount);
      if (parsed.id === id) {
        found = true;
        continue; // vynecháme mazaný kód
      }
      remaining.push(typeof item === "string" ? item : JSON.stringify(parsed));
    } catch {
      remaining.push(item as unknown as string);
    }
  }

  if (!found) return false;

  await redis.del(LIST_KEY);
  if (remaining.length > 0) {
    await redis.rpush(LIST_KEY, ...remaining);
  }
  return true;
}

// ── Server-side vyhodnocení slevy ───────────────────────────────────────────
// Slevu NIKDY nepočítáme z částky poslané klientem (šla by poslat libovolná).
// Vezmeme jen KÓD, znovu ověříme způsobilost a spočítáme částku z aktuálních
// cen v katalogu. Zopakuje pravidla z lib/cart.tsx (getEligibleItems /
// isDiscountActive / getDiscountAmount), ale bez závislosti na Reactu.
//
// Ceny se dotahují přes callbacky (variant-aware — u produktů s modely se cena
// liší podle výběru), aby si tenhle modul nemusel tahat katalog/přepisy cen.
export async function resolveDiscountForOrder(
  code: string | null | undefined,
  items: DiscountCartItem[],
  unitPriceCZK: (item: DiscountCartItem) => number,
  unitPriceInCurrency: (item: DiscountCartItem) => number,
): Promise<ResolvedDiscount> {
  const none: ResolvedDiscount = {
    discountCode: null,
    discountLabel: null,
    discountAmountCZK: 0,
    discountInCurrency: 0,
  };

  const discount = await findDiscount(code);
  if (!discount) return none;

  const slugs = getActiveSlugs(discount);
  const eligible = slugs ? items.filter((i) => slugs.includes(i.slug)) : items;
  if (eligible.length === 0) return none; // žádné způsobilé produkty v košíku

  // minOrderCZK se posuzuje z CELÉHO košíku (ne jen způsobilých položek) —
  // stejně jako totalPriceCZK v lib/cart.tsx.
  const fullCartCZK = items.reduce((sum, i) => sum + unitPriceCZK(i) * i.quantity, 0);
  if (discount.minOrderCZK && fullCartCZK < discount.minOrderCZK) return none;

  const eligibleCZK = eligible.reduce((sum, i) => sum + unitPriceCZK(i) * i.quantity, 0);
  const eligibleInCurrency = eligible.reduce((sum, i) => sum + unitPriceInCurrency(i) * i.quantity, 0);

  return {
    discountCode: discount.code,
    discountLabel: discount.label,
    discountAmountCZK: calcDiscount(discount, eligibleCZK, eligibleCZK),
    discountInCurrency: calcDiscount(discount, eligibleCZK, eligibleInCurrency),
  };
}
