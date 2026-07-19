// app/kategorie/[slug]/page.tsx
import { getCategoryBySlug, categories } from "@/lib/products";
import { getProductsForDisplay } from "@/lib/productDiscounts";
import { getStockMap } from "@/lib/stock";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import KategorieClient from "@/components/KategorieClient";

export function generateStaticParams() {
  return categories.map(cat => ({ slug: cat.slug }));
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

  // Fetchni celou stock mapu jedním voláním (je cachovaná)
  // a sestav { [slug]: { "color|size": number } } pro produkty v kategorii
  const stockData: Record<string, Record<string, number>> = {};
  try {
    const stockMap = await getStockMap();
    for (const product of products) {
      const productStock: Record<string, number> = {};
      for (const [key, count] of stockMap.entries()) {
        const [keySlug, color, size] = key.split("|");
        if (keySlug === product.slug) {
          productStock[`${color}|${size}`] = count;
        }
      }
      if (Object.keys(productStock).length > 0) {
        stockData[product.slug] = productStock;
      }
    }
  } catch (e) {
    // Sheets nedostupné — fallback na products.ts inStock/stock
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