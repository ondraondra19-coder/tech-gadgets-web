// app/api/admin/product-discounts/route.ts
// Uloží slevy na produkty (per produkt / model). Admin posílá procenta slevy
// dopočítaná z jím zadané zlevněné ceny; server je zvaliduje a uloží do Redisu
// přes setProductDiscountsBulk. Percent <= 0 slevu zruší.
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/session";
import { setProductDiscountsBulk } from "@/lib/productDiscounts";

type DiscountEntry = { slug: string; modelId?: string; percent: number };

export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Neautorizováno." }, { status: 401 });
  }
  if (!session.isMain && !session.permissions.includes("products")) {
    return NextResponse.json({ error: "Nemáte oprávnění k této akci." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const entries: DiscountEntry[] = body.entries;
    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: "Chybí data k uložení." }, { status: 400 });
    }

    for (const entry of entries) {
      if (!entry.slug || typeof entry.percent !== "number" || !Number.isFinite(entry.percent)) {
        return NextResponse.json({ error: "Neplatný formát dat." }, { status: 400 });
      }
      if (entry.percent >= 100) {
        return NextResponse.json({ error: "Sleva nemůže být 100 % nebo více." }, { status: 400 });
      }
    }

    await setProductDiscountsBulk(entries);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin product-discounts POST error:", error);
    return NextResponse.json({ error: "Uložení se nezdařilo." }, { status: 500 });
  }
}
