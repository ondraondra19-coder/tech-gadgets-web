// lib/productOrder.ts
// Doporučené pořadí produktů — spravované z admin panelu, uložené v Upstash
// Redis. Aplikuje se centrálně v getProductsForDisplay(), takže stejné pořadí
// vidí homepage (featured řádky) i stránky kategorií.
//
// Uloženo jako hash `catalog:order` = { slug: index }. Nižší index = dřív.
// Produkty bez uloženého indexu spadnou ZA seřazené a mezi sebou si drží
// pořadí z katalogu (lib/products.ts) — díky stabilnímu řazení.
import { getRedis } from "./redis";

const HASH_KEY = "catalog:order";

export async function getProductOrder(): Promise<Record<string, number>> {
  try {
    const redis = getRedis();
    const raw = await redis.hgetall<Record<string, number | string>>(HASH_KEY);
    const out: Record<string, number> = {};
    if (raw) {
      for (const [slug, value] of Object.entries(raw)) {
        const n = typeof value === "number" ? value : parseInt(String(value), 10);
        if (Number.isFinite(n)) out[slug] = n;
      }
    }
    return out;
  } catch {
    // Redis nedostupný (nebo statická generace) — spadneme na katalogové pořadí.
    return {};
  }
}

// Uloží celé pořadí — pole slugů v cílovém pořadí. Přepíše celý hash (staré
// slugy, které v poli nejsou, se zahodí), ať v Redisu nezůstávají duchové.
export async function setProductOrder(slugs: string[]): Promise<void> {
  const redis = getRedis();
  const fields: Record<string, number> = {};
  slugs.forEach((slug, i) => {
    fields[slug] = i;
  });
  await redis.del(HASH_KEY);
  if (Object.keys(fields).length > 0) {
    await redis.hset(HASH_KEY, fields);
  }
}

// Stabilně seřadí produkty podle uloženého pořadí. Neseřazené jdou na konec
// v původním pořadí (JS Array.sort je od ES2019 stabilní).
export function sortProductsByOrder<T extends { slug: string }>(
  products: T[],
  order: Record<string, number>,
): T[] {
  const UNSET = Number.MAX_SAFE_INTEGER;
  return [...products].sort(
    (a, b) => (order[a.slug] ?? UNSET) - (order[b.slug] ?? UNSET),
  );
}
