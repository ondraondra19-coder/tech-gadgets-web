// app/produkt/[slug]/page.tsx
// Server Component — fetchuje produkt + skladovost, předá client komponentě

import type { Metadata } from "next";
import { products as staticProducts } from "@/lib/products";
import { getProductsForDisplay } from "@/lib/productDiscounts";
import { getStock } from "@/lib/stock";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import ProduktClient from "@/components/ProduktClient";

export function generateStaticParams() {
  return staticProducts.map((p) => ({ slug: p.slug }));
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://slingr.vercel.app").replace(/\/$/, "");

// Zkrátí popis na ~160 znaků na hranici slova — do <meta description> a náhledů
// při sdílení. Delší text vyhledávače stejně oříznou.
function metaDescription(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= 160) return clean;
  return clean.slice(0, 157).replace(/\s+\S*$/, "") + "…";
}

// Titulek záložky + náhled při sdílení pro konkrétní produkt. Značku „Slingr"
// už názvy produktů nesou, proto `absolute` (obchází šablonu z layoutu, ať
// nevznikne „… Slingr | Slingr").
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = staticProducts.find((p) => p.slug === slug);
  if (!product) return { title: { absolute: "Produkt nenalezen | Slingr" } };

  const description = metaDescription(product.description);
  return {
    title: { absolute: `${product.name} | Slingr` },
    description,
    openGraph: {
      title: product.name,
      description,
      type: "website",
      url: `${SITE_URL}/produkt/${product.slug}`,
      images: [{ url: `${SITE_URL}${product.img}` }],
    },
  };
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

  // Skladovost tohoto produktu z Redisu (klíč = slug).
  const stock = await getStock(slug);

  return (
    <>
      <Header />
      <ProduktClient
        product={product}
        related={related}
        stock={stock}
      />
    </>
  );
}