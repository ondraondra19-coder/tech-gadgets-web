// lib/stock.ts
// Skladovost uložená v Upstash Redis — spravovaná přímo z admin panelu.
// Každý produkt je jediná skladová položka pod klíčem = jeho slug (produkty
// nemají varianty ani barvy).
//
// SETY: produkt s vyplněným `bundle` (viz lib/products.ts) vlastní skladové
// pole v Redisu NEMÁ. Jeho dostupnost se dopočítá z komponent a do mapy se
// vloží jako virtuální pole pod slugem setu — díky tomu všechna čtecí místa
// (homepage, kategorie, detail produktu, /api/stock, košík, admin) vidí set
// jako běžný produkt se skladem. Objednaný set se při odečtu rozpadne na komponenty.
import { getRedis } from "./redis";
import { getWatchersForFields, notifyAndRemove } from "./stockWatch";
import { bundles, getBundleStock, getProductBySlug, isBundle, expandBundle } from "./products";

export type StockMap = Map<string, number>;

const HASH_KEY = "stock:map";

// Cache — krátké vyhlazení v rámci jedné serverless instance. Na Vercelu se
// mezi jednotlivými invokacemi spolehnout nedá, ale v rámci jednoho běhu pomůže.
let cache: StockMap | null = null;
let cacheTime = 0;
const CACHE_TTL = 30 * 1000; // 30s

async function fetchFromRedis(): Promise<StockMap> {
  const redis = getRedis();
  const raw = await redis.hgetall<Record<string, number | string>>(HASH_KEY);
  const map: StockMap = new Map();
  if (!raw) return map;

  for (const [key, value] of Object.entries(raw)) {
    const num = typeof value === "number" ? value : parseInt(String(value), 10);
    if (!isNaN(num)) map.set(key, num);
  }
  return map;
}

/**
 * Doplní do mapy virtuální skladová pole setů, dopočítaná z komponent.
 * Komponenta se hledá pod svým slugem; set se ukládá pod svým slugem.
 */
function withBundleStock(map: StockMap): StockMap {
  for (const bundle of bundles) {
    const available = getBundleStock(bundle, (slug) => map.get(slug) ?? 0);
    map.set(bundle.slug, available);
  }
  return map;
}

export async function getStockMap(): Promise<StockMap> {
  const now = Date.now();
  if (cache && now - cacheTime < CACHE_TTL) return cache;

  cache = withBundleStock(await fetchFromRedis());
  cacheTime = now;
  return cache;
}

export async function getStock(slug: string): Promise<number> {
  const map = await getStockMap();
  return map.get(slug) ?? 0;
}

// ── Naskladnění → e-mail čekatelům ──────────────────────────────────────────
// Volá se po každém zápisu, který mohl poslat pole z nuly nahoru. Zájemce
// nasbíral formulář "Připomenout, až bude skladem" (viz lib/stockWatch.ts).
//
// Odeslání NIKDY nesmí shodit samotný zápis skladu — proto je celé tělo v
// try/catch a chyba se jen zaloguje, stejně jako to dělá lib/email.ts.
async function notifyRestocked(restockedFields: string[]): Promise<void> {
  if (restockedFields.length === 0) return;

  try {
    const watchers = await getWatchersForFields(restockedFields);
    if (watchers.length === 0) return;

    const map = await fetchFromRedis();
    const ready = watchers.filter((w) => w.fields.every((f) => (map.get(f) ?? 0) > 0));

    await notifyAndRemove(ready);
  } catch (err) {
    console.error("Odeslání e-mailů o naskladnění selhalo:", err);
  }
}

// ── Zápis skladu z admin panelu ──────────────────────────────────────────────

/** Sklad setu je dopočítaný z komponent — uložit ho nejde. */
function isBundleSlug(slug: string): boolean {
  const product = getProductBySlug(slug);
  return !!product && isBundle(product);
}

export async function setStock(slug: string, value: number): Promise<void> {
  if (isBundleSlug(slug)) {
    console.warn(`Sklad setu ${slug} se neukládá — dopočítává se z komponent.`);
    return;
  }

  const redis = getRedis();
  const safeValue = Math.max(0, Math.floor(value));

  // Starou hodnotu potřebujeme kvůli rozpoznání přechodu 0 → N.
  const previous = Number(await redis.hget<number | string>(HASH_KEY, slug)) || 0;

  await redis.hset(HASH_KEY, { [slug]: safeValue });

  // Celá cache pryč: změna komponenty mění i dopočítaný sklad setu, který ji obsahuje.
  cache = null;

  if (previous === 0 && safeValue > 0) await notifyRestocked([slug]);
}

// Hromadné uložení více produktů najednou — jeden HSET požadavek do Redisu.
export async function setStockBulk(
  entries: { slug: string; value: number }[],
): Promise<void> {
  if (entries.length === 0) return;

  const redis = getRedis();
  const fields: Record<string, number> = {};

  for (const { slug, value } of entries) {
    if (isBundleSlug(slug)) continue; // sklad setu se nedopisuje, dopočítá se
    fields[slug] = Math.max(0, Math.floor(value));
  }

  const names = Object.keys(fields);
  if (names.length === 0) return;

  const previous = await redis.hmget<Record<string, number | string>>(HASH_KEY, ...names);

  await redis.hset(HASH_KEY, fields);
  cache = null;

  const restocked = names.filter(
    (field) => (Number(previous?.[field]) || 0) === 0 && fields[field] > 0,
  );
  await notifyRestocked(restocked);
}

// ── Automatický odečet při dokončené objednávce ─────────────────────────────
// Vstup: slug produktu a objednané množství. Odečet je ATOMICKÝ a "všechno nebo
// nic": Lua skript nejdřív ověří, že KAŽDÁ položka má dost skladu, a teprve pak
// odečte — takže při dvou objednávkách naráz o poslední kus nemůže sklad spadnout
// pod nulu (přeprodání). Když nestačí, nic se neodečte a vrátí se seznam
// nedostatkových slugů.
export type StockDeductionItem = {
  slug: string;
  quantity: number;
};

/**
 * Nahradí objednané sety jejich komponentami. Set žádné skladové pole nemá,
 * takže bez tohohle kroku by odečet sáhl na slug setu, našel nulu a objednávku
 * by označil jako nedostatkovou. Množství se násobí.
 */
function expandBundlesForStock(items: StockDeductionItem[]): StockDeductionItem[] {
  const expanded: StockDeductionItem[] = [];

  for (const item of items) {
    if (!isBundleSlug(item.slug)) {
      expanded.push(item);
      continue;
    }
    for (const part of expandBundle(item.slug, item.quantity)) {
      expanded.push({ slug: part.slug, quantity: part.quantity });
    }
  }

  return expanded;
}

// Atomický check-and-decrement: buď mají všechna pole dost skladu a všechna se
// odečtou, nebo se nesáhne na nic a vrátí se seznam nedostatkových polí.
const DEDUCT_SCRIPT = `
local hashKey = KEYS[1]
local numPairs = #ARGV / 2
local insufficient = {}
for i = 1, numPairs do
  local field = ARGV[(i - 1) * 2 + 1]
  local amount = tonumber(ARGV[(i - 1) * 2 + 2])
  local current = tonumber(redis.call('HGET', hashKey, field) or '0')
  if current < amount then
    table.insert(insufficient, field)
  end
end
if #insufficient > 0 then
  return insufficient
end
for i = 1, numPairs do
  local field = ARGV[(i - 1) * 2 + 1]
  local amount = tonumber(ARGV[(i - 1) * 2 + 2])
  redis.call('HINCRBY', hashKey, field, -amount)
end
return {}
`;

// Opak deductStockForItems — vrátí kusy zpět na sklad (zrušená objednávka).
export async function restockItems(items: StockDeductionItem[]): Promise<void> {
  const redis = getRedis();
  const totals = new Map<string, number>();

  for (const item of expandBundlesForStock(items)) {
    totals.set(item.slug, (totals.get(item.slug) ?? 0) + item.quantity);
  }

  if (totals.size === 0) return;

  const pipeline = redis.pipeline();
  const entries = [...totals.entries()];
  for (const [field, amount] of entries) {
    pipeline.hincrby(HASH_KEY, field, amount);
  }
  const results = (await pipeline.exec()) as unknown as number[];

  cache = null;

  const restocked = entries
    .filter(([, amount], i) => {
      const after = Number(results?.[i]);
      return Number.isFinite(after) && after - amount === 0 && after > 0;
    })
    .map(([field]) => field);
  await notifyRestocked(restocked);
}

export async function deductStockForItems(
  items: StockDeductionItem[],
): Promise<{ ok: true } | { ok: false; insufficientFields: string[] }> {
  const redis = getRedis();

  const totals = new Map<string, number>();
  for (const item of expandBundlesForStock(items)) {
    totals.set(item.slug, (totals.get(item.slug) ?? 0) + item.quantity);
  }

  if (totals.size === 0) return { ok: true };

  const args: string[] = [];
  for (const [field, amount] of totals.entries()) {
    args.push(field, String(amount));
  }

  const insufficientFields = await redis.eval<string[], string[]>(DEDUCT_SCRIPT, [HASH_KEY], args);

  if (insufficientFields.length > 0) {
    return { ok: false, insufficientFields };
  }

  cache = null;
  return { ok: true };
}
