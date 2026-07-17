"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import type { Product } from "@/lib/products";
import { categories, getCategoryName, getProductName } from "@/lib/products";
import { useCurrency } from "@/lib/CurrencyContext";
import { formatPrice, getPrice } from "@/lib/currency";
import { useT } from "@/lib/useT";
import { useLang } from "@/lib/LangContext";

const FEATURED_SLUGS = [
  "pouzdro-apple-pencil",
  "magsafe-penezenka",
  "magneticka-paperlike-folie-ipad",
  "silikonovy-reminek-apple-watch",
  "pouzdro-airpods",
  "hroty-apple-pencil",
  "pouzdro-airtag-klicenka",
  "cistic-displeje",
];

const GAP = 16;

function getVisibleCount(): number {
  if (typeof window === "undefined") return 4;
  if (window.innerWidth < 640)  return 1;
  if (window.innerWidth < 1024) return 2;
  if (window.innerWidth < 1280) return 3;
  return 4;
}

// `products` přichází jako prop z app/page.tsx (server komponenta), která už
// aplikovala případné přepisy cen z admina — tady se nic dalšího nedopočítává.
export default function FeaturedProducts({ products }: { products: Product[] }) {
  const featured = FEATURED_SLUGS
    .map(slug => products.find(p => p.slug === slug))
    .filter(Boolean) as Product[];

  const trackRef       = useRef<HTMLDivElement>(null);
  const { currency }   = useCurrency();
  const t              = useT("featured");
  const { locale }     = useLang();
  const [index,        setIndex]        = useState(0);
  const [visibleCount, setVisibleCount] = useState(4);
  const [itemWidth,    setItemWidth]    = useState(0);
  const isProgrammatic = useRef(false);
  const snapTimer      = useRef<number | null>(null);

  const maxIndex = Math.max(0, featured.length - visibleCount);

  // Změř šířku jednoho itemu pomocí ResizeObserver
  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const vc = getVisibleCount();
    setVisibleCount(vc);
    setItemWidth((el.offsetWidth - GAP * (vc - 1)) / vc);
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    return () => ro.disconnect();
  }, [measure]);

  // Programatický scroll na index
  const scrollToIndex = useCallback((i: number) => {
    const el = trackRef.current;
    if (!el || itemWidth === 0) return;
    isProgrammatic.current = true;
    el.scrollTo({ left: i * (itemWidth + GAP), behavior: "smooth" });
    if (snapTimer.current !== null) window.clearTimeout(snapTimer.current);
    snapTimer.current = window.setTimeout(() => {
      isProgrammatic.current = false;
      snapTimer.current = null;
    }, 600);
  }, [itemWidth]);

  useEffect(() => {
    scrollToIndex(index);
  }, [index, scrollToIndex]);

  // Snap při manuálním scrollu — 80ms po posledním eventu prichytí na nejbližší
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout>;

    function onScroll() {
      if (isProgrammatic.current) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!el || itemWidth === 0) return;
        const nearest = Math.round(el.scrollLeft / (itemWidth + GAP));
        const clamped = Math.min(Math.max(nearest, 0), maxIndex);
        isProgrammatic.current = true;
        el.scrollTo({ left: clamped * (itemWidth + GAP), behavior: "smooth" });
        setTimeout(() => { isProgrammatic.current = false; }, 600);
        setIndex(clamped);
      }, 80);
    }

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
    };
  }, [itemWidth, maxIndex]);

  function goTo(i: number) {
    setIndex(Math.min(Math.max(i, 0), maxIndex));
  }

  return (
    <section className="py-16 overflow-hidden">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">

        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-text-subtle text-[11px] font-bold uppercase tracking-[0.18em] mb-2">
              {t("eyebrow")}
            </p>
            <h2 className="text-3xl font-extrabold text-text-base tracking-tight leading-none">
              {t("title")}
            </h2>
          </div>

          {/* Šipky — desktop */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
              aria-label={t("prev")}
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-opacity duration-200 ${
                index === 0
                  ? "border-border text-border cursor-default opacity-40"
                  : "border-border-strong text-text-muted"
              }`}
            >
              <ChevronLeft size={17} />
            </button>
            <button
              onClick={() => goTo(index + 1)}
              disabled={index >= maxIndex}
              aria-label={t("next")}
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-opacity duration-200 ${
                index >= maxIndex
                  ? "border-border text-border cursor-default opacity-40"
                  : "border-border-strong text-text-muted"
              }`}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>

        {/* Track */}
        <div
          ref={trackRef}
          className="flex gap-4 overflow-x-auto"
          style={{
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
          } as React.CSSProperties}
        >
          {featured.map((product, i) => (
            <a
              key={product.slug}
              href={`/produkt/${product.slug}`}
              className="group relative shrink-0 rounded-3xl overflow-hidden bg-surface cursor-pointer"
              style={{
                width: itemWidth > 0
                  ? `${itemWidth}px`
                  : `calc(${100 / visibleCount}% - ${GAP * (visibleCount - 1) / visibleCount}px)`,
                aspectRatio: "3/4",
              }}
            >
              {/* Fotka */}
              <Image
                src={product.img}
                alt=""
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />

              {/* Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

              {/* Content dole */}
              <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Dřív se tu sázel slug s pomlčkami nahrazenými mezerami
                      ("pouzdra obaly"). Katalog má pro kategorie skutečné názvy
                      včetně překladů, tak ať se použijí. */}
                  <p className="text-white/50 text-[10px] font-semibold uppercase tracking-[0.15em] mb-1.5 line-clamp-1">
                    {(() => {
                      const category = categories.find(c => c.slug === product.categories[0]);
                      return category ? getCategoryName(category, locale) : product.categories[0];
                    })()}
                  </p>
                  <p className="text-white font-bold text-base leading-snug line-clamp-2 mb-2.5">
                    {getProductName(product, locale)}
                  </p>
                  <p className="text-primary-ink font-extrabold text-xl leading-none">
                    {formatPrice(getPrice(product.price as any, currency), currency)}
                  </p>
                </div>

                {/* Šipka — slide in při hoveru */}
                <div className="shrink-0 w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-out">
                  <ArrowUpRight size={15} className="text-white" />
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Dots — 44×44 dotykový cíl, viditelnou tečku kreslí vnitřní <span>.
            Neaktivní tečka: bg-border-strong mělo vůči bílé 1.47:1, což je pod
            3:1 pro UI prvek — text-subtle dává 5.36:1. */}
        {maxIndex > 0 && (
          <div className="flex items-center justify-center mt-5" role="tablist" aria-label={t("pagination")}>
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                role="tab"
                aria-selected={i === index}
                aria-label={t("showGroup", { n: i + 1, total: maxIndex + 1 })}
                className="w-11 h-11 flex items-center justify-center group"
              >
                <span
                  aria-hidden="true"
                  className={`rounded-full transition-all duration-300 ${
                    i === index
                      ? "w-7 h-1.5 bg-primary"
                      : "w-1.5 h-1.5 bg-text-subtle group-hover:bg-text-muted"
                  }`}
                />
              </button>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}