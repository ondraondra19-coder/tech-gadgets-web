"use client";

import { useState, useEffect, useCallback } from "react";
import { useCart } from "@/lib/cart";
import Header from "@/components/Header";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ChevronRight, Tag } from "lucide-react";
import { products as staticProducts, getProductName } from "@/lib/products";
import { useLang } from "@/lib/LangContext";
import { useCurrency } from "@/lib/CurrencyContext";
import { formatPrice, getPrice } from "@/lib/currency";
import type { Currency } from "@/lib/currency";
import DiscountWidget from "@/components/DiscountWidget";
import CheckoutStepper from "@/components/CheckoutStepper";
import { useT } from "@/lib/useT";
import { variantLabel, variantAttr } from "@/lib/variantLabels";

function getProductImgs(slug: string, variants?: Record<string, string>): { img: string; img2?: string } | null {
  const product = staticProducts.find(p => p.slug === slug);
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


function ProductCard({ product, currency }: { product: typeof staticProducts[0]; currency: Currency }) {
  const { locale } = useLang();
  return (
    <a
      href={`/produkt/${product.slug}`}
      className="group shrink-0 flex flex-col rounded-2xl overflow-hidden bg-secondary border border-border hover:border-border-strong transition-all duration-200"
      style={{ width: "clamp(200px, 22vw, 280px)" }}
    >
      <div className="relative bg-surface overflow-hidden" style={{ aspectRatio: "1/1" }}>
        <Image src={product.img} alt="" fill sizes="(max-width: 640px) 50vw, 25vw" className="object-contain p-6 transition-transform duration-300 group-hover:scale-[1.04]" />
      </div>
      <div className="p-4 flex flex-col gap-1.5">
        <p className="text-text-base text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary-ink transition-colors">{getProductName(product, locale)}</p>
        <p className="text-primary-ink font-extrabold text-xl mt-1">{formatPrice(getPrice(product.price, currency), currency)}</p>
      </div>
    </a>
  );
}

function ProductRow({ title, subtitle, items, currency }: {
  title: string; subtitle?: string; items: typeof staticProducts; currency: Currency;
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
  const t = useT("cart");
  const tv = useT("variants");
  const tc = useT("common");
  const { locale } = useLang();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Ceny doporučených produktů (bestsellery / "hodí se k tomu") mají být
  // aktuální — stejný fallback vzor jako v SearchBar: hned funguje se
  // statickým katalogem, na pozadí se tiše přepne na ceny z /api/products.
  const [products, setProducts] = useState(staticProducts);
  useEffect(() => {
    fetch("/api/products")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data?.products) setProducts(data.products); })
      .catch(() => {});
  }, []);

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



  // Vrátí max dostupné množství pro konkrétní variantu — používá stockKey uložený při addItem.
  // Pokud stejný podzdroj (např. "šedé tělo") používá i jiná položka v košíku, odečte se
  // jí už rezervované množství, ať se dvě varianty nepřebijí přes společný sklad.
  // Strop 50 ks/položku musí odpovídat MAX_ITEM_QUANTITY na serveru
  // (app/api/orders/route.ts, app/api/checkout/route.ts) — jinak zákazník
  // dojde až na poslední krok checkoutu a tam dostane nejasnou chybu.
  const MAX_ITEM_QUANTITY = 50;

  function getMaxQty(item: (typeof items)[0]): number {
    const slugStock = stockMap[item.slug];
    if (!slugStock || Object.keys(slugStock).length === 0) return MAX_ITEM_QUANTITY; // fallback dokud nenačte / bez sledování skladu

    if (item.stockKey) {
      const keys = Array.isArray(item.stockKey) ? item.stockKey : [item.stockKey];
      let minRemaining: number | undefined;

      for (const key of keys) {
        const totalStock = slugStock[key];
        if (totalStock === undefined) continue;

        const reservedByOthers = items.reduce((sum, other) => {
          if (other === item || other.slug !== item.slug || !other.stockKey) return sum;
          const otherKeys = Array.isArray(other.stockKey) ? other.stockKey : [other.stockKey];
          return otherKeys.includes(key) ? sum + other.quantity : sum;
        }, 0);

        const remaining = totalStock - reservedByOthers;
        minRemaining = minRemaining === undefined ? remaining : Math.min(minRemaining, remaining);
      }

      if (minRemaining !== undefined) return Math.min(MAX_ITEM_QUANTITY, Math.max(0, minRemaining));
    }

    // Fallback pro starší položky bez stockKey — vezmi součet přes všechny varianty
    const vals = Object.values(slugStock);
    return vals.length > 0 ? Math.min(MAX_ITEM_QUANTITY, Math.max(...vals)) : MAX_ITEM_QUANTITY;
  }

  const isEmpty = items.length === 0;
  const totalPrice = getTotalPrice(currency);
  const discountAmount = getDiscountAmount(currency);
  const finalPrice = getFinalPrice(currency);

  const bestsellers = BESTSELLER_SLUGS
    .map(slug => products.find(p => p.slug === slug))
    .filter(Boolean) as typeof products;

  const singleProduct = items.length === 1 ? products.find(p => p.slug === items[0].slug) : null;

  // Stejná logika jako lib/products.ts getRelatedProducts, ale nad `products`
  // (živá data s aktuálními cenami), ne nad staticky importovaným katalogem.
  const recommendedProducts = singleProduct
    ? (singleProduct.related && singleProduct.related.length > 0
        ? singleProduct.related.map(slug => products.find(p => p.slug === slug)).filter(Boolean).slice(0, 6)
        : products.filter(p => p.slug !== singleProduct.slug && p.categories.some(c => singleProduct.categories.includes(c))).slice(0, 6)
      ) as typeof products
    : bestsellers;
  const recommendedTitle = singleProduct ? t("relatedTitle") : t("bestsellers");
  const recommendedSubtitle = singleProduct
    ? t("relatedSubtitle", { name: getProductName(singleProduct, locale) })
    : t("bestsellersSubtitle");

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

    // Ořízni každou položku na skutečně dostupné množství. Položky se stejným
    // podzdrojem (např. dvě varianty používající "šedé tělo") si sklad reálně
    // dělí — zpracujeme je v pořadí v košíku a odečítáme z jednoho společného
    // "poolu" na (slug, klíč), ať se nestane, že si dvě položky navzájem
    // odsouhlasí víc kusů, než kolik jich reálně na skladě je.
    const remainingBySlugKey: Record<string, number> = {};
    let anyChanged = false;

    for (const item of items) {
      const slugStock = freshStock[item.slug] ?? {};
      let max = MAX_ITEM_QUANTITY;

      if (Object.keys(slugStock).length > 0) {
        const keys = item.stockKey
          ? (Array.isArray(item.stockKey) ? item.stockKey : [item.stockKey])
          : null;

        if (keys) {
          let minRemaining: number | undefined;
          for (const key of keys) {
            const poolKey = `${item.slug}::${key}`;
            if (!(poolKey in remainingBySlugKey)) {
              remainingBySlugKey[poolKey] = slugStock[key] ?? 0;
            }
            const remaining = remainingBySlugKey[poolKey];
            minRemaining = minRemaining === undefined ? remaining : Math.min(minRemaining, remaining);
          }
          max = Math.min(MAX_ITEM_QUANTITY, minRemaining ?? MAX_ITEM_QUANTITY);
        } else {
          const vals = Object.values(slugStock);
          max = vals.length > 0 ? Math.min(MAX_ITEM_QUANTITY, Math.max(...vals)) : 0;
        }
      }

      if (max <= 0) {
        // Vyprodáno — odeber z košíku
        removeItem(item.slug, item.variants);
        anyChanged = true;
        continue;
      }

      const finalQty = Math.min(item.quantity, max);
      if (finalQty !== item.quantity) {
        // Více kusů než je reálně na skladě — ořízni
        updateQuantity(item.slug, finalQty, item.variants);
        anyChanged = true;
      }

      // Odečti spotřebované kusy ze společného poolu, ať je vidí i další položky
      if (item.stockKey) {
        const keys = Array.isArray(item.stockKey) ? item.stockKey : [item.stockKey];
        for (const key of keys) {
          const poolKey = `${item.slug}::${key}`;
          if (poolKey in remainingBySlugKey) {
            remainingBySlugKey[poolKey] -= finalQty;
          }
        }
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
            <a href="/" className="hover:text-text-muted transition-colors">{tc("home")}</a>
            <ChevronRight size={12} className="text-border" />
            <span className="text-text-muted">{t("title")}</span>
          </nav>

          {!mounted ? (
            <div className="flex flex-col gap-4 animate-pulse">
              <div className="h-8 w-64 bg-secondary rounded-xl mb-6" />
              <div className="h-36 bg-secondary rounded-2xl" />
            </div>
          ) : (
            <>
              {!isEmpty && <CheckoutStepper step={1} />}

              <h1 className="text-3xl font-extrabold text-text-base mb-8">
                {t("title")}
                {totalItems > 0 && (
                  <span className="ml-3 text-lg font-medium text-text-muted">
                    ({totalItems} {t.plural(totalItems, "item")})
                  </span>
                )}
              </h1>

              {isEmpty ? (
                <>
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-secondary border border-border flex items-center justify-center mb-5">
                      <ShoppingBag size={26} className="text-text-subtle" />
                    </div>
                    <p className="text-text-base font-semibold text-lg">{t("empty")}</p>
                    <p className="text-text-muted text-sm mt-2">{t("emptyDesc")}</p>
                    <a href="/" className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary font-bold text-sm hover:brightness-105 transition-all">
                      {t("continueShopping")} <ArrowRight size={14} />
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
                          <div key={item.slug + JSON.stringify(item.variants)} className="flex gap-3 sm:gap-5 p-3 sm:p-5 bg-secondary border border-border rounded-2xl">
                            <a href={`/produkt/${item.slug}`} className="shrink-0">
                              {(() => {
                                const layered = getProductImgs(item.slug, item.variants);
                                return (
                                  <div className="relative w-20 h-20 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-surface">
                                    <Image src={layered?.img ?? item.img} alt="" fill sizes="128px" className="object-contain p-3" />
                                    {layered?.img2 && <Image src={layered.img2} alt="" fill sizes="128px" className="object-contain p-3" />}
                                  </div>
                                );
                              })()}
                            </a>
                            <div className="flex-1 min-w-0 py-1">
                              <a href={`/produkt/${item.slug}`}>
                                <p className="text-text-base font-semibold text-base leading-snug hover:text-primary-ink transition-colors">{item.name}</p>
                              </a>
                              {item.variants && Object.entries(item.variants).length > 0 && (
                                <p className="text-text-subtle text-sm mt-1.5">
                                  {Object.entries(item.variants).map(([k, v]) => `${variantAttr(tv, k)}: ${variantLabel(tv, v)}`).join(" · ")}
                                </p>
                              )}
                              <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
                                <div className="flex items-center gap-1 border border-border rounded-xl overflow-hidden">
                                  <button
                                    onClick={() => updateQuantity(item.slug, item.quantity - 1, item.variants)}
                                    disabled={item.quantity <= 1}
                                    aria-label={t("decrease", { name: item.name })}
                                    className={`w-11 h-11 flex items-center justify-center transition-colors ${
                                      item.quantity <= 1
                                        ? "text-border cursor-not-allowed"
                                        : "text-text-muted hover:text-text-base hover:bg-border"
                                    }`}
                                  >
                                    <Minus size={14} aria-hidden="true" />
                                  </button>
                                  <span aria-live="polite" aria-atomic="true" className="w-9 text-center text-text-base text-sm font-medium">
                                    <span className="sr-only">{t("quantity")}</span>{item.quantity}
                                  </span>
                                  <button
                                    onClick={() => updateQuantity(item.slug, item.quantity + 1, item.variants)}
                                    disabled={item.quantity >= getMaxQty(item)}
                                    aria-label={t("increase", { name: item.name })}
                                    className={`w-11 h-11 flex items-center justify-center transition-colors ${
                                      item.quantity >= getMaxQty(item)
                                        ? "text-border cursor-not-allowed"
                                        : "text-text-muted hover:text-text-base hover:bg-border"
                                    }`}
                                  >
                                    <Plus size={14} aria-hidden="true" />
                                  </button>
                                </div>
                                <div className="flex items-center gap-4">
                                  <p className="text-primary-ink font-extrabold text-xl">{formatPrice(itemPrice * item.quantity, currency)}</p>
                                  <button
                                    onClick={() => removeItem(item.slug, item.variants)}
                                    aria-label={t("remove", { name: item.name })}
                                    className="w-11 h-11 flex items-center justify-center rounded-lg text-text-subtle hover:text-red-500 hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 size={17} aria-hidden="true" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <a href="/" className="inline-flex items-center gap-1.5 text-primary-ink text-sm hover:underline mt-2">
                        ← {t("continueShopping")}
                      </a>
                    </div>

                    {/* Souhrn */}
                    <div className="w-full lg:w-80 shrink-0 sticky top-24">
                      <div className="bg-secondary border border-border rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-border">
                          <h2 className="text-text-base font-semibold text-base">{t("summary")}</h2>
                        </div>
                        <div className="px-6 py-5 flex flex-col gap-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-text-muted">{t("subtotal")}</span>
                            <span className={`font-medium ${appliedDiscount && discountAmount > 0 ? "text-text-subtle line-through" : "text-text-base"}`}>
                              {formatPrice(totalPrice, currency)}
                            </span>
                          </div>
                          {appliedDiscount && discountAmount > 0 && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-green-600 flex items-center gap-1.5">
                                <Tag size={12} />
                                <span>{appliedDiscount.code}</span>
                              </span>
                              <span className="text-green-600 font-semibold">− {formatPrice(discountAmount, currency)}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-text-muted">{t("shipping")}</span>
                            <span className="text-text-subtle">{t("shippingNote")}</span>
                          </div>
                          <div className="h-px bg-border my-1" />
                          <div className="flex items-center justify-between">
                            <span className="text-text-base font-bold">{t("totalNoShipping")}</span>
                            <span className="text-primary-ink font-extrabold text-xl">{formatPrice(finalPrice, currency)}</span>
                          </div>
                        </div>

                        <div className="px-6 pb-4">
                          <DiscountWidget />
                        </div>

                        <div className="px-6 pb-6">
                          <button
                            onClick={handleCheckout}
                            className="w-full py-4 rounded-2xl bg-primary text-on-primary font-bold text-sm hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                          >
                            {t("continueToShipping")} <ArrowRight size={15} />
                          </button>
                          <p className="text-text-subtle text-xs text-center mt-3">{t("securePayment")}</p>
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