// lib/productDiscounts.ts
// Vrstva SLEV nad katalogem — leží ještě nad price overrides (lib/priceOverrides.ts).
// Admin u produktu (nebo modelu) zadá zlevněnou cenu, z níž se dopočítá procento
// slevy. To procento se uloží do Redisu a při čtení se aplikuje na VŠECHNY měny
// (CZK/EUR/USD) — zlevněná cena se dopočítá a zaokrouhlí na celé jednotky.
//
// Proč procento a ne pevná cena? Admin zadá jen jednu (CZK) cenu, ale zákazník
// může mít vybranou EUR/USD. Uložením procenta zůstane sleva konzistentní napříč
// měnami bez nutnosti vyplňovat každou zvlášť.
//
// Klíč v Redis hashi je stejný jako u price overrides:
//   - "slug"           → sleva na základní cenu produktu
//   - "slug::modelId"   → sleva na cenu konkrétního modelu
import { getRedis } from "./redis";
import { getProductsWithPriceOverrides } from "./priceOverrides";
import { getProductOrder, sortProductsByOrder } from "./productOrder";
import type { Product, PriceValue } from "./products";

const HASH_KEY = "products:discounts";

// Minimální sleva, kterou má smysl ukládat/zobrazovat. Pod 1 % by odznak
// „−0 %" jen mátl a zlevněná cena by se od původní skoro nelišila.
const MIN_PERCENT = 1;

function discountKey(slug: string, modelId?: string): string {
  return modelId ? `${slug}::${modelId}` : slug;
}

function toPriceObject(price: PriceValue): { CZK: number; EUR?: number; USD?: number } {
  if (typeof price === "number") return { CZK: price };
  return { CZK: price.CZK, EUR: price.EUR, USD: price.USD };
}

// Vrátí mapu klíč → procento slevy (přesné, nezaokrouhlené).
export async function getProductDiscounts(): Promise<Record<string, number>> {
  const redis = getRedis();
  const raw = await redis.hgetall<Record<string, string | number>>(HASH_KEY);
  if (!raw) return {};
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw)) {
    const num = typeof value === "number" ? value : parseFloat(value);
    if (Number.isFinite(num) && num >= MIN_PERCENT) result[key] = num;
  }
  return result;
}

// Uloží slevy hromadně. Procento < MIN_PERCENT (nebo <= 0) slevu SMAŽE — tím
// admin slevu zruší tak, že zlevněnou cenu vymaže nebo nastaví >= původní.
export async function setProductDiscountsBulk(
  entries: { slug: string; modelId?: string; percent: number }[],
): Promise<void> {
  if (entries.length === 0) return;
  const redis = getRedis();

  const toSet: Record<string, number> = {};
  const toDelete: string[] = [];
  for (const { slug, modelId, percent } of entries) {
    const key = discountKey(slug, modelId);
    if (Number.isFinite(percent) && percent >= MIN_PERCENT) {
      toSet[key] = percent;
    } else {
      toDelete.push(key);
    }
  }

  if (Object.keys(toSet).length > 0) await redis.hset(HASH_KEY, toSet);
  if (toDelete.length > 0) await redis.hdel(HASH_KEY, ...toDelete);
}

// Aplikuje slevu na jednu PriceValue. Vrací zlevněnou cenu (zaokrouhlenou na
// celé jednotky v každé měně) + původní cenu + zaokrouhlené procento.
function applyDiscountToPrice(
  price: PriceValue,
  percent: number,
): { discounted: PriceValue; original: PriceValue; percent: number } {
  const original = toPriceObject(price);
  const factor = 1 - percent / 100;
  const discounted: { CZK: number; EUR?: number; USD?: number } = {
    CZK: Math.max(0, Math.round(original.CZK * factor)),
  };
  if (original.EUR !== undefined) discounted.EUR = Math.max(0, Math.round(original.EUR * factor));
  if (original.USD !== undefined) discounted.USD = Math.max(0, Math.round(original.USD * factor));
  return { discounted, original, percent: Math.round(percent) };
}

// Aplikuje slevy na kopii katalogu. Produkt/model se slevou dostane zlevněnou
// `price`, původní `originalPrice` a `discountPercent` pro odznak.
export function applyDiscountsToProducts(
  products: Product[],
  discounts: Record<string, number>,
): Product[] {
  if (Object.keys(discounts).length === 0) return products;

  return products.map((product) => {
    const basePercent = discounts[discountKey(product.slug)];
    if (!basePercent) return product;

    const { discounted, original, percent } = applyDiscountToPrice(product.price, basePercent);
    return { ...product, price: discounted, originalPrice: original, discountPercent: percent };
  });
}

// Katalog s aplikovanými price overrides A slevami — používají to všechny
// stránky, které zákazníkovi ZOBRAZUJÍ ceny (homepage, kategorie, detail,
// vyhledávání), i /api/checkout a /api/orders (aby se strhla zlevněná částka).
export async function getProductsForDisplay(): Promise<Product[]> {
  const [products, discounts, order] = await Promise.all([
    getProductsWithPriceOverrides(),
    getProductDiscounts(),
    getProductOrder(),
  ]);
  // Doporučené pořadí z admina se aplikuje jako poslední — homepage i kategorie
  // pak vidí produkty ve stejném, adminem řízeném pořadí.
  return sortProductsByOrder(applyDiscountsToProducts(products, discounts), order);
}
