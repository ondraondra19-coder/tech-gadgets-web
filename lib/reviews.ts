// lib/reviews.ts
// Recenze uložené v Upstash Redis — viditelné pro všechny návštěvníky.
import { getRedis } from "./redis";

export type Review = {
  id: string;
  initials: string;
  name: string;
  rating: number; // 1-5
  date: string;   // ISO string, formátování na klientu
  text: string;
  // ── Následující pole jsou VIDITELNÁ JEN V ADMINU (nikdy se nevrací z veřejného GET) ──
  email?: string;
  ip?: string;
  userAgent?: string;
  country?: string;   // ISO kód země, např. "CZ" (z Vercel geo headerů)
  region?: string;    // kraj/region
  city?: string;
};

// ── Veřejný tvar recenze — bez emailu, IP, zařízení a lokality ─────────────
export type PublicReview = Pick<Review, "id" | "initials" | "name" | "rating" | "date" | "text">;

export function toPublicReview(review: Review): PublicReview {
  const { id, initials, name, rating, date, text } = review;
  return { id, initials, name, rating, date, text };
}
const LIST_KEY = "reviews:list";
const MAX_REVIEWS = 1000; // pojistka proti neomezenému růstu klíče

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

// ── Čtení všech recenzí (nejnovější první) ──────────────────────────────────
export async function getAllReviews(): Promise<Review[]> {
  const redis = getRedis();
  const raw = await redis.lrange<string>(LIST_KEY, 0, -1);

  const reviews: Review[] = [];
  for (const item of raw) {
    try {
      // @upstash/redis může vracet už parsovaný objekt, nebo string – ošetříme obojí.
      const parsed: Review = typeof item === "string" ? JSON.parse(item) : (item as unknown as Review);
      reviews.push(parsed);
    } catch {
      // Poškozenou položku tiše přeskočíme, ať nespadne celý výpis.
    }
  }
  return reviews;
}

// ── Vstup pro vytvoření nové recenze (validace probíhá v API route) ─────────
export type NewReviewInput = {
  name: string;
  rating: number;
  text: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  country?: string;
  region?: string;
  city?: string;
};

export async function addReview(input: NewReviewInput): Promise<Review> {
  const redis = getRedis();

  const review: Review = {
    id: crypto.randomUUID(),
    initials: getInitials(input.name),
    name: input.name.trim(),
    rating: input.rating,
    date: new Date().toISOString(),
    text: input.text.trim(),
    ...(input.email?.trim() ? { email: input.email.trim() } : {}),
    ...(input.ip ? { ip: input.ip } : {}),
    ...(input.userAgent ? { userAgent: input.userAgent } : {}),
    ...(input.country ? { country: input.country } : {}),
    ...(input.region ? { region: input.region } : {}),
    ...(input.city ? { city: input.city } : {}),
  };

  await redis.lpush(LIST_KEY, JSON.stringify(review));
  await redis.ltrim(LIST_KEY, 0, MAX_REVIEWS - 1);

  return review;
}

// ── Smazání konkrétní recenze podle id (pro budoucí admin rozhraní) ────────
export async function deleteReview(id: string): Promise<boolean> {
  const redis = getRedis();
  const raw = await redis.lrange<string>(LIST_KEY, 0, -1);

  const remaining: string[] = [];
  let found = false;

  for (const item of raw) {
    try {
      const parsed: Review = typeof item === "string" ? JSON.parse(item) : (item as unknown as Review);
      if (parsed.id === id) {
        found = true;
        continue; // vynecháme mazanou recenzi
      }
      remaining.push(typeof item === "string" ? item : JSON.stringify(parsed));
    } catch {
      remaining.push(item as unknown as string);
    }
  }

  if (!found) return false;

  // Přepíšeme celý list bez smazané položky (pořadí zůstává stejné - nejnovější první).
  await redis.del(LIST_KEY);
  if (remaining.length > 0) {
    await redis.rpush(LIST_KEY, ...remaining);
  }

  return true;
}

// ── Základní anti-spam: 1 recenze / IP / 24h ────────────────────────────────
const COOLDOWN_SECONDS = 24 * 60 * 60;

export async function checkAndSetCooldown(ip: string): Promise<{ allowed: boolean; ttlSeconds: number }> {
  const redis = getRedis();
  const key = `reviews:cooldown:${ip}`;

  // NX = zapiš jen pokud klíč neexistuje. Vrátí "OK" pokud se to povedlo.
  const setResult = await redis.set(key, "1", { nx: true, ex: COOLDOWN_SECONDS });

  if (setResult === "OK" || setResult === null) {
    // set s nx vrací null pokud klíč nešel zapsat kvůli existenci (podle verze klienta),
    // proto rozlišujeme přes samostatný get níže pro jistotu.
  }

  if (setResult === "OK") {
    return { allowed: true, ttlSeconds: 0 };
  }

  const ttl = await redis.ttl(key);
  return { allowed: false, ttlSeconds: ttl > 0 ? ttl : COOLDOWN_SECONDS };
}