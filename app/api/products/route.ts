// app/api/products/route.ts
// Veřejný endpoint — vrací katalog produktů S APLIKOVANÝMI přepisy cen
// z admina. Používají ho klientské komponenty, které potřebují AKTUÁLNÍ
// ceny, ale samy o sobě nemůžou volat Redis přímo (běží v prohlížeči):
// SearchBar (vyhledávání v hlavičce), košík (sekce "podobné produkty").
//
// Cache-Control hlavička říká Vercel CDN, ať odpověď cachuje 3 minuty —
// stejně jako ISR na produktových stránkách. Díky tomu se Redis zeptá
// maximálně jednou za 3 minuty CELKOVĚ (napříč všemi návštěvníky), ne
// při každém načtení stránky/otevření vyhledávání.
import { NextResponse } from "next/server";
import { getProductsForDisplay } from "@/lib/productDiscounts";

export async function GET() {
  try {
    const products = await getProductsForDisplay();
    return NextResponse.json(
      { products },
      { headers: { "Cache-Control": "public, s-maxage=180, stale-while-revalidate=60" } },
    );
  } catch (error) {
    console.error("Public products GET error:", error);
    return NextResponse.json({ error: "Nepodařilo se načíst produkty." }, { status: 500 });
  }
}