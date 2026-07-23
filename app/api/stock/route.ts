// app/api/stock/route.ts
// Read-only endpoint — vrací aktuální sklad pro daný produkt z Upstash Redis
// (viz lib/stock.ts). Žádné rezervace.
import { NextResponse } from "next/server";
import { getStock } from "@/lib/stock";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  try {
    const stock = await getStock(slug);
    return NextResponse.json({ stock });
  } catch (error) {
    console.error("Stock fetch error:", error);
    return NextResponse.json({ stock: 0 });
  }
}