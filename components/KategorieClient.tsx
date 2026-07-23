"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SlidersHorizontal, ChevronDown, X, Check, Truck } from "lucide-react";
import type { Product, Category } from "@/lib/products";
import { getProductName, getCategoryName } from "@/lib/products";
import RatingWidget from "./RatingWidget";
import { useCurrency } from "@/lib/CurrencyContext";
import { getPrice } from "@/lib/currency";
import ProductPrice from "./ProductPrice";
import { trackEvent } from "@/lib/analytics";
import { useT } from "@/lib/useT";
import { useLang } from "@/lib/LangContext";
import { LOCALE_TAGS } from "@/lib/locale";

// stockData: { [slug]: number } — předáno ze server componentu kategorie page.tsx

// ── Helpers ──────────────────────────────────────────────────────────────────

// Do kolika kusů křičíme „Poslední kusy!" (sladěno s kartami na homepage).
const LOW_STOCK_THRESHOLD = 10;

// Brandová šrafovaná dlaždice pod fotkou — stejná jako v ProductRow.
const TILE_STYLE: React.CSSProperties = {
  backgroundColor: "#eaf8f4",
  backgroundImage:
    "repeating-linear-gradient(-45deg, rgba(40,191,166,0.07) 0 16px, rgba(40,191,166,0.15) 16px 32px)",
};

function anyInStock(product: Product, stockData: Record<string, number>): boolean {
  const s = stockData[product.slug];
  if (s !== undefined) return s > 0;
  return product.inStock && product.stock > 0; // fallback na katalog
}

function maxStock(product: Product, stockData: Record<string, number>): number {
  const s = stockData[product.slug];
  if (s !== undefined) return s;
  return product.inStock ? product.stock : 0;
}

// (StockPill byl odsud smazán — nikde se nevykresloval, kartu skladem řeší
// značka přímo v gridu níž. Nemělo smysl ho překládat do tří jazyků.)

// ── Price range slider ────────────────────────────────────────────────────────

// Popisky chodí zvenčí jako props — slider sám o překladech nic neví a jde
// použít i jinde než na filtr ceny.
function DualRangeSlider({
  min, max, valueMin, valueMax, onChangeMin, onChangeMax, step = 10,
  labelMin, labelMax,
}: {
  min: number; max: number;
  valueMin: number; valueMax: number;
  onChangeMin: (v: number) => void;
  onChangeMax: (v: number) => void;
  step?: number;
  labelMin: string;
  labelMax: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const range = Math.max(max - min, 1);
  const pctMin = ((valueMin - min) / range) * 100;
  const pctMax = ((valueMax - min) / range) * 100;

  function valueFromClientX(clientX: number): number {
    const rect = trackRef.current!.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.round((min + frac * range) / step) * step;
  }

  // Pointer Capture API: jednou zachycený ukazatel posílá move/up eventy přímo
  // tomuto úchytu bez ohledu na to, co je pod kurzorem nebo jak se mezitím
  // překreslí okolí — na rozdíl od dvou překrytých native <input type="range">
  // (viz komentář u .range-slider v globals.css), tady se tah nikdy nepřeruší.
  function startDrag(onChange: (v: number) => void, clamp: (v: number) => number) {
    return (e: React.PointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      onChange(clamp(valueFromClientX(e.clientX)));
    };
  }

  function handleDrag(onChange: (v: number) => void, clamp: (v: number) => number) {
    return (e: React.PointerEvent<HTMLDivElement>) => {
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
      onChange(clamp(valueFromClientX(e.clientX)));
    };
  }

  const clampMin = (v: number) => Math.min(v, valueMax - step);
  const clampMax = (v: number) => Math.max(v, valueMin + step);

  return (
    <div>
      <div className="flex items-center justify-between mb-3 text-sm font-bold text-text-base">
        <span>{valueMin} Kč</span>
        <span>{valueMax} Kč</span>
      </div>
      <div ref={trackRef} className="relative h-4 flex items-center">
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-border" />
        <div
          className="absolute h-1.5 rounded-full bg-primary"
          style={{ left: `${pctMin}%`, right: `${100 - pctMax}%` }}
        />
        {/* Úchyt: viditelný kroužek zůstává 16px (vnitřní <span>), ale samotný
            div je 32×32 a průhledný — dotykový cíl tak splní 24×24 minimum.
            aria-valuetext říká čtečce "1290 Kč", ne holé číslo. */}
        <div
          role="slider"
          tabIndex={0}
          aria-label={labelMin}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={valueMin}
          aria-valuetext={`${valueMin} Kč`}
          className="absolute top-1/2 w-8 h-8 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
          style={{ left: `${pctMin}%` }}
          onPointerDown={startDrag(onChangeMin, clampMin)}
          onPointerMove={handleDrag(onChangeMin, clampMin)}
          onKeyDown={e => {
            if (e.key === "ArrowRight") onChangeMin(clampMin(valueMin + step));
            if (e.key === "ArrowLeft") onChangeMin(Math.max(valueMin - step, min));
          }}
        >
          <span aria-hidden="true" className="w-4 h-4 rounded-full bg-primary border-2 border-white shadow" />
        </div>
        <div
          role="slider"
          tabIndex={0}
          aria-label={labelMax}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={valueMax}
          aria-valuetext={`${valueMax} Kč`}
          className="absolute top-1/2 w-8 h-8 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
          style={{ left: `${pctMax}%` }}
          onPointerDown={startDrag(onChangeMax, clampMax)}
          onPointerMove={handleDrag(onChangeMax, clampMax)}
          onKeyDown={e => {
            if (e.key === "ArrowLeft") onChangeMax(clampMax(valueMax - step));
            if (e.key === "ArrowRight") onChangeMax(Math.min(valueMax + step, max));
          }}
        >
          <span aria-hidden="true" className="w-4 h-4 rounded-full bg-primary border-2 border-white shadow" />
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function KategorieClient({
  category,
  products,
  stockData = {},
}: {
  category: Category;
  products: Product[];
  stockData?: Record<string, number>;
}) {
  const { currency } = useCurrency();
  const t = useT("category");
  // Sdílené texty produktové karty (odeslání do 24 h, poslední kusy) žijí ve
  // stejném namespace jako karty na homepage, ať se nepřekládají dvakrát.
  const tp = useT("productrow");
  const { locale } = useLang();
  const categoryName = getCategoryName(category, locale);

  const sortOptions = [
    { label: t("sortDefault"),   value: "default"    },
    { label: t("sortPriceAsc"),  value: "price-asc"  },
    { label: t("sortPriceDesc"), value: "price-desc" },
    { label: t("sortNameAsc"),   value: "name-asc"   },
  ];

  // Filtry vždy počítáme v CZK
  const allPrices = products.map(p => typeof p.price === "number" ? p.price : p.price.CZK ?? 0);
  const PRICE_MIN = allPrices.length ? Math.min(...allPrices) : 0;
  const PRICE_MAX = allPrices.length ? Math.max(...allPrices) : 1000;

  const [priceMin,         setPriceMin]         = useState(Math.floor(PRICE_MIN / 10) * 10);
  const [priceMax,         setPriceMax]         = useState(Math.ceil(PRICE_MAX / 10) * 10);
  const [onlyInStock,      setOnlyInStock]      = useState(false);
  const [sort,             setSort]             = useState("default");
  const [sortOpen,         setSortOpen]         = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [priceOpen,        setPriceOpen]        = useState(false);
  const [availOpen,        setAvailOpen]        = useState(false);

  const getCZK = (p: Product) => typeof p.price === "number" ? p.price : p.price.CZK ?? 0;

  let filtered = products.filter(p => {
    const czk = getCZK(p);
    const inPrice = czk >= priceMin && czk <= priceMax;
    const inStockOk = onlyInStock ? anyInStock(p, stockData) : true;
    return inPrice && inStockOk;
  });

  if (sort === "price-asc")  filtered = [...filtered].sort((a, b) => getCZK(a) - getCZK(b));
  if (sort === "price-desc") filtered = [...filtered].sort((a, b) => getCZK(b) - getCZK(a));
  // Řadí se podle názvu ve zvoleném jazyce a jeho pravidly — "Č" patří v češtině
  // až za "C", ne mezi latinku, a v angličtině by se řadil jiný název.
  if (sort === "name-asc") {
    filtered = [...filtered].sort((a, b) =>
      getProductName(a, locale).localeCompare(getProductName(b, locale), LOCALE_TAGS[locale]),
    );
  }

  const activeFilters = priceMin > PRICE_MIN || priceMax < PRICE_MAX || onlyInStock;
  const currentSort   = sortOptions.find(s => s.value === sort)!;

  function resetFilters() {
    setPriceMin(Math.floor(PRICE_MIN / 10) * 10);
    setPriceMax(Math.ceil(PRICE_MAX / 10) * 10);
    setOnlyInStock(false);
  }

  function FilterContent() {
    return (
      <div className="flex flex-col divide-y divide-border">
        {/* Cena */}
        <div>
          <button
            onClick={() => setPriceOpen(v => !v)}
            aria-expanded={priceOpen}
            className="w-full flex items-center justify-between px-5 py-4 min-h-11 text-sm font-semibold text-text-base hover:text-primary-ink transition-colors"
          >
            {t("price")}
            <ChevronDown size={14} aria-hidden="true" className={`transition-transform duration-200 ${priceOpen ? "rotate-180" : ""}`} />
          </button>
          {priceOpen && (
            <div className="px-5 pb-5">
              <DualRangeSlider
                min={PRICE_MIN} max={PRICE_MAX}
                valueMin={priceMin} valueMax={priceMax}
                onChangeMin={setPriceMin} onChangeMax={setPriceMax}
                labelMin={t("priceMin")} labelMax={t("priceMax")}
              />
            </div>
          )}
        </div>

        {/* Dostupnost */}
        <div>
          <button
            onClick={() => setAvailOpen(v => !v)}
            aria-expanded={availOpen}
            className="w-full flex items-center justify-between px-5 py-4 min-h-11 text-sm font-semibold text-text-base hover:text-primary-ink transition-colors"
          >
            {t("availability")}
            <ChevronDown size={14} aria-hidden="true" className={`transition-transform duration-200 ${availOpen ? "rotate-180" : ""}`} />
          </button>
          {availOpen && (
            <div className="px-5 pb-5">
              {/* Zaškrtávátko je kreslené divem — bez role/aria-checked ho čtečka
                  ohlásí jen jako tlačítko a stav vůbec nesdělí. */}
              <button
                onClick={() => setOnlyInStock(v => !v)}
                role="checkbox"
                aria-checked={onlyInStock}
                className="flex items-center gap-3 text-sm text-text-muted hover:text-text-base transition-colors w-full min-h-11"
              >
                <span aria-hidden="true" className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-150 shrink-0 ${
                  onlyInStock ? "bg-primary border-primary" : "border-border-strong"
                }`}>
                  {onlyInStock && <Check size={11} strokeWidth={3} className="text-on-primary" />}
                </span>
                {t("onlyInStock")}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12 py-6 lg:py-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-text-subtle mb-5 lg:mb-8">
          <Link href="/" className="hover:text-text-muted transition-colors">{t("home")}</Link>
          <span aria-hidden="true" className="text-border">/</span>
          <span className="text-text-muted">{categoryName}</span>
        </nav>

        {/* Page header */}
        <div className="flex items-end justify-between mb-6 lg:mb-10 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-text-base tracking-tight">{categoryName}</h1>
            <p className="text-text-subtle text-sm mt-1.5">
              {t.plural(filtered.length, "productCount")}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mobile filter button */}
            {/* Popisek je pod sm: schovaný → aria-label drží název i tam.
                Tečka aktivních filtrů je jen vizuální signál, proto se stav
                říká slovy v aria-labelu. */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              aria-label={activeFilters ? t("filterActive") : t("filter")}
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 min-h-11 rounded-xl bg-white border border-border text-text-muted text-sm hover:text-text-base transition-colors shadow-sm"
            >
              <SlidersHorizontal size={14} aria-hidden="true" />
              <span className="hidden sm:inline">{t("filter")}</span>
              {activeFilters && <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-primary" />}
            </button>

            {/* Sort */}
            <div className="relative">
              <button
                onClick={() => setSortOpen(v => !v)}
                aria-label={t("sortLabel", { current: currentSort.label })}
                aria-expanded={sortOpen}
                aria-haspopup="menu"
                className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 min-h-11 rounded-xl bg-white border border-border text-text-muted text-sm hover:text-text-base transition-colors shadow-sm"
              >
                <span className="hidden sm:inline">{currentSort.label}</span>
                <span className="sm:hidden">{t("sort")}</span>
                <ChevronDown size={13} aria-hidden="true" className={`transition-transform duration-200 ${sortOpen ? "rotate-180" : ""}`} />
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-border rounded-xl py-1.5 z-30 min-w-[180px] shadow-lg">
                  {sortOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setSort(opt.value); setSortOpen(false); }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                        sort === opt.value ? "text-primary-ink" : "text-text-muted hover:text-text-base"
                      }`}
                    >
                      {opt.label}
                      {sort === opt.value && <Check size={13} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Layout */}
        <div className="flex gap-6 lg:gap-8 items-start">

          {/* ── Sidebar desktop ── */}
          <aside className="hidden lg:flex flex-col gap-5 w-60 xl:w-64 shrink-0 sticky top-6 self-start">
            <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={14} className="text-primary-ink" />
                  <span className="text-text-base font-semibold text-sm">{t("filter")}</span>
                </div>
                {activeFilters && (
                  <button onClick={resetFilters} className="text-text-subtle hover:text-primary-ink text-xs transition-colors">
                    {t("resetAll")}
                  </button>
                )}
              </div>
              {FilterContent()}
            </div>
            <RatingWidget />
          </aside>

          {/* ── Product grid ── */}
          <div className="flex-1 min-w-0">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white border border-border flex items-center justify-center mb-4 shadow-sm">
                  <SlidersHorizontal size={22} className="text-text-subtle" />
                </div>
                <p className="text-text-base font-semibold">{t("noProducts")}</p>
                <p className="text-text-muted text-sm mt-1">{t("noProductsDesc")}</p>
                <button
                  onClick={resetFilters}
                  className="mt-5 px-5 py-2.5 rounded-full bg-primary text-on-primary font-semibold text-sm hover:brightness-105 transition-all"
                >
                  {t("resetFilters")}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filtered.map(product => {
                  const inStock = anyInStock(product, stockData);
                  const best    = maxStock(product, stockData);

                  const stockLabel = !inStock
                    ? { dot: "bg-red-400",                 text: t("stockNone"), cls: "text-red-500"   }
                    : best < 5
                    ? { dot: "bg-amber-400 animate-pulse", text: t("stockLow"),  cls: "text-amber-500" }
                    : { dot: "bg-green-500",               text: t("stockOk"),   cls: "text-green-600" };

                  return (
                    <a
                      key={product.slug}
                      href={`/produkt/${product.slug}`}
                      onClick={() => trackEvent("product_clicked", {
                        slug: product.slug,
                        name: product.name,
                        price: getPrice(product.price, currency),
                        currency: currency.code,
                      })}
                      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      {/* Obrázek na brandové dlaždici */}
                      <div className="relative aspect-square overflow-hidden" style={TILE_STYLE}>
                        <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between p-2.5 pointer-events-none">
                          {product.discountPercent ? (
                            <span className="text-[11px] leading-none text-white bg-rose-600 rounded-lg px-2 py-1 shadow-sm">
                              {tp("sale")} <b className="font-extrabold">−{product.discountPercent}&nbsp;%</b>
                            </span>
                          ) : (
                            <span />
                          )}
                          {inStock && best > 0 && best <= LOW_STOCK_THRESHOLD && (
                            <span className="text-[11px] font-bold leading-none text-white bg-header rounded-lg px-2 py-1 shadow-sm">
                              {tp("lastPieces")}
                            </span>
                          )}
                        </div>
                        <Image
                          src={product.img}
                          alt=""
                          fill
                          className="object-contain p-5 sm:p-6 transition-transform duration-500 group-hover:scale-[1.04]"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex flex-col p-3 sm:p-4 gap-2 border-t border-border">
                        {/* Název */}
                        <p className="text-text-base text-sm font-semibold leading-snug line-clamp-2 min-h-[2.5rem]">
                          {getProductName(product, locale)}
                        </p>

                        {/* Cena + stock */}
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <ProductPrice
                            product={product}
                            badge={false}
                            priceClassName="text-primary-ink font-extrabold text-2xl leading-none"
                          />
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${stockLabel.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${stockLabel.dot}`} />
                            <span>{stockLabel.text}</span>
                          </span>
                        </div>

                        {/* Odeslání do 24 hodin */}
                        {inStock && (
                          <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                            <Truck size={14} aria-hidden="true" />
                            {tp("ship24")}
                          </p>
                        )}

                        {/* Tlačítko Detail */}
                        <div className="mt-1 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold transition-all duration-150 group-hover:brightness-105">
                          <span>{t("detail")}</span>
                          <ChevronDown size={14} aria-hidden="true" className="-rotate-90" />
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile filter drawer ── */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-border rounded-t-2xl p-5 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={15} className="text-primary-ink" />
                <span className="text-text-base font-semibold">{t("filter")}</span>
              </div>
              <button
                onClick={() => setMobileFilterOpen(false)}
                aria-label={t("closeFilters")}
                className="w-11 h-11 -mr-2 flex items-center justify-center rounded-full text-text-muted hover:text-text-base hover:bg-surface transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="rounded-2xl border border-border overflow-hidden bg-surface">
              {FilterContent()}
            </div>
            {activeFilters && (
              <button
                onClick={resetFilters}
                className="mt-3 w-full py-2.5 rounded-xl border border-border text-text-muted text-sm hover:text-text-base transition-colors"
              >
                {t("resetAllFilters")}
              </button>
            )}
            <button
              onClick={() => setMobileFilterOpen(false)}
              className="mt-3 w-full px-5 py-3 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:brightness-105 transition-all"
            >
              {t("showResults", { count: filtered.length })}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}