// lib/claims.ts
// Reklamace, vrácení a výměny z formuláře na /reklamace — uložené v Upstash
// Redis, viditelné v adminu (stejný vzor jako lib/messages.ts).
import { getRedis } from "./redis";

// Formulář na /reklamace řeší JEN odstoupení od smlouvy do 14 dnů (vrácení
// zboží bez udání důvodu). Reklamace vad a výměny se řeší mimo tento formulář
// (e-mailem / přes kontakt), proto tu není žádný typ žádosti ani způsob
// vyřízení — u odstoupení je výsledek vždycky vrácení peněz na účet zákazníka.
export type ClaimStatus = "novy" | "vyrizuje_se" | "vyrizeno";

export const CLAIM_STATUSES: ClaimStatus[] = ["novy", "vyrizuje_se", "vyrizeno"];

export type Claim = {
  id: string;
  ticket: string; // "SL-10001" — to, co zákazník vidí a čím se prokazuje
  jmeno: string;
  email: string;
  telefon: string;
  cisloObjednavky: string;
  cisloUctu: string; // kam vrátit peníze (číslo účtu nebo IBAN)
  duvod: string; // NEPOVINNÝ — u odstoupení do 14 dnů nesmíme důvod vyžadovat ("")
  date: string; // ISO
  status: ClaimStatus;
};

export type NewClaimInput = Omit<Claim, "id" | "ticket" | "date" | "status">;

const LIST_KEY = "claims:list";
const COUNTER_KEY = "claims:counter";
const MAX_CLAIMS = 2000; // pojistka proti neomezenému růstu klíče

// Číslo případu MUSÍ být stabilní a jedinečné — zákazník ho dostane mailem a
// odvolává se na něj. Dřív se generovalo na klientovi přes Math.random(), takže
// se po reloadu měnilo, mohlo kolidovat a nikde se neukládalo. INCR v Redisu je
// atomický, takže dvě reklamace odeslané naráz nikdy nedostanou stejné číslo.
const TICKET_OFFSET = 10000; // ať první případ není "SL-1"

async function nextTicket(): Promise<string> {
  const redis = getRedis();
  const n = await redis.incr(COUNTER_KEY);
  return `SL-${TICKET_OFFSET + n}`;
}

// ── Čtení ───────────────────────────────────────────────────────────────────

export async function getAllClaims(): Promise<Claim[]> {
  const redis = getRedis();
  const raw = await redis.lrange<string>(LIST_KEY, 0, -1);

  const claims: Claim[] = [];
  for (const item of raw) {
    try {
      const parsed: Claim = typeof item === "string" ? JSON.parse(item) : (item as unknown as Claim);
      claims.push(parsed);
    } catch {
      // Poškozenou položku tiše přeskočíme, ať nespadne celý výpis.
    }
  }
  return claims;
}

export async function getClaimById(id: string): Promise<Claim | null> {
  const claims = await getAllClaims();
  return claims.find((c) => c.id === id) ?? null;
}

// ── Zápis (validace probíhá v API route) ────────────────────────────────────

export async function addClaim(input: NewClaimInput): Promise<Claim> {
  const redis = getRedis();

  const claim: Claim = {
    id: crypto.randomUUID(),
    ticket: await nextTicket(),
    jmeno: input.jmeno.trim(),
    email: input.email.trim(),
    telefon: input.telefon.trim(),
    cisloObjednavky: input.cisloObjednavky.trim(),
    cisloUctu: input.cisloUctu.trim(),
    duvod: input.duvod.trim(),
    date: new Date().toISOString(),
    status: "novy",
  };

  await redis.lpush(LIST_KEY, JSON.stringify(claim));
  await redis.ltrim(LIST_KEY, 0, MAX_CLAIMS - 1);

  return claim;
}

export async function setClaimStatus(id: string, status: ClaimStatus): Promise<boolean> {
  const redis = getRedis();
  const raw = await redis.lrange<string>(LIST_KEY, 0, -1);

  const updated: string[] = [];
  let found = false;

  for (const item of raw) {
    try {
      const parsed: Claim = typeof item === "string" ? JSON.parse(item) : (item as unknown as Claim);
      if (parsed.id === id) {
        found = true;
        parsed.status = status;
      }
      updated.push(JSON.stringify(parsed));
    } catch {
      updated.push(item as unknown as string);
    }
  }

  if (!found) return false;

  await redis.del(LIST_KEY);
  if (updated.length > 0) await redis.rpush(LIST_KEY, ...updated);
  return true;
}

export async function deleteClaim(id: string): Promise<boolean> {
  const redis = getRedis();
  const raw = await redis.lrange<string>(LIST_KEY, 0, -1);

  const remaining: string[] = [];
  let found = false;

  for (const item of raw) {
    try {
      const parsed: Claim = typeof item === "string" ? JSON.parse(item) : (item as unknown as Claim);
      if (parsed.id === id) {
        found = true;
        continue; // vynecháme mazanou žádost
      }
      remaining.push(typeof item === "string" ? item : JSON.stringify(parsed));
    } catch {
      remaining.push(item as unknown as string);
    }
  }

  if (!found) return false;

  await redis.del(LIST_KEY);
  if (remaining.length > 0) await redis.rpush(LIST_KEY, ...remaining);
  return true;
}

// ── Základní anti-spam: 1 reklamace / IP / 5 minut ──────────────────────────
const COOLDOWN_SECONDS = 5 * 60;

export async function checkAndSetClaimCooldown(
  deviceId: string,
): Promise<{ allowed: boolean; ttlSeconds: number }> {
  const redis = getRedis();
  const key = `claims:cooldown:${deviceId}`;

  // NX = zapiš jen pokud klíč neexistuje.
  const setResult = await redis.set(key, "1", { nx: true, ex: COOLDOWN_SECONDS });
  if (setResult === "OK") return { allowed: true, ttlSeconds: 0 };

  const ttl = await redis.ttl(key);
  return { allowed: false, ttlSeconds: ttl > 0 ? ttl : COOLDOWN_SECONDS };
}
