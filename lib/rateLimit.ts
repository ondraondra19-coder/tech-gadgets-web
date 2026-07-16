// lib/rateLimit.ts
// Jednoduchý per-klíč rate limit (sliding-ish okno) nad Redisem. Na rozdíl od
// checkAndSetCooldown v lib/reviews.ts (striktní "1 akce za okno") tady povolíme
// až `max` akcí za `windowSeconds` — vhodné pro checkout, kde reálný zákazník
// může legitimně založit víc objednávek / zopakovat po zamítnuté kartě.
import { getRedis } from "./redis";

// INCR a EXPIRE musí proběhnout atomicky. Kdyby to byly dvě samostatné operace
// (incr; if count===1 expire) a proces spadl mezi nimi, klíč by zůstal bez
// expirace navždy — a daná IP by byla zamčená natrvalo. Lua skript v Redisu
// běží jako jeden nedělitelný krok, takže tahle mezera nevznikne.
const INCR_WITH_EXPIRE = `
  local count = redis.call("INCR", KEYS[1])
  if count == 1 then
    redis.call("EXPIRE", KEYS[1], ARGV[1])
  end
  return count
`;

export async function checkRateLimit(key: string, max: number, windowSeconds: number): Promise<boolean> {
  const redis = getRedis();
  const count = (await redis.eval(INCR_WITH_EXPIRE, [key], [windowSeconds])) as number;
  return count <= max;
}
