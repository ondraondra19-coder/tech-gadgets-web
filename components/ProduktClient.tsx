"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Check, ChevronRight, RefreshCw, ChevronLeft, Bell, Play, X, Star, Truck } from "lucide-react";
import type { Product } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { useCurrency } from "@/lib/CurrencyContext";
import { formatPrice, getPrice, CURRENCIES } from "@/lib/currency";
import { useStockPolling } from "@/lib/useStockPolling";
import { trackEvent } from "@/lib/analytics";
import { useT } from "@/lib/useT";
import { useLang } from "@/lib/LangContext";
import { getProductName, getProductDescription, getCategoryName, categories } from "@/lib/products";

// ── Types ────────────────────────────────────────────────────────────────────

export type MediaItem =
  | { type: "image"; src: string }
  | { type: "video"; src: string; poster?: string };

// Brandová šrafovaná dlaždice pod fotkou — stejná jako v ProductRow / kategorii.
const TILE_STYLE: React.CSSProperties = {
  backgroundColor: "#eaf8f4",
  backgroundImage:
    "repeating-linear-gradient(-45deg, rgba(40,191,166,0.07) 0 16px, rgba(40,191,166,0.15) 16px 32px)",
};

// ── Stock badge ──────────────────────────────────────────────────────────────

function StockBadge({ available }: { available: number }) {
  const t = useT("product");
  const state = available <= 0 ? "none" : available >= 5 ? "plenty" : "low";
  const chipClass =
    state === "plenty" ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
    state === "low"    ? "border-amber-200 bg-amber-50 text-amber-700" :
                         "border-rose-200 bg-rose-50 text-rose-700";
  const label =
    state === "none"   ? t("stockNone") :
    state === "plenty" ? t("stockPlenty") :
                         t.plural(available, "stockLow");
  return (
    <span key={state} className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-bold ${chipClass}`}>
      {label}
    </span>
  );
}

// ── Gallery ──────────────────────────────────────────────────────────────────

function VideoThumb({ poster }: { poster?: string }) {
  return (
    <div className="relative w-full h-full">
      {poster
        ? <Image src={poster} alt="" fill sizes="64px" className="object-cover" />
        : <div className="w-full h-full bg-secondary" />
      }
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-7 h-7 rounded-full bg-black/50 flex items-center justify-center">
          <Play size={12} className="text-white ml-0.5" fill="white" />
        </div>
      </div>
    </div>
  );
}

function Gallery({ items, productName }: { items: MediaItem[]; productName: string }) {
  const t = useT("product");
  const [active, setActive] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const current = items[active];

  function prev() { setActive(i => (i - 1 + items.length) % items.length); }
  function next() { setActive(i => (i + 1) % items.length); }

  return (
    <div className="flex flex-col gap-3">
      {/* ── Main frame ── */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-surface">
        {current?.type === "video" ? (
          <video
            ref={videoRef}
            key={current.src}
            src={current.src}
            poster={current.poster}
            controls
            playsInline
            className="w-full h-full object-contain bg-black"
          />
        ) : current ? (
          <Image
            key={current.src}
            src={current.src}
            alt={productName}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-contain"
            priority
          />
        ) : null}

        {items.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label={t("prevPhoto")}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-border shadow flex items-center justify-center text-text-muted hover:text-text-base transition-all z-10"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={next}
              aria-label={t("nextPhoto")}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-border shadow flex items-center justify-center text-text-muted hover:text-text-base transition-all z-10"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>

      {/* ── Thumbnails ── */}
      {items.length > 1 && (
        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={item.type === "video" ? t("playVideo", { n: i + 1 }) : t("showPhoto", { n: i + 1, total: items.length })}
              aria-current={i === active}
              className={`relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                i === active ? "border-primary" : "border-border hover:border-border-strong"
              }`}
            >
              {item.type === "video"
                ? <VideoThumb poster={item.poster} />
                : <Image src={item.src} alt="" fill sizes="64px" className="object-contain" />
              }
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Added to cart modal ──────────────────────────────────────────────────────

function AddedModal({ productName, productImg, onClose }: {
  productName: string;
  productImg: string;
  onClose: () => void;
}) {
  const t = useT("product");
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("addedModalLabel")}
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
    >
      <div aria-hidden="true" className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <button
          onClick={onClose}
          aria-label={t("close")}
          className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-text-subtle hover:text-text-base hover:bg-surface transition-all"
        >
          <X size={18} aria-hidden="true" />
        </button>
        <div className="p-8">
          <div className="flex items-center gap-5 mb-8">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-surface border border-border shrink-0">
              <Image src={productImg} alt="" fill sizes="80px" className="object-contain p-2" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Check size={11} strokeWidth={3} className="text-primary-ink" />
                </div>
                <p className="text-base font-bold text-text-base">{t("addedToCart")}</p>
              </div>
              <p className="text-text-muted text-sm leading-snug">{productName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl border border-border text-text-base font-semibold text-sm hover:bg-surface transition-colors"
            >
              ← {t("backToShop")}
            </button>
            <a
              href="/kosik"
              className="flex-1 py-3.5 rounded-2xl bg-primary text-on-primary font-bold text-sm text-center hover:brightness-105 active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
            >
              {t("goToCart")} →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Notify modal ──────────────────────────────────────────────────────────────

function NotifyModal({ onClose, slug }: { onClose: () => void; slug: string }) {
  const t = useT("product");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = !!email.trim() && !sending;

  function messageForCode(code: unknown): string {
    switch (code) {
      case "invalid_email":   return t("notifyErrorInvalidEmail");
      case "invalid_product": return t("notifyErrorFailed");
      case "rate_limited":    return t("notifyErrorRateLimited");
      default:                return t("notifyErrorFailed");
    }
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/stock/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), slug }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(messageForCode(data?.code));
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("notifyErrorFailed"));
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("notifyTitle")}
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
    >
      <div aria-hidden="true" className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Bell size={16} className="text-primary-ink" />
            <p className="text-text-base font-semibold text-sm">{t("notifyTitle")}</p>
          </div>
          <button
            onClick={onClose}
            aria-label={t("close")}
            className="w-11 h-11 -mr-2 flex items-center justify-center rounded-full text-text-subtle hover:text-text-base hover:bg-surface transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Check size={22} className="text-green-600" />
              </div>
              <p className="text-text-base font-semibold text-sm">{t("notifyDone")}</p>
              <p className="text-text-muted text-sm">{t("notifyDoneDesc")}</p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:brightness-105 transition-all"
              >
                {t("close")}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-text-muted text-sm">{t("notifyDesc")}</p>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(null); }}
                onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
                placeholder={t("emailPlaceholder")}
                aria-label={t("emailLabel")}
                autoComplete="email"
                autoFocus
                disabled={sending}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-text-base placeholder-text-subtle focus:outline-none focus:border-primary/50 transition-colors bg-surface disabled:opacity-60"
              />
              {error && (
                <p role="alert" className="text-red-500 text-xs -mt-1">{error}</p>
              )}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                  !canSubmit
                    ? "bg-border text-text-subtle cursor-not-allowed"
                    : "bg-primary text-on-primary hover:brightness-105"
                }`}
              >
                {sending ? t("notifySending") : t("remind")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProduktClient({
  product,
  related,
  stock: initialStock = 0,
}: {
  product: Product;
  related: Product[];
  stock?: number;
}) {
  const { items: cartItems, addItem } = useCart();
  const { currency, mounted: currencyMounted } = useCurrency();
  const t = useT("product");
  const { locale } = useLang();

  const productName = getProductName(product, locale);
  const breadcrumbCategory = (() => {
    const category = categories.find(c => c.slug === product.categories[0]);
    return category ? getCategoryName(category, locale) : product.categories[0];
  })();

  const extraMedia: MediaItem[] = product.media ?? [];
  const descriptionText = getProductDescription(product, locale);

  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [descOpen, setDescOpen] = useState(false);

  const CZK = CURRENCIES.CZK;
  const totalPrice = getPrice(product.price, currency);
  const totalPriceCZK = getPrice(product.price, CZK);

  const hasSale = !!product.discountPercent && !!product.originalPrice;
  const originalTotalPrice = hasSale ? getPrice(product.originalPrice!, currency) : 0;

  // Jedno "product_viewed" za návštěvu detailu — čeká na currencyMounted.
  useEffect(() => {
    if (!currencyMounted) return;
    trackEvent("product_viewed", {
      slug: product.slug,
      name: product.name,
      price: totalPrice,
      currency: currency.code,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.slug, currencyMounted]);

  // Sklad — živý polling z /api/stock, fallback na server-side prop / katalog.
  const { stock: liveStock, loading: stockLoading } = useStockPolling(product.slug);
  const stockCeiling = !stockLoading && liveStock !== null ? liveStock : initialStock;

  // Kolik kusů tohohle produktu už mám v košíku.
  const ownQtyInCart = cartItems.reduce(
    (sum, item) => (item.slug === product.slug ? sum + item.quantity : sum),
    0,
  );
  const currentStock = Math.max(0, stockCeiling - ownQtyInCart);
  const isOutOfStock = currentStock === 0;

  // Když se sníží sklad pod zvolené množství, ořízneme ho ještě v renderu.
  const [prevStock, setPrevStock] = useState(currentStock);
  if (currentStock !== prevStock) {
    setPrevStock(currentStock);
    if (currentStock > 0 && qty > currentStock) setQty(currentStock);
  }

  const galleryItems: MediaItem[] = [{ type: "image", src: product.img }, ...extraMedia];

  function handleAddToCart() {
    if (isOutOfStock) {
      setNotifyOpen(true);
      return;
    }
    for (let i = 0; i < qty; i++) {
      addItem({
        slug: product.slug,
        name: product.name,
        priceCZK: totalPriceCZK,
        priceRaw: product.price,
        img: product.img,
      }, stockCeiling);
    }
    trackEvent("add_to_cart", {
      slug: product.slug,
      name: product.name,
      price: totalPrice,
      currency: currency.code,
      quantity: qty,
    });
    setAdded(true);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {added && <AddedModal productName={productName} productImg={product.img} onClose={() => { setAdded(false); setQty(1); }} />}
      {notifyOpen && <NotifyModal onClose={() => setNotifyOpen(false)} slug={product.slug} />}

      <main className="min-h-screen bg-surface">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12 py-6 lg:py-10">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-text-subtle mb-5 lg:mb-8 flex-wrap">
            <Link href="/" className="hover:text-text-muted transition-colors">{t("home")}</Link>
            <ChevronRight size={11} className="text-border" aria-hidden="true" />
            {product.categories[0] && (
              <>
                <a href={`/kategorie/${product.categories[0]}`} className="hover:text-text-muted transition-colors">
                  {breadcrumbCategory}
                </a>
                <ChevronRight size={11} className="text-border" aria-hidden="true" />
              </>
            )}
            <span className="text-text-muted line-clamp-1">{productName}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-16 mb-16 lg:mb-24">

            {/* ── Gallery — sticky on desktop ── */}
            <div className="lg:sticky lg:top-6 lg:self-start">
              <Gallery items={galleryItems} productName={productName} />
            </div>

            {/* ── Info panel ── */}
            <div className="flex flex-col gap-5">

              {/* Name + price + stock */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-text-base leading-tight tracking-tight">
                  {productName}
                </h1>

                {product.rating !== undefined && (
                  <div className="flex items-center gap-2 mt-2.5" aria-label={t("ratingAria", { rating: product.rating })}>
                    <span className="flex">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i < Math.round(product.rating!) ? "text-amber-400" : "text-zinc-300"}
                          fill="currentColor"
                          aria-hidden="true"
                        />
                      ))}
                    </span>
                    {product.reviewCount !== undefined && (
                      <span className="text-sm text-text-muted">
                        <b className="font-bold text-text-base">{product.reviewCount}</b> {t("reviews")}
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-4 flex items-center gap-3 flex-wrap">
                  {!currencyMounted ? (
                    <span className="text-3xl sm:text-4xl font-extrabold opacity-0">—</span>
                  ) : hasSale ? (
                    <>
                      <span className="text-2xl sm:text-3xl font-extrabold text-white bg-rose-600 rounded-md px-3 py-1.5 leading-none">
                        {formatPrice(totalPrice, currency)}
                      </span>
                      <span className="text-xl font-medium text-text-subtle line-through leading-none">
                        {formatPrice(originalTotalPrice, currency)}
                      </span>
                      <span className="text-sm text-text-subtle">{t("inclVat")}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-3xl sm:text-4xl font-extrabold text-primary-ink leading-none">
                        {formatPrice(totalPrice, currency)}
                      </span>
                      <span className="text-sm text-text-subtle">{t("inclVat")}</span>
                    </>
                  )}
                </div>

                <div className="mt-3">
                  <StockBadge available={currentStock} />
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* ── Náhled popisku + „Číst dále" ── */}
              <div>
                <p className="text-text-muted text-sm leading-relaxed">
                  <span className="line-clamp-2">{descriptionText}</span>
                </p>
                <button
                  type="button"
                  onClick={() => setDescOpen(true)}
                  className="mt-1.5 inline-flex items-center gap-1 text-sm font-semibold text-primary-ink hover:gap-1.5 transition-all"
                >
                  {t("readMore")}
                  <ChevronRight size={14} aria-hidden="true" />
                </button>
              </div>

              {/* ── Cart button ── */}
              <div className="rounded-2xl border border-border bg-secondary overflow-hidden">
                <div className="p-3">
                  {isOutOfStock ? (
                    <button
                      onClick={handleAddToCart}
                      className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm bg-text-base text-white hover:bg-text-base/90 active:scale-[0.99] transition-all duration-200"
                    >
                      <Bell size={16} aria-hidden="true" />
                      <span>{t("notifyTitle")}</span>
                    </button>
                  ) : (
                    <div className="flex items-stretch gap-2.5">
                      <div className="flex items-center rounded-xl border border-border bg-white overflow-hidden shrink-0">
                        <button
                          onClick={() => setQty(q => Math.max(1, q - 1))}
                          disabled={qty <= 1}
                          aria-label={t("decreaseQty")}
                          className={`w-11 min-h-11 h-full flex items-center justify-center transition-colors text-base font-light ${
                            qty <= 1 ? "text-border cursor-not-allowed" : "text-text-muted hover:text-text-base hover:bg-surface"
                          }`}
                        >
                          −
                        </button>
                        <span
                          aria-live="polite"
                          aria-atomic="true"
                          className="w-7 text-center text-text-base text-sm font-semibold tabular-nums select-none"
                        >
                          <span className="sr-only">{t("quantity")}</span>{qty}
                        </span>
                        <button
                          onClick={() => setQty(q => Math.min(currentStock, q + 1))}
                          disabled={qty >= currentStock}
                          aria-label={t("increaseQty")}
                          className={`w-11 min-h-11 h-full flex items-center justify-center transition-colors text-base font-light ${
                            qty >= currentStock ? "text-border cursor-not-allowed" : "text-text-muted hover:text-text-base hover:bg-surface"
                          }`}
                        >
                          +
                        </button>
                      </div>

                      <button
                        key={added ? "added" : "default"}
                        onClick={handleAddToCart}
                        disabled={added}
                        className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                          added
                            ? "bg-primary/15 text-primary-ink cursor-default"
                            : "bg-primary text-on-primary hover:brightness-105 active:scale-[0.98] shadow-md shadow-primary/20"
                        }`}
                      >
                        {added
                          ? <><Check size={15} aria-hidden="true" /><span>{t("added")}</span></>
                          : <><ShoppingCart size={15} aria-hidden="true" /><span>{t("addToCart")}</span></>
                        }
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-t border-border divide-y divide-border">
                  <div className="flex items-center gap-2.5 px-4 py-3">
                    <Truck size={18} className="text-primary-ink shrink-0" aria-hidden="true" />
                    <span className="text-text-base text-sm font-semibold">{t("ship24")}</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-4 py-3">
                    <RefreshCw size={18} className="text-primary-ink shrink-0" aria-hidden="true" />
                    <span className="text-text-base text-sm font-semibold">{t("moneyBack14")}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ── Related products ── */}
          {related.length > 0 && (
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-text-base mb-5">{t("related")}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {related.map((p) => {
                  const relSale = !!p.discountPercent && !!p.originalPrice;
                  return (
                    <a
                      key={p.slug}
                      href={`/produkt/${p.slug}`}
                      className="group flex flex-col bg-white border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <div className="relative aspect-square overflow-hidden" style={TILE_STYLE}>
                        {p.discountPercent && (
                          <span className="absolute top-2.5 left-2.5 z-10 text-[11px] leading-none text-white bg-rose-600 rounded-lg px-2 py-1 shadow-sm">
                            −{p.discountPercent}&nbsp;%
                          </span>
                        )}
                        <Image
                          src={p.img}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-contain p-4 transition-transform duration-300 group-hover:scale-[1.04]"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5 p-3 sm:p-4 border-t border-border">
                        <p className="text-text-base text-xs sm:text-sm font-semibold leading-snug group-hover:text-primary-ink transition-colors line-clamp-2 min-h-[2.5rem]">{getProductName(p, locale)}</p>
                        {relSale ? (
                          <span className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-extrabold text-white bg-rose-600 rounded-lg px-2 py-1 leading-none">
                              {formatPrice(getPrice(p.price, currency), currency)}
                            </span>
                            <span className="text-xs font-medium text-text-subtle line-through">
                              {formatPrice(getPrice(p.originalPrice!, currency), currency)}
                            </span>
                          </span>
                        ) : (
                          <p className="text-primary-ink font-extrabold text-base mt-0.5">{formatPrice(getPrice(p.price, currency), currency)}</p>
                        )}
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* ── Výsuvný panel s plným popisem ── */}
        {descOpen && (
          <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={t("descTitle")}>
            <button
              type="button"
              aria-label={t("close")}
              onClick={() => setDescOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              style={{ animation: "drawerFade 0.2s ease-out" }}
            />
            <div
              className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
              style={{ animation: "drawerIn 0.25s ease-out" }}
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
                <h2 className="text-lg font-extrabold text-text-base uppercase tracking-wide">{t("descTitle")}</h2>
                <button
                  type="button"
                  onClick={() => setDescOpen(false)}
                  aria-label={t("close")}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-text-muted hover:bg-surface hover:text-text-base transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <p className="text-text-muted text-sm leading-relaxed whitespace-pre-line">{descriptionText}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
