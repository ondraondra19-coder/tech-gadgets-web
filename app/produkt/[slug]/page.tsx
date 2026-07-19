// app/produkt/[slug]/page.tsx
// Server Component — fetchuje produkt + skladovost, předá client komponentě

import { products as staticProducts } from "@/lib/products";
import { getProductsForDisplay } from "@/lib/productDiscounts";
import { getProductStock } from "@/lib/stock";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import ProduktClient from "@/components/ProduktClient";

export function generateStaticParams() {
  return staticProducts.map((p) => ({ slug: p.slug }));
}

// Stránka se dynamicky revaliduje — ne staticky builduje —
// aby skladovost i ceny (přepisy z admina) byly vždy čerstvé.
export const revalidate = 180; // sekund (= 3 min, stejně jako cache v stock.ts)

export default async function ProduktPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Katalog s aplikovanými přepisy cen z admina.
  const products = await getProductsForDisplay();

  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();

  const related = product.related && product.related.length > 0
    ? product.related.map((s) => products.find((p) => p.slug === s)).filter((p): p is typeof product => !!p).slice(0, 4)
    : products.filter((p) => p.slug !== product.slug && p.categories.some((c) => product.categories.includes(c))).slice(0, 4);

  // Fetchni skladovost pro tento produkt ze Sheets
  // Vrátí objekt jako: { "black|airpods-1-2": 12, "grey|-": 0, ... }
  const stockData = await getProductStock(slug);

  return (
    <>
      <Header />
      <ProduktClient
        product={product}
        related={related}
        stockData={stockData}
      />
    </>
  );
}