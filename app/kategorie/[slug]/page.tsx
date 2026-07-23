// app/kategorie/[slug]/page.tsx
import type { Metadata } from "next";
import { getCategoryBySlug, categories, getProductsByCategory } from "@/lib/products";
import { getProductsForDisplay } from "@/lib/productDiscounts";
import { getStockMap } from "@/lib/stock";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import KategorieClient from "@/components/KategorieClient";

export function generateStaticParams() {
  return categories.map(cat => ({ slug: cat.slug }));
}

// Titulek záložky pro kategorii — název kategorie + značka přes šablonu
// z layoutu (např. „Zbraně | Slingr"). Popis se sestaví z názvů produktů,
// ať má stránka pro vyhledávače konkrétní, ne generický text.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return { title: "Kategorie nenalezena" };

  const names = getProductsByCategory(slug).map((p) => p.name);
  const description =
    names.length > 0
      ? `${category.name} v e-shopu Slingr: ${names.slice(0, 5).join(", ")}. Expedice do 24 hodin.`
      : `${category.name} v e-shopu Slingr — praky a výbava na venkovní bitvy.`;

  return {
    title: category.name,
    description,
    openGraph: { title: `${category.name} | Slingr`, description, type: "website" },
  };
}

export const revalidate = 180;

export default async function KategoriePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  // Katalog s aplikovanými přepisy cen z admina.
  const allProducts = await getProductsForDisplay();
  const products = allProducts.filter((p) => p.categories.includes(slug));

  // Fetchni celou stock mapu jedním voláním (je cachovaná) a sestav
  // { [slug]: number } pro produkty v kategorii (klíč skladu = slug).
  const stockData: Record<string, number> = {};
  try {
    const stockMap = await getStockMap();
    for (const product of products) {
      const count = stockMap.get(product.slug);
      if (count !== undefined) stockData[product.slug] = count;
    }
  } catch (e) {
    // Redis nedostupný — fallback na products.ts inStock/stock
    console.warn("Stock fetch failed, using fallback:", e);
  }

  return (
    <>
      <Header />
      <KategorieClient
        category={category}
        products={products}
        stockData={stockData}
      />
    </>
  );
}