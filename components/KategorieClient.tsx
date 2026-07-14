"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { SlidersHorizontal, ChevronDown, X, Check } from "lucide-react";
import type { Product } from "@/lib/products";
import RatingWidget from "./RatingWidget";
import { useCurrency } from "@/lib/CurrencyContext";
import { formatPrice, getPrice } from "@/lib/currency";

type Category = { slug: string; name: string };

// stockData: { [slug]: Record<"color|size", number> }
// předáno ze server componentu kategorie page.tsx

const sortOptions = [
  { label: "Doporučené",     value: "default"    },
  { label: "Cena: nejnižší", value: "price-asc"  },
  { label: "Cena: nejvyšší", value: "price-desc" },
  { label: "Název A–Z",      value: "name-asc"   },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function anyInStock(product: Product, stockData: Record<string, Record<string, number>>): boolean {
  const sd = stockData[product.slug];
  // Pokud máme Sheets data pro tento produkt
  if (sd && Object.keys(sd).length > 0) {
    return Object.values(sd).some(v => v > 0);
  }
  // Fallback na products.ts
  return product.inStock && product.stock > 0;
}

function maxStock(product: Product, stockData: Record<string, Record<string, number>>): number {
  const sd = stockData[product.slug];
  if (sd && Object.keys(sd).length > 0) {
    return Math.max(...Object.values(sd));
  }
  return product.inStock ? product.stock : 0;
}

// ── Stock pill pro product kartu ─────────────────────────────────────────────

function StockPill({ product, stockData }: { product: Product; stockData: Record<string, Record<string, number>> }) {
  const inStock = anyInStock(product, stockData);

  if (!inStock) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
        <span>Není skladem</span>
      </span>
    );
  }

  const best = maxStock(product, stockData);

  if (best >= 5) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
        <span>Skladem</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
      <span>Poslední kusy</span>
    </span>
  );
}

// ── Price range slider ────────────────────────────────────────────────────────

function DualRangeSlider({
  min, max, valueMin, valueMax, onChangeMin, onChangeMax, step = 10,
}: {
  min: number; max: number;
  valueMin: number; valueMax: number;
  onChangeMin: (v: number) => void;
  onChangeMax: (v: number) => void;
  step?: number;
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
        <div
          role="slider"
          tabIndex={0}
          aria-label="Minimální cena"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={valueMin}
          className="absolute top-1/2 w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary border-2 border-white shadow cursor-grab active:cursor-grabbing touch-none"
          style={{ left: `${pctMin}%` }}
          onPointerDown={startDrag(onChangeMin, clampMin)}
          onPointerMove={handleDrag(onChangeMin, clampMin)}
          onKeyDown={e => {
            if (e.key === "ArrowRight") onChangeMin(clampMin(valueMin + step));
            if (e.key === "ArrowLeft") onChangeMin(Math.max(valueMin - step, min));
          }}
        />
        <div
          role="slider"
          tabIndex={0}
          aria-label="Maximální cena"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={valueMax}
          className="absolute top-1/2 w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary border-2 border-white shadow cursor-grab active:cursor-grabbing touch-none"
          style={{ left: `${pctMax}%` }}
          onPointerDown={startDrag(onChangeMax, clampMax)}
          onPointerMove={handleDrag(onChangeMax, clampMax)}
          onKeyDown={e => {
            if (e.key === "ArrowLeft") onChangeMax(clampMax(valueMax - step));
            if (e.key === "ArrowRight") onChangeMax(Math.min(valueMax + step, max));
          }}
        />
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
  stockData?: Record<string, Record<string, number>>;
}) {
  const { currency } = useCurrency();

  // Filtry vždy počítáme v CZK
  const allPrices = products.map(p => typeof p.price === "number" ? p.price : (p.price as any).CZK ?? 0);
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

  const getCZK = (p: Product) => typeof p.price === "number" ? p.price : (p.price as any).CZK ?? 0;

  let filtered = products.filter(p => {
    const czk = getCZK(p);
    const inPrice = czk >= priceMin && czk <= priceMax;
    const inStockOk = onlyInStock ? anyInStock(p, stockData) : true;
    return inPrice && inStockOk;
  });

  if (sort === "price-asc")  filtered = [...filtered].sort((a, b) => getCZK(a) - getCZK(b));
  if (sort === "price-desc") filtered = [...filtered].sort((a, b) => getCZK(b) - getCZK(a));
  if (sort === "name-asc")   filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));

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
            className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-text-base hover:text-primary transition-colors"
          >
            Cena
            <ChevronDown size={14} className={`transition-transform duration-200 ${priceOpen ? "rotate-180" : ""}`} />
          </button>
          {priceOpen && (
            <div className="px-5 pb-5">
              <DualRangeSlider
                min={PRICE_MIN} max={PRICE_MAX}
                valueMin={priceMin} valueMax={priceMax}
                onChangeMin={setPriceMin} onChangeMax={setPriceMax}
              />
            </div>
          )}
        </div>

        {/* Dostupnost */}
        <div>
          <button
            onClick={() => setAvailOpen(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-text-base hover:text-primary transition-colors"
          >
            Dostupnost
            <ChevronDown size={14} className={`transition-transform duration-200 ${availOpen ? "rotate-180" : ""}`} />
          </button>
          {availOpen && (
            <div className="px-5 pb-5">
              <button
                onClick={() => setOnlyInStock(v => !v)}
                className="flex items-center gap-3 text-sm text-text-muted hover:text-text-base transition-colors w-full"
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-150 shrink-0 ${
                  onlyInStock ? "bg-primary border-primary" : "border-border-strong"
                }`}>
                  {onlyInStock && <Check size={11} strokeWidth={3} className="text-dark" />}
                </div>
                Pouze skladem
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
          <a href="/" className="hover:text-text-muted transition-colors">Domů</a>
          <span className="text-border">/</span>
          <span className="text-text-muted">{category.name}</span>
        </nav>

        {/* Page header */}
        <div className="flex items-end justify-between mb-6 lg:mb-10 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-text-base tracking-tight">{category.name}</h1>
            <p className="text-text-subtle text-sm mt-1.5">
              {filtered.length} {filtered.length === 1 ? "produkt" : filtered.length < 5 ? "produkty" : "produktů"}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mobile filter button */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white border border-border text-text-muted text-sm hover:text-text-base transition-colors shadow-sm"
            >
              <SlidersHorizontal size={14} />
              <span className="hidden sm:inline">Filtrovat</span>
              {activeFilters && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
            </button>

            {/* Sort */}
            <div className="relative">
              <button
                onClick={() => setSortOpen(v => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white border border-border text-text-muted text-sm hover:text-text-base transition-colors shadow-sm"
              >
                <span className="hidden sm:inline">{currentSort.label}</span>
                <span className="sm:hidden">Řadit</span>
                <ChevronDown size={13} className={`transition-transform duration-200 ${sortOpen ? "rotate-180" : ""}`} />
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-border rounded-xl py-1.5 z-30 min-w-[180px] shadow-lg">
                  {sortOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setSort(opt.value); setSortOpen(false); }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                        sort === opt.value ? "text-primary" : "text-text-muted hover:text-text-base"
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
                  <SlidersHorizontal size={14} className="text-primary" />
                  <span className="text-text-base font-semibold text-sm">Filtrovat</span>
                </div>
                {activeFilters && (
                  <button onClick={resetFilters} className="text-text-subtle hover:text-primary text-xs transition-colors">
                    Zrušit vše
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
                <p className="text-text-base font-semibold">Žádné produkty</p>
                <p className="text-text-muted text-sm mt-1">Zkus změnit nebo zrušit filtry.</p>
                <button
                  onClick={resetFilters}
                  className="mt-5 px-5 py-2.5 rounded-full bg-primary text-dark font-semibold text-sm hover:brightness-105 transition-all"
                >
                  Zrušit filtry
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filtered.map(product => {
                  const inStock = anyInStock(product, stockData);
                  const best    = maxStock(product, stockData);

                  const stockLabel = !inStock
                    ? { dot: "bg-red-400",             text: "Není skladem",  cls: "text-red-500"   }
                    : best < 5
                    ? { dot: "bg-amber-400 animate-pulse", text: "Poslední kusy", cls: "text-amber-500" }
                    : { dot: "bg-green-500",            text: "Skladem",       cls: "text-green-600" };

                  return (
                    <a
                      key={product.slug}
                      href={`/produkt/${product.slug}`}
                      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      {/* Obrázek */}
                      <div className="relative aspect-square bg-[#f5f5f5] overflow-hidden">
                        <Image
                          src={product.img}
                          alt={product.name}
                          fill
                          className="object-contain p-5 sm:p-6 transition-transform duration-500 group-hover:scale-[1.04]"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex flex-col p-3 sm:p-4 gap-2 border-t border-border">
                        {/* Název */}
                        <p className="text-text-base text-sm font-semibold leading-snug line-clamp-2 min-h-[2.5rem]">
                          {product.name}
                        </p>

                        {/* Cena + stock */}
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className="text-primary font-extrabold text-2xl leading-none">
                            {formatPrice(getPrice(product.price as any, currency), currency)}
                          </p>
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${stockLabel.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${stockLabel.dot}`} />
                            <span>{stockLabel.text}</span>
                          </span>
                        </div>

                        {/* Tlačítko Detail */}
                        <div className="mt-1 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-dark text-sm font-bold transition-all duration-150 group-hover:brightness-105">
                          <span>Detail</span>
                          <ChevronDown size={14} className="-rotate-90" />
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
                <SlidersHorizontal size={15} className="text-primary" />
                <span className="text-text-base font-semibold">Filtrovat</span>
              </div>
              <button onClick={() => setMobileFilterOpen(false)} className="text-text-muted hover:text-text-base transition-colors">
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
                Zrušit všechny filtry
              </button>
            )}
            <button
              onClick={() => setMobileFilterOpen(false)}
              className="mt-3 w-full px-5 py-3 rounded-xl bg-primary text-dark font-semibold text-sm hover:brightness-105 transition-all"
            >
              Zobrazit výsledky ({filtered.length})
            </button>
          </div>
        </div>
      )}
    </main>
  );
}