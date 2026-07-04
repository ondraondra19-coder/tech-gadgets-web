"use client";

import { useState, useEffect, useCallback } from "react";
import { useCart } from "@/lib/cart";
import Header from "@/components/Header";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ChevronRight, Tag } from "lucide-react";
import { products, getRelatedProducts } from "@/lib/products";
import { useCurrency } from "@/lib/CurrencyContext";
import { formatPrice, getPrice } from "@/lib/currency";
import type { Currency } from "@/lib/currency";
import DiscountWidget from "@/components/DiscountWidget";

const COLOR_LABELS: Record<string, string> = {
  black: "Černá", white: "Bílá", grey: "Šedá", pink: "Růžová",
  purple: "Fialová", green: "Zelená", darkblue: "Tmavě modrá",
  armygreen: "Army zelená", cerna: "Černá", bila: "Bílá",
  modra: "Modrá", ruzova: "Růžová", zelena: "Zelená",
  cervena: "Červená", zluta: "Žlutá", hneda: "Hnědá",
  bezova: "Béžová", stribrna: "Stříbrná", fialova: "Fialová",
  small: "38–41 mm", large: "42–45 mm",
  gen1: "1. generace", gen2: "2. generace",
  s: "S", m: "M", l: "L", set: "Sada S+M+L",
};

function translateValue(val: string): string {
  return COLOR_LABELS[val] ?? val;
}

function getProductImgs(slug: string, variants?: Record<string, string>): { img: string; img2?: string } | null {
  const product = products.find(p => p.slug === slug);
  if (!product?.models || !variants) return null;
  const modelId = Object.values(variants)[0];
  const model = product.models.find(m => m.label === modelId || m.id === modelId);
  if (!model?.layered) return null;
  const bodyVal = variants["Tělo"];
  const capVal = variants["Hlavička"];
  if (!bodyVal || !capVal) return null;
  const bodyColor = model.colors.find(c => c.value === bodyVal) as any;
  const capColor = model.colors.find(c => c.value === capVal) as any;
  if (bodyColor && capColor) return { img: bodyColor.body, img2: capColor.cap };
  return null;
}

const BESTSELLER_SLUGS = [
  "pouzdro-apple-pencil", "magsafe-penezenka", "paperfeel-ipad",
  "silikonovy-reminek", "pouzdro-airpods", "cistic-displeje",
  "hroty-apple-pencil", "organizer-kabely",
];
const bestsellers = BESTSELLER_SLUGS
  .map(slug => products.find(p => p.slug === slug))
  .filter(Boolean) as typeof products;

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: "Košík", href: "/kosik" },
    { n: 2, label: "Doprava a platba", href: "/objednavka" },
    { n: 3, label: "Informace", href: null },
  ];
  return (
    <div className="flex items-center w-full mb-10">
      {steps.map((s, i) => {
        const done = s.n < step;
        const active = s.n === step;
        return (
          <div key={s.n} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              {done && s.href ? (
                <a href={s.href}>
                  <span className="w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center bg-primary text-white hover:brightness-110 transition-all">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7L5.5 10.5L12 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </a>
              ) : (
                <span className={`w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center ${active ? "bg-primary text-white" : "bg-border text-text-subtle"}`}>
                  {s.n}
                </span>
              )}
              <span className={`text-xs font-medium whitespace-nowrap ${active ? "text-text-base" : done ? "text-text-muted" : "text-text-subtle"}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mx-3 mb-5 transition-colors ${done ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ProductCard({ product, currency }: { product: typeof products[0]; currency: Currency }) {
  return (
    <a
      href={`/produkt/${product.slug}`}
      className="group shrink-0 flex flex-col rounded-2xl overflow-hidden bg-secondary border border-border hover:border-border-strong transition-all duration-200"
      style={{ width: "clamp(200px, 22vw, 280px)" }}
    >
      <div className="relative bg-surface overflow-hidden" style={{ aspectRatio: "1/1" }}>
        <Image src={product.img} alt={product.name} fill className="object-contain p-6 transition-transform duration-300 group-hover:scale-[1.04]" />
      </div>
      <div className="p-4 flex flex-col gap-1.5">
        <p className="text-text-base text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">{product.name}</p>
        <p className="text-primary font-extrabold text-xl mt-1">{formatPrice(getPrice(product.price, currency), currency)}</p>
      </div>
    </a>
  );
}

function ProductRow({ title, subtitle, items, currency }: {
  title: string; subtitle?: string; items: typeof products; currency: Currency;
}) {
  return (
    <div className="mt-12 pb-4">
      <div className="mb-4">
        {subtitle && <p className="text-text-subtle text-xs font-semibold uppercase tracking-widest mb-0.5">{subtitle}</p>}
        <h2 className="text-lg font-extrabold text-text-base">{title}</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
        {items.map(p => <ProductCard key={p.slug} product={p} currency={currency} />)}
      </div>
    </div>
  );
}

export default function KosikPage() {
  const {
    items, removeItem, updateQuantity, totalItems, getItemPrice,
    getTotalPrice, appliedDiscount, getDiscountAmount, getFinalPrice,
  } = useCart();
  const { currency } = useCurrency();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Sklad pro každý produkt v košíku — omezí + tlačítko
  const [stockMap, setStockMap] = useState<Record<string, Record<string, number>>>({});

  const fetchStockForItems = useCallback(async () => {
    const slugs = [...new Set(items.map(i => i.slug))];
    const results: Record<string, Record<string, number>> = {};
    await Promise.all(slugs.map(async (slug) => {
      try {
        const res = await fetch(`/api/stock?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          results[slug] = json.stockData ?? {};
        }
      } catch {}
    }));
    setStockMap(results);
  }, [items]);

  useEffect(() => {
    if (mounted) fetchStockForItems();
  }, [mounted, fetchStockForItems]);

  // Vrátí max dostupné množství pro konkrétní variantu — používá stockKey uložený při addItem
  function getMaxQty(item: (typeof items)[0]): number {
    const slugStock = stockMap[item.slug];
    if (!slugStock || Object.keys(slugStock).length === 0) return 999; // fallback dokud nenačte
    if (item.stockKey && slugStock[item.stockKey] !== undefined) {
      return slugStock[item.stockKey];
    }
    // Fallback pro starší položky bez stockKey — vezmi součet přes všechny varianty
    const vals = Object.values(slugStock);
    return vals.length > 0 ? Math.max(...vals) : 999;
  }

  const isEmpty = items.length === 0;
  const totalPrice = getTotalPrice(currency);
  const discountAmount = getDiscountAmount(currency);
  const finalPrice = getFinalPrice(currency);

  const singleProduct = items.length === 1 ? products.find(p => p.slug === items[0].slug) : null;
  const recommendedProducts = singleProduct ? getRelatedProducts(singleProduct, 6) : bestsellers;
  const recommendedTitle = singleProduct ? "Hodí se k tomu" : "Naše bestsellery";
  const recommendedSubtitle = singleProduct ? `K produktu ${singleProduct.name}` : "Výběr pro vás";

  // Při přechodu na objednávku ověří sklad a ořízne množství na reálné maximum
  async function handleCheckout() {
    // Fetchneme aktuální sklad pro všechny produkty v košíku
    const slugs = [...new Set(items.map(i => i.slug))];
    const freshStock: Record<string, Record<string, number>> = {};
    await Promise.all(slugs.map(async (slug) => {
      try {
        const res = await fetch(`/api/stock?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          freshStock[slug] = json.stockData ?? {};
        }
      } catch {}
    }));

    // Ořízni každou položku na skutečně dostupné množství
    let anyChanged = false;
    for (const item of items) {
      const slugStock = freshStock[item.slug] ?? {};
      let max = 999;
      if (Object.keys(slugStock).length > 0) {
        if (item.stockKey && slugStock[item.stockKey] !== undefined) {
          max = slugStock[item.stockKey];
        } else {
          const vals = Object.values(slugStock);
          max = vals.length > 0 ? Math.max(...vals) : 0;
        }
      }
      if (max === 0) {
        // Vyprodáno — odeber z košíku
        removeItem(item.slug, item.variants);
        anyChanged = true;
      } else if (item.quantity > max) {
        // Více kusů než je na skladě — ořízni
        updateQuantity(item.slug, max, item.variants);
        anyChanged = true;
      }
    }

    // Ať se cokoli změnilo nebo ne, přejdi na objednávku
    window.location.href = "/objednavka";
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-dark">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 py-10">

          <nav className="flex items-center gap-2 text-xs text-text-subtle mb-8">
            <a href="/" className="hover:text-text-muted transition-colors">Domů</a>
            <ChevronRight size={12} className="text-border" />
            <span className="text-text-muted">Košík</span>
          </nav>

          {!mounted ? (
            <div className="flex flex-col gap-4 animate-pulse">
              <div className="h-8 w-64 bg-secondary rounded-xl mb-6" />
              <div className="h-36 bg-secondary rounded-2xl" />
            </div>
          ) : (
            <>
              {!isEmpty && <Stepper step={1} />}

              <h1 className="text-3xl font-extrabold text-text-base mb-8">
                Košík
                {totalItems > 0 && (
                  <span className="ml-3 text-lg font-medium text-text-muted">
                    ({totalItems} {totalItems === 1 ? "položka" : totalItems < 5 ? "položky" : "položek"})
                  </span>
                )}
              </h1>

              {isEmpty ? (
                <>
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-secondary border border-border flex items-center justify-center mb-5">
                      <ShoppingBag size={26} className="text-text-subtle" />
                    </div>
                    <p className="text-text-base font-semibold text-lg">Košík je prázdný</p>
                    <p className="text-text-muted text-sm mt-2">Přidejte produkty a vraťte se sem.</p>
                    <a href="/" className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-dark font-bold text-sm hover:brightness-105 transition-all">
                      Pokračovat v nákupu <ArrowRight size={14} />
                    </a>
                  </div>
                  <ProductRow title={recommendedTitle} subtitle={recommendedSubtitle} items={recommendedProducts} currency={currency} />
                </>
              ) : (
                <>
                  <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Položky */}
                    <div className="flex-1 flex flex-col gap-3">
                      {items.map((item) => {
                        const itemPrice = getItemPrice(item, currency);
                        return (
                          <div key={item.slug + JSON.stringify(item.variants)} className="flex gap-5 p-5 bg-secondary border border-border rounded-2xl">
                            <a href={`/produkt/${item.slug}`} className="shrink-0">
                              {(() => {
                                const layered = getProductImgs(item.slug, item.variants);
                                return (
                                  <div className="relative w-32 h-32 rounded-xl overflow-hidden bg-surface">
                                    <Image src={layered?.img ?? item.img} alt={item.name} fill className="object-contain p-3" />
                                    {layered?.img2 && <Image src={layered.img2} alt="" fill className="object-contain p-3" />}
                                  </div>
                                );
                              })()}
                            </a>
                            <div className="flex-1 min-w-0 py-1">
                              <a href={`/produkt/${item.slug}`}>
                                <p className="text-text-base font-semibold text-base leading-snug hover:text-primary transition-colors">{item.name}</p>
                              </a>
                              {item.variants && Object.entries(item.variants).length > 0 && (
                                <p className="text-text-subtle text-sm mt-1.5">
                                  {Object.entries(item.variants).map(([k, v]) => `${k}: ${translateValue(v)}`).join(" · ")}
                                </p>
                              )}
                              <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
                                <div className="flex items-center gap-1 border border-border rounded-xl overflow-hidden">
                                  <button
                                    onClick={() => updateQuantity(item.slug, item.quantity - 1, item.variants)}
                                    disabled={item.quantity <= 1}
                                    className={`w-9 h-9 flex items-center justify-center transition-colors ${
                                      item.quantity <= 1
                                        ? "text-border cursor-not-allowed"
                                        : "text-text-muted hover:text-text-base hover:bg-border"
                                    }`}
                                  >
                                    <Minus size={14} />
                                  </button>
                                  <span className="w-9 text-center text-text-base text-sm font-medium">{item.quantity}</span>
                                  <button
                                    onClick={() => updateQuantity(item.slug, item.quantity + 1, item.variants)}
                                    disabled={item.quantity >= getMaxQty(item)}
                                    className={`w-9 h-9 flex items-center justify-center transition-colors ${
                                      item.quantity >= getMaxQty(item)
                                        ? "text-border cursor-not-allowed"
                                        : "text-text-muted hover:text-text-base hover:bg-border"
                                    }`}
                                  >
                                    <Plus size={14} />
                                  </button>
                                </div>
                                <div className="flex items-center gap-4">
                                  <p className="text-primary font-extrabold text-xl">{formatPrice(itemPrice * item.quantity, currency)}</p>
                                  <button
                                    onClick={() => removeItem(item.slug, item.variants)}
                                    className="text-text-subtle hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 size={17} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <a href="/" className="inline-flex items-center gap-1.5 text-primary text-sm hover:underline mt-2">
                        ← Pokračovat v nákupu
                      </a>
                    </div>

                    {/* Souhrn */}
                    <div className="w-full lg:w-80 shrink-0 sticky top-24">
                      <div className="bg-secondary border border-border rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-border">
                          <h2 className="text-text-base font-semibold text-base">Souhrn</h2>
                        </div>
                        <div className="px-6 py-5 flex flex-col gap-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-text-muted">Mezisoučet</span>
                            <span className={`font-medium ${appliedDiscount && discountAmount > 0 ? "text-text-subtle line-through" : "text-text-base"}`}>
                              {formatPrice(totalPrice, currency)}
                            </span>
                          </div>
                          {appliedDiscount && discountAmount > 0 && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-green-600 flex items-center gap-1.5">
                                <Tag size={12} />
                                <span className="notranslate" translate="no">{appliedDiscount.code}</span>
                              </span>
                              <span className="text-green-600 font-semibold">− {formatPrice(discountAmount, currency)}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-text-muted">Doprava</span>
                            <span className="text-text-subtle">Zvolíte v dalším kroku</span>
                          </div>
                          <div className="h-px bg-border my-1" />
                          <div className="flex items-center justify-between">
                            <span className="text-text-base font-bold">Celkem bez dopravy</span>
                            <span className="text-primary font-extrabold text-xl">{formatPrice(finalPrice, currency)}</span>
                          </div>
                        </div>

                        <div className="px-6 pb-4">
                          <DiscountWidget />
                        </div>

                        <div className="px-6 pb-6">
                          <button
                            onClick={handleCheckout}
                            className="w-full py-4 rounded-2xl bg-primary text-dark font-bold text-sm hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                          >
                            Pokračovat k dopravě <ArrowRight size={15} />
                          </button>
                          <p className="text-text-subtle text-xs text-center mt-3">Zabezpečená platba · SSL šifrování</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {items.length === 1 && (
                    <ProductRow title={recommendedTitle} subtitle={recommendedSubtitle} items={recommendedProducts} currency={currency} />
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}