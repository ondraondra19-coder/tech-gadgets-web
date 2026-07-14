// app/api/discounts/check/route.ts
// Veřejný endpoint pro ověření slevového kódu z košíku (lib/cart.tsx). Kódy
// teď žijí v Redisu (viz lib/discountsStore.ts), takže je klient nemůže číst
// přímo — a to je i bezpečnostní plus: dřív byl celý seznam kódů (i budoucích/
// neaktivních) součástí klientského JS bundlu.
import { NextResponse } from "next/server";
import { findDiscount } from "@/lib/discountsStore";
import { checkRateLimit } from "@/lib/rateLimit";

function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

export async function GET(req: Request) {
  const ip = getClientIp(req);
  // Bránit hádání kódů hrubou silou — pár desítek pokusů za minutu stačí i
  // legitimnímu uživateli, co si překlepne kód.
  if (!(await checkRateLimit(`discount-check:${ip}`, 30, 60))) {
    return NextResponse.json({ error: "Příliš mnoho pokusů. Zkuste to prosím za chvíli." }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  const discount = await findDiscount(code);
  if (!discount) {
    return NextResponse.json({ error: "Tento kód neexistuje nebo již není platný." }, { status: 404 });
  }

  // Konečnou částku slevy VŽDY přepočítá server znovu při checkoutu
  // (resolveDiscountForOrder) — tohle je jen pro zobrazení v košíku.
  return NextResponse.json({
    discount: {
      code: discount.code,
      type: discount.type,
      value: discount.value,
      label: discount.label,
      minOrderCZK: discount.minOrderCZK,
      active: discount.active,
    },
  });
}
