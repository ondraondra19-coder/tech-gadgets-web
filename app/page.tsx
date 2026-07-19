import Header from "@/components/Header";
import VideoHero from "@/components/VideoHero";
import TrustBar from "@/components/TrustBar";
import CategoryProductRows from "@/components/CategoryProductRows";
import HowItWorks from "@/components/HowItWorks";
import Reviews from "@/components/Reviews";
import CategoryGrid from "@/components/CategoryGrid";
import InfoGrid from "@/components/InfoGrid";
import BlogPreview from "@/components/BlogPreview";
import Footer from "@/components/Footer";
import { getProductsForDisplay } from "@/lib/productDiscounts";
import { getStockMap } from "@/lib/stock";

export const revalidate = 180;

export default async function Home() {
  const products = await getProductsForDisplay();

  // Reálná dostupnost pro odznaky „Poslední kusy" / „Zbývá N skladem" na
  // kartách. Agregujeme na produkt jako max dostupných kusů napříč variantami
  // (stejná logika jako maxStock v kategorii). Když Sheets/Redis selže, karty
  // spadnou zpět na statické product.inStock.
  const availability: Record<string, number> = {};
  try {
    const stockMap = await getStockMap();
    for (const [key, count] of stockMap.entries()) {
      const slug = key.split("|")[0];
      availability[slug] = Math.max(availability[slug] ?? 0, count);
    }
  } catch (e) {
    console.warn("Stock fetch for homepage failed:", e);
  }

  return (
    <main className="min-h-screen bg-dark">
      <Header />
      <VideoHero />
      <TrustBar />
      <CategoryProductRows products={products} availability={availability} slugs={["vyhodne-sety", "zbrane"]} />
      <HowItWorks />
      <Reviews />
      <CategoryProductRows products={products} availability={availability} slugs={["munice"]} />
      <CategoryGrid />
      <CategoryProductRows products={products} availability={availability} slugs={["prislusenstvi"]} />
      <InfoGrid />
      <BlogPreview />
      <Footer />
    </main>
  );
}