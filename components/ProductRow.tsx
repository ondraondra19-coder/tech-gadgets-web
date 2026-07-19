"use client";

// Jeden horizontální carousel produktových karet ve stylu blastro.cz — bílá
// karta: fotka nahoře, pod ní název, cena a stav skladu. Nadpis sekce vlevo,
// vpravo „Zobrazit vše" + šipky (desktop). Znovupoužitelné pro libovolnou
// sekci (kategorie, novinky…).
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import type { Product } from "@/lib/products";
import { getProductName } from "@/lib/products";
import { useCurrency } from "@/lib/CurrencyContext";
import { formatPrice, getPrice } from "@/lib/currency";
import { useLang } from "@/lib/LangContext";
import { useT } from "@/lib/useT";

export default function ProductRow({
  title,
  subtitle,
  viewAllHref,
  products,
}: {
  title: string;
  subtitle?: string;
  viewAllHref: string;
  products: Product[];
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const { currency } = useCurrency();
  const { locale } = useLang();
  const t = useT("productrow");

  if (products.length === 0) return null;

  function scrollByCards(dir: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  }

  return (
    <section className="py-6 lg:py-8">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">

        {/* Hlavička sekce — velký poutavý nadpis + krátký popisek */}
        <div className="flex items-end justify-between gap-4 mb-5">
          <div className="min-w-0">
            <h2 className="text-2xl lg:text-3xl font-extrabold text-text-base tracking-tight leading-tight">{title}</h2>
            {subtitle && <p className="mt-1 text-text-muted text-sm lg:text-base">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <Link
              href={viewAllHref}
              className="inline-flex items-center gap-1.5 text-primary-ink text-sm font-semibold hover:gap-2.5 transition-all whitespace-nowrap"
            >
              {t("viewAll")}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={() => scrollByCards(-1)}
                aria-label={t("prev")}
                className="w-10 h-10 rounded-full border-2 border-border-strong text-text-muted flex items-center justify-center hover:border-primary hover:text-primary-ink transition-colors"
              >
                <ChevronLeft size={17} />
              </button>
              <button
                onClick={() => scrollByCards(1)}
                aria-label={t("next")}
                className="w-10 h-10 rounded-full border-2 border-border-strong text-text-muted flex items-center justify-center hover:border-primary hover:text-primary-ink transition-colors"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel */}
        <div
          ref={trackRef}
          className="flex gap-4 overflow-x-auto snap-x pb-2 -mx-1 px-1"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        >
          {products.map((product) => (
            <Link
              key={product.slug}
              href={`/produkt/${product.slug}`}
              className="group shrink-0 snap-start w-[220px] sm:w-[240px] rounded-2xl border border-border bg-white overflow-hidden hover:shadow-lg hover:border-border-strong transition-all duration-200"
            >
              {/* Fotka */}
              <div className="relative aspect-square bg-white">
                <Image
                  src={product.img}
                  alt=""
                  fill
                  sizes="240px"
                  className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              {/* Text */}
              <div className="p-4 pt-3 border-t border-border">
                <p className="text-text-base font-semibold text-sm leading-snug line-clamp-2 min-h-[2.5rem]">
                  {getProductName(product, locale)}
                </p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-text-base font-extrabold text-base">
                    {formatPrice(getPrice(product.price, currency), currency)}
                  </span>
                  <span className={`text-xs font-medium whitespace-nowrap ${product.inStock ? "text-emerald-700" : "text-text-subtle"}`}>
                    {product.inStock ? t("inStock") : t("outStock")}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
