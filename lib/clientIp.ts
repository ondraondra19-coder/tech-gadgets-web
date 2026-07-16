// lib/clientIp.ts
// Zjištění IP klienta pro rate limiting. Sdílené místo — dřív měla každá
// route vlastní kopii, která brala x-forwarded-for.split(",")[0], tedy PRVNÍ
// hodnotu. Tu ale může klient sám podvrhnout: pošle "X-Forwarded-For: 1.2.3.4"
// a proxy (Vercel) k tomu jen připojí jeho skutečnou IP zprava. Braním první
// hodnoty tak šlo IP libovolně měnit a obcházet rate limit.
export function getClientIp(req: Request): string {
  // Na Vercelu je x-real-ip nastavené proxy na skutečnou IP klienta a klient
  // ho nemůže přepsat — proto přednostně.
  const realIp = req.headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();

  // Fallback (lokální dev / jiná infrastruktura): bereme POSLEDNÍ hodnotu,
  // kterou připojil nejbližší důvěryhodný proxy, ne první podvrhnutelnou.
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const parts = forwardedFor.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }

  return "unknown";
}
