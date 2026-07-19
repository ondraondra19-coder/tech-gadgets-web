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
import { getProductsWithPriceOverrides } from "@/lib/priceOverrides";

export const revalidate = 180;

export default async function Home() {
  const products = await getProductsWithPriceOverrides();

  return (
    <main className="min-h-screen bg-dark">
      <Header />
      <VideoHero />
      <TrustBar />
      <CategoryProductRows products={products} slugs={["vyhodne-sety", "zbrane"]} />
      <HowItWorks />
      <Reviews />
      <CategoryProductRows products={products} slugs={["munice"]} />
      <CategoryGrid />
      <CategoryProductRows products={products} slugs={["prislusenstvi"]} />
      <InfoGrid />
      <BlogPreview />
      <Footer />
    </main>
  );
}