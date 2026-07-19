"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Check, ChevronRight, Package, RefreshCw, ShieldCheck, ChevronLeft, Bell, Play, X } from "lucide-react";
import type { Product, ModelColor, ModelColorLayered } from "@/lib/products";
import { useCart, type PriceRaw } from "@/lib/cart";
import { useCurrency } from "@/lib/CurrencyContext";
import { formatPrice, getPrice, CURRENCIES } from "@/lib/currency";
import { useStockPolling } from "@/lib/useStockPolling";
import { trackEvent } from "@/lib/analytics";
import { useT } from "@/lib/useT";
import { useLang } from "@/lib/LangContext";
import { getProductName, getProductDescription, getCategoryName, categories } from "@/lib/products";
import { variantLabel, variantAttr, translateOptions } from "@/lib/variantLabels";

// ── Types ────────────────────────────────────────────────────────────────────

export type MediaItem =
  | { type: "image"; src: string }
  | { type: "video"; src: string; poster?: string };

function isLayeredColor(c: ModelColor | ModelColorLayered): c is ModelColorLayered {
  return "body" in c;
}

// ── Color map ────────────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  cerna: "#1a1a1a", bila: "#ffffff", modra: "#4a90d9", ruzova: "#f9a8d4",
  zelena: "#86efac", cervena: "#f87171", zluta: "#fde047", hneda: "#92400e",
  bezova: "#e5d5b0", stribrna: "#d1d5db", fialova: "#c084fc",
  black: "#1a1a1a", white: "#ffffff", grey: "#a4a09d", pink: "#fecaca",
  green: "#aae8c7", darkblue: "#132739", armygreen: "#454f10", purple: "#eacfec",
  small: "#94a3b8", large: "#64748b",
  gen1: "#6366f1", gen2: "#8b5cf6",
  s: "#bfdbfe", m: "#93c5fd", l: "#60a5fa", set: "#3b82f6",
  transparent: "#e0f2fe",
};

// ── Stock badge ──────────────────────────────────────────────────────────────

function StockBadge({ available, anyInStock }: { available: number; anyInStock: boolean }) {
  const t = useT("product");
  const state = !anyInStock ? "none" : available === 0 ? "variant" : available >= 5 ? "plenty" : "low";
  const colorClass = state === "plenty" ? "text-green-600" : state === "low" ? "text-amber-500" : "text-red-500";
  const dotClass = state === "plenty" ? "bg-green-500" : state === "low" ? "bg-amber-400 animate-pulse" : "bg-red-400";
  const label =
    state === "none"    ? t("stockNone") :
    state === "variant" ? t("stockVariant") :
    state === "plenty"  ? t("stockPlenty") :
                          t.plural(available, "stockLow");
  return (
    <span key={state} className={`inline-flex items-center gap-1.5 text-[12px] font-semibold ${colorClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full inline-block ${dotClass}`} />
      <span>{label}</span>
    </span>
  );
}

// ── Color swatch ─────────────────────────────────────────────────────────────

// `label` je povinný — dřív měl výchozí "Barva", což byl jediný český řetězec,
// který by se do UI protekl i v anglické verzi. Všechna volání ho stejně předávají.
function ColorSwatch({
  colors,
  selected,
  onChange,
  label,
}: {
  colors: { label: string; value: string; hex?: string }[];
  selected: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    /* radiogroup: výběr barvy je jedna volba z několika — čtečka pak ohlásí
       "1 z 7" a vybraný stav. Samotný title= přístupný název spolehlivě nedává. */
    <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label={label}>
      {colors.map((c) => {
        const hex = c.hex ?? COLOR_MAP[c.value] ?? "#cccccc";
        const bright = parseInt(hex.replace("#", ""), 16) > 0xbbbbbb;
        return (
          <button
            key={c.value}
            onClick={() => onChange(c.value)}
            title={c.label}
            role="radio"
            aria-checked={selected === c.value}
            aria-label={c.label}
            className={`relative w-10 h-10 rounded-full transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-base ring-offset-2 ring-offset-white ${
              selected === c.value
                ? "ring-2 ring-primary scale-110 shadow-md"
                : "ring-1 ring-border-strong hover:scale-105"
            }`}
            style={{ backgroundColor: hex }}
          >
            {selected === c.value && (
              <span className="absolute inset-0 flex items-center justify-center">
                <Check size={13} strokeWidth={3} className={bright ? "text-gray-700" : "text-white"} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Size / type pill buttons ─────────────────────────────────────────────────

function SizePills({
  options,
  selected,
  onChange,
  label = "Varianta",
}: {
  options: { label: string; value: string }[];
  selected: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          role="radio"
          aria-checked={selected === opt.value}
          /* min-h-11 = 44px: varianty produktu jsou na mobilu častý cíl překliku */
          className={`px-4 py-2 min-h-11 rounded-xl text-sm font-medium border transition-all duration-150 ${
            selected === opt.value
              ? "bg-primary text-on-primary border-primary"
              : "bg-secondary text-text-muted border-border hover:border-border-strong hover:text-text-base"
          }`}
        >
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
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

function Gallery({
  items,
  layeredBody,
  layeredCap,
  productName,
}: {
  items: MediaItem[];
  layeredBody?: string;
  layeredCap?: string;
  productName: string;
}) {
  const t = useT("product");
  const [active, setActive] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Při výměně galerie (jiná barva/model) se vracíme na první snímek. Dřív to
  // dělal useEffect, jenže ten běží až PO renderu: jeden snímek se stihl
  // vykreslit se starým indexem proti novým položkám. Mezi vrstveným a
  // nevrstveným modelem se navíc mění i POČET položek (viz galleryItems), takže
  // index mohl ukázat mimo pole a hlavní obrázek na jeden render zmizel.
  // Úprava stavu přímo v renderu je na tohle doporučený postup Reactu —
  // komponenta se přepočítá hned, bez commitu mezikroku.
  const itemKey = items.map(i => i.src).join("|");
  const [prevItemKey, setPrevItemKey] = useState(itemKey);
  if (itemKey !== prevItemKey) {
    setPrevItemKey(itemKey);
    setActive(0);
  }

  const current = items[active];

  function prev() { setActive(i => (i - 1 + items.length) % items.length); }
  function next() { setActive(i => (i + 1) % items.length); }

  function handleThumbClick(i: number) {
    setActive(i);
  }

  return (
    <div className="flex flex-col gap-3">

      {/* ── Main frame ── */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-surface">

        {layeredBody ? (
          <>
            {/* Tělo nese popis celého produktu, hlavička je jen druhá vrstva
                téhož obrázku — proto u ní alt="" (jinak by čtečka četla dvakrát). */}
            <Image src={layeredBody} alt={productName} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-contain" priority />
            {layeredCap && <Image src={layeredCap} alt="" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-contain" />}
          </>
        ) : current?.type === "video" ? (
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

        {/* Arrow nav */}
        {!layeredBody && items.length > 1 && (
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
      {!layeredBody && items.length > 1 && (
        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => handleThumbClick(i)}
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
      {/* Backdrop — dekorace, klik zavírá; čtečka ho ignoruje (tlačítko Zavřít je níž) */}
      <div aria-hidden="true" className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Zavřít */}
        <button
          onClick={onClose}
          aria-label={t("close")}
          className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-text-subtle hover:text-text-base hover:bg-surface transition-all"
        >
          <X size={18} aria-hidden="true" />
        </button>

        {/* Obsah */}
        <div className="p-8">
          {/* Produkt */}
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

          {/* Tlačítka */}
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

function NotifyModal({
  onClose,
  slug,
  stockKeys,
}: {
  onClose: () => void;
  slug: string;
  stockKeys: string | string[];
}) {
  const t = useT("product");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = !!email.trim() && !sending;

  // API vrací kód, ne hotovou větu — text vybíráme tady podle jazyka. Neznámý
  // kód spadne na obecné "nepovedlo se", ať nikdy neukážeme "product.neco".
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
        body: JSON.stringify({ email: email.trim(), slug, stockKeys }),
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
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
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
  stockData = {},
}: {
  product: Product;
  related: Product[];
  stockData?: Record<string, number>;
}) {
  const { items: cartItems, addItem } = useCart();
  const { currency, mounted: currencyMounted } = useCurrency();
  const t  = useT("product");
  const tv = useT("variants");
  const { locale } = useLang();

  const productName = getProductName(product, locale);
  const breadcrumbCategory = (() => {
    const category = categories.find(c => c.slug === product.categories[0]);
    return category ? getCategoryName(category, locale) : product.categories[0];
  })();

  // Popisky voleb chodí z katalogu česky ("Tmavě modrá"). Klíčem k překladu je
  // syrová hodnota ("darkblue") — viz lib/variantLabels.ts.
  const newColors:  { label: string; value: string; hex?: string; img?: string }[] =
    translateOptions(tv, product.colors ?? []);
  const newSizes:   { label: string; value: string }[] = translateOptions(tv, product.sizes ?? []);
  const extraMedia: MediaItem[]                        = product.media ?? [];
  const sizesLabel: string = product.sizesLabel
    ? variantLabel(tv, product.sizesLabel, product.sizesLabel)
    : t("size");

  const hasNewColors = newColors.length > 0;
  const hasNewSizes  = newSizes.length  > 0;

  const hasModels   = !!product.models?.length;
  const hasVariants = !!product.variants?.length;

  const [colorValue, setColorValue] = useState(newColors[0]?.value ?? "");
  const [sizeValue,  setSizeValue]  = useState(newSizes[0]?.value  ?? "");

  const [modelId,     setModelId]     = useState(product.models?.[0]?.id ?? "");
  const [legacyColor, setLegacyColor] = useState(product.models?.[0]?.colors[0]?.value ?? "");
  const [combo,       setCombo]       = useState(false);
  const [bodyValue,   setBodyValue]   = useState(product.models?.find(m => m.layered)?.colors[0]?.value ?? "");
  const [capValue,    setCapValue]    = useState(product.models?.find(m => m.layered)?.colors[0]?.value ?? "");

  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);
  const [notifyOpen, setNotifyOpen] = useState(false);

  const model     = product.models?.find(m => m.id === modelId);
  const isLayered = model?.layered ?? false;

  const rawBasePrice  = model ? model.price : product.price;
  const rawComboExtra = model?.comboExtra ?? 0;

  const CZK = CURRENCIES.CZK;
  const basePrice  = getPrice(rawBasePrice, currency);
  const comboExtra = (isLayered && combo && bodyValue !== capValue)
    ? getPrice(rawComboExtra, currency)
    : 0;
  const totalPrice = basePrice + comboExtra;

  const basePriceCZK  = getPrice(rawBasePrice, CZK);
  const comboExtraCZK = (isLayered && combo && bodyValue !== capValue)
    ? getPrice(rawComboExtra, CZK)
    : 0;
  const totalPriceCZK = basePriceCZK + comboExtraCZK;

  // Sleva na aktuální variantě — u produktů s modely ji nese vybraný model,
  // jinak samotný produkt (doplnil ji server ve vrstvě lib/productDiscounts.ts).
  // Příplatek za kombinaci (comboExtra) se neslevuje, přičte se k původní ceně.
  const rawOriginalPrice = model ? model.originalPrice : product.originalPrice;
  const discountPercent  = model ? model.discountPercent : product.discountPercent;
  const hasSale = !!discountPercent && !!rawOriginalPrice;
  const originalTotalPrice = hasSale ? getPrice(rawOriginalPrice, currency) + comboExtra : 0;

  // Jedno "product_viewed" za návštěvu detailu — čeká na currencyMounted, ať
  // se neposílá s cenou v (možná chybné) výchozí měně před hydratací.
  useEffect(() => {
    if (!currencyMounted) return;
    trackEvent("product_viewed", {
      slug: product.slug,
      name: product.name,
      price: basePrice,
      currency: currency.code,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.slug, currencyMounted]);

  // U vrstvené kombinace se k základní ceně přičítá comboExtra, a to v každé
  // měně zvlášť — do košíku proto musí jít objekt se všemi měnami, ne jedno
  // číslo. Dřív se skládal přes Object.fromEntries, jenže ten vrací
  // { [k: string]: number }, což do PriceRaw nesedí — a řešilo se to `as any`.
  // Vypsané klíče typ splní samy a navíc je hned vidět, co se do košíku uloží.
  const comboExtraRaw = model?.comboExtra;
  const priceRawForCart: PriceRaw = (isLayered && combo && bodyValue !== capValue && comboExtraRaw)
    ? (typeof rawBasePrice === "number"
        ? totalPriceCZK
        : {
            CZK: getPrice(rawBasePrice, CURRENCIES.CZK) + getPrice(comboExtraRaw, CURRENCIES.CZK),
            EUR: getPrice(rawBasePrice, CURRENCIES.EUR) + getPrice(comboExtraRaw, CURRENCIES.EUR),
            USD: getPrice(rawBasePrice, CURRENCIES.USD) + getPrice(comboExtraRaw, CURRENCIES.USD),
          })
    : rawBasePrice;

  const allLegacyVariantsSelected = !hasVariants ||
    product.variants!.every(v => selectedVariants[v.type]);

  const canAddToCart = hasModels
    ? true
    : hasVariants
      ? allLegacyVariantsSelected
      : true;

  const hasSheetData = Object.keys(stockData).length > 0;

  // Klíč(e) ve stejném formátu jako klíče skladu v Redisu — "color|size".
  // U vrstvených barev (tělo + hlavička) vrací dva klíče najednou, protože
  // dostupné množství je omezené tou barvou, které je skladem méně.
  const stockKeys: string | string[] = (() => {
    if (isLayered) {
      const activeBody = combo ? bodyValue : legacyColor;
      const activeCap  = combo ? capValue  : legacyColor;
      const size = modelId;
      return [`${activeBody}__body|${size}`, `${activeCap}__cap|${size}`];
    }
    const activeColor = hasNewColors ? colorValue
      : hasModels ? legacyColor
      : undefined;
    const activeSize = hasNewSizes ? sizeValue
      : hasModels ? modelId
      : undefined;
    return `${activeColor ?? "-"}|${activeSize ?? "-"}`;
  })();

  // Porovná dvě sady stockKey — použito k rozpoznání, že řádka v košíku je
  // přesně ta samá varianta, kterou má uživatel právě vybranou (tu nepočítáme
  // jako "cizí rezervaci").
  function stockKeysEqual(a: string | string[], b: string | string[]): boolean {
    const arrA = Array.isArray(a) ? a : [a];
    const arrB = Array.isArray(b) ? b : [b];
    if (arrA.length !== arrB.length) return false;
    return arrA.every(v => arrB.includes(v));
  }

  // Kolik kusů daného skladového klíče (např. "grey__body|usbc") už zabírají
  // JINÉ varianty téhož produktu v košíku — ty si sklad reálně dělí s tím, co
  // uživatel právě vybírá.
  function reservedByOtherCartLines(key: string): number {
    return cartItems.reduce((sum, item) => {
      if (item.slug !== product.slug || !item.stockKey) return sum;
      if (stockKeysEqual(item.stockKey, stockKeys)) return sum; // stejná varianta jako právě vybraná
      const keys = Array.isArray(item.stockKey) ? item.stockKey : [item.stockKey];
      return keys.includes(key) ? sum + item.quantity : sum;
    }, 0);
  }

  function resolveStock(data: Record<string, number>, keys: string | string[]): number {
    const list = Array.isArray(keys) ? keys : [keys];
    return Math.min(...list.map(k => {
      const total = data[k] ?? 0;
      const reserved = reservedByOtherCartLines(k);
      return Math.max(0, total - reserved);
    }));
  }

  // Kolik kusů přesně této vybrané varianty už mám v košíku (může to být jedna
  // řádka, sečteme pro jistotu, kdyby jich bylo víc).
  function ownCartQtyForCurrentSelection(): number {
    return cartItems.reduce((sum, item) => {
      if (item.slug !== product.slug || !item.stockKey) return sum;
      return stockKeysEqual(item.stockKey, stockKeys) ? sum + item.quantity : sum;
    }, 0);
  }

  // Polling skladu ze Sheets — jednoduchý, bez Redis, bez rezervací
  const { stockData: liveStockData, loading: stockLoading } = useStockPolling(product.slug);

  // Skutečný celkový strop pro tuto variantu = reálný sklad minus to, co si
  // "zabírají" jiné varianty téhož produktu v košíku. Tohle je horní hranice,
  // na kterou se nikdy nemá dostat celkové množství této varianty v košíku.
  const stockCeiling = (() => {
    if (!stockLoading && Object.keys(liveStockData).length > 0) {
      return resolveStock(liveStockData, stockKeys);
    }
    // Fallback na server-side prop dokud polling nenačte
    if (hasSheetData) {
      return resolveStock(stockData, stockKeys);
    }
    return product.inStock ? product.stock : 0;
  })();

  // To, co se zobrazuje jako "skladem" a co lze ještě přidat = strop minus to,
  // co už mám z téhle přesné varianty v košíku.
  const ownQtyInCart = ownCartQtyForCurrentSelection();
  const currentStock = Math.max(0, stockCeiling - ownQtyInCart);

  const availableQty = currentStock;
  const canAddMoreQty = currentStock;
  const isOutOfStock = currentStock === 0;

  // Když se změní varianta a nový sklad je nižší než zvolené množství, ořízneme
  // ho. Stejně jako v Gallery to dřív dělal useEffect, takže se jeden render
  // stihl vykreslit s množstvím vyšším, než kolik je skladem.
  //
  // Druhá větev tu byla `else if (canAddMoreQty === 0 && !isOutOfStock) setQty(1)`
  // a nešlo ji vykonat: canAddMoreQty i isOutOfStock se počítají z téhož
  // currentStock, takže `canAddMoreQty === 0` znamená `isOutOfStock === true`
  // a podmínka `!isOutOfStock` byla vždy nepravdivá. Odstraněno — chování to
  // nemění, jen tu přestává strašit mrtvý kód.
  const [prevCanAddMoreQty, setPrevCanAddMoreQty] = useState(canAddMoreQty);
  if (canAddMoreQty !== prevCanAddMoreQty) {
    setPrevCanAddMoreQty(canAddMoreQty);
    if (canAddMoreQty > 0 && qty > canAddMoreQty) setQty(canAddMoreQty);
  }

  const anyInStock = hasSheetData
    ? Object.values(stockData).some(v => v > 0)
    : product.inStock && product.stock > 0;

  const selectedColorObj = newColors.find(c => c.value === colorValue);
  const mainImgSrc = selectedColorObj?.img ?? product.img;

  // Bez `as any` funguje type guard, jak má: ve větvi !isLayeredColor(...) si
  // TypeScript sám zúží typ na ModelColor, takže druhý cast u .img odpadá.
  const legacyColorObj  = model?.colors.find(c => c.value === legacyColor);
  const legacyImgSrc    = legacyColorObj && !isLayeredColor(legacyColorObj)
    ? legacyColorObj.img
    : product.img;

  const galleryItems: MediaItem[] = isLayered
    ? extraMedia
    : hasModels
      ? [{ type: "image", src: legacyImgSrc }, ...extraMedia]
      : [{ type: "image", src: mainImgSrc },  ...extraMedia];

  const bVal = combo ? bodyValue : legacyColor;
  const cVal = combo ? capValue  : legacyColor;
  const layeredBodySrc = isLayered
    ? (model?.colors.find(c => c.value === bVal) as ModelColorLayered | undefined)?.body
    : undefined;
  const layeredCapSrc = isLayered
    ? (model?.colors.find(c => c.value === cVal) as ModelColorLayered | undefined)?.cap
    : undefined;

  function handleModelChange(id: string) {
    const m = product.models?.find(m => m.id === id);
    setModelId(id);
    setLegacyColor(m?.colors[0]?.value ?? "");
    setCombo(false);
    setBodyValue(m?.colors[0]?.value ?? "");
    setCapValue(m?.colors[0]?.value ?? "");
  }

  function handleAddToCart() {
    if (isOutOfStock) {
      setNotifyOpen(true);
      return;
    }
    if (!canAddToCart) return;

    let variantInfo: Record<string, string> = {};

    if (hasModels) {
      variantInfo = {
        Model: model?.label ?? "",
        ...(isLayered && combo && bodyValue !== capValue
          ? { Tělo: bodyValue, Hlavička: capValue }
          : { Barva: legacyColor }),
      };
    } else if (hasVariants) {
      variantInfo = selectedVariants;
    } else {
      if (hasNewColors && colorValue) {
        variantInfo["Barva"] = newColors.find(c => c.value === colorValue)?.label ?? colorValue;
      }
      if (hasNewSizes && sizeValue) {
        variantInfo[sizesLabel] = newSizes.find(s => s.value === sizeValue)?.label ?? sizeValue;
      }
    }

    const imgForCart = isLayered
      ? layeredBodySrc ?? product.img
      : hasModels
        ? legacyImgSrc
        : mainImgSrc;

    // Přidáme qty kusů do košíku, maxQuantity = stockCeiling (skutečný celkový
    // strop pro tuto variantu) jako ochrana — addItem si sám sečte s tím, co
    // už v košíku je.
    for (let i = 0; i < qty; i++) {
      addItem({
        slug: product.slug,
        name: product.name,
        priceCZK: totalPriceCZK,
        priceRaw: priceRawForCart,
        img: imgForCart,
        variants: Object.keys(variantInfo).length > 0 ? variantInfo : undefined,
        stockKey: stockKeys, // přesný klíč (nebo dva u vrstvených barev) pro lookup skladu v košíku
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
      {added && <AddedModal productName={productName} productImg={mainImgSrc} onClose={() => { setAdded(false); setQty(1); }} />}
      {notifyOpen && (
        <NotifyModal
          onClose={() => setNotifyOpen(false)}
          slug={product.slug}
          stockKeys={stockKeys}
        />
      )}

      <main className="min-h-screen bg-surface">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12 py-6 lg:py-10">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-text-subtle mb-5 lg:mb-8 flex-wrap">
            <Link href="/" className="hover:text-text-muted transition-colors">{t("home")}</Link>
            <ChevronRight size={11} className="text-border" aria-hidden="true" />
            {product.categories[0] && (
              <>
                {/* Dřív se tu sázel slug s pomlčkami nahrazenými mezerami
                    ("pouzdra obaly") — katalog má skutečný název i s překlady. */}
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
              <Gallery
                items={galleryItems}
                layeredBody={layeredBodySrc}
                layeredCap={layeredCapSrc}
                productName={productName}
              />
            </div>

            {/* ── Info panel ── */}
            <div className="flex flex-col gap-5">

              {/* Name + price + stock */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-text-base leading-tight tracking-tight">
                  {productName}
                </h1>
                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  <span className="flex items-baseline gap-2.5">
                    <span className="text-3xl sm:text-4xl font-extrabold text-primary-ink leading-none">
                      {currencyMounted ? formatPrice(totalPrice, currency) : <span className="opacity-0">—</span>}
                    </span>
                    {currencyMounted && hasSale && (
                      <>
                        <span className="text-lg sm:text-xl font-medium text-text-subtle line-through leading-none">
                          {formatPrice(originalTotalPrice, currency)}
                        </span>
                        <span className="text-xs font-bold text-white bg-rose-600 rounded-full px-2 py-1 leading-none">
                          −{discountPercent}&nbsp;%
                        </span>
                      </>
                    )}
                  </span>
                  {comboExtra > 0 && (
                    <span className="text-xs text-text-subtle">
                      {t("comboExtra", {
                        base: formatPrice(basePrice, currency),
                        extra: formatPrice(comboExtra, currency),
                      })}
                    </span>
                  )}
                  <StockBadge available={availableQty} anyInStock={anyInStock} />
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* ── NEW: colour swatches ── */}
              {hasNewColors && (
                <div>
                  <p className="text-text-base font-semibold text-sm mb-3">
                    {t("color")}
                    <span className="text-text-muted font-normal ml-2">
                      — {newColors.find(c => c.value === colorValue)?.label}
                    </span>
                  </p>
                  <ColorSwatch colors={newColors} selected={colorValue} label={t("color")} onChange={(v) => { setColorValue(v); setQty(1); }} />
                </div>
              )}

              {/* ── NEW: size / type pills ── */}
              {hasNewSizes && (
                <div>
                  <p className="text-text-base font-semibold text-sm mb-3">
                    {sizesLabel}
                    <span className="text-text-muted font-normal ml-2">
                      — {newSizes.find(s => s.value === sizeValue)?.label}
                    </span>
                  </p>
                  <SizePills options={newSizes} selected={sizeValue} label={sizesLabel} onChange={(v) => { setSizeValue(v); setQty(1); }} />
                </div>
              )}

              {/* ── LEGACY: models (pencil) ── */}
              {hasModels && model && (
                <>
                  {!combo && model.colors.length > 0 && (
                    <div>
                      <p className="text-text-base font-semibold text-sm mb-3">
                        {t("color")}
                        <span className="text-text-muted font-normal ml-2">
                          — {variantLabel(tv, legacyColor, model.colors.find(c => c.value === legacyColor)?.label)}
                        </span>
                      </p>
                      <ColorSwatch
                        colors={translateOptions(tv, model.colors as { label: string; value: string; hex?: string }[])}
                        selected={legacyColor}
                        label={t("color")}
                        onChange={(v) => { setLegacyColor(v); setQty(1); }}
                      />
                    </div>
                  )}
                  {product.models!.length > 1 && (
                    <div>
                      <p className="text-text-base font-semibold text-sm mb-3">{t("model")}</p>
                      <SizePills
                        options={product.models!.map(m => ({ label: m.label, value: m.id }))}
                        selected={modelId}
                        label={t("model")}
                        onChange={(v) => { handleModelChange(v); setQty(1); }}
                      />
                    </div>
                  )}
                  {isLayered && (
                    <div className="flex flex-col gap-4">
                      <button
                        onClick={() => setCombo(v => !v)}
                        role="checkbox"
                        aria-checked={combo}
                        className="flex items-center gap-3 text-sm text-text-muted hover:text-text-base transition-colors w-fit min-h-11"
                      >
                        <span aria-hidden="true" className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-150 ${
                          combo ? "bg-primary border-primary" : "border-border-strong"
                        }`}>
                          {combo && <Check size={11} strokeWidth={3} className="text-on-primary" />}
                        </span>
                        <span>{t("customCombo")}</span>
                        <span className="text-text-subtle text-xs">
                          {t("comboSurcharge", { extra: formatPrice(getPrice(model.comboExtra ?? 0, currency), currency) })}
                        </span>
                      </button>
                      {combo && (
                        <div className="flex flex-col gap-4 pl-8 border-l-2 border-primary/20">
                          <div>
                            <p className="text-text-base font-semibold text-sm mb-2">
                              {t("bodyColor")}
                              <span className="text-text-muted font-normal ml-2">
                                — {variantLabel(tv, bodyValue, model.colors.find(c => c.value === bodyValue)?.label)}
                              </span>
                            </p>
                            <ColorSwatch
                              colors={translateOptions(tv, model.colors as { label: string; value: string; hex?: string }[])}
                              selected={bodyValue}
                              label={t("bodyColor")}
                              onChange={setBodyValue}
                            />
                          </div>
                          <div>
                            <p className="text-text-base font-semibold text-sm mb-2">
                              {t("capColor")}
                              <span className="text-text-muted font-normal ml-2">
                                — {variantLabel(tv, capValue, model.colors.find(c => c.value === capValue)?.label)}
                              </span>
                            </p>
                            <ColorSwatch
                              colors={translateOptions(tv, model.colors as { label: string; value: string; hex?: string }[])}
                              selected={capValue}
                              label={t("capColor")}
                              onChange={setCapValue}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* ── LEGACY: simple variants ── */}
              {!hasModels && hasVariants && product.variants!.map((variant) => {
                const isColorVariant = ["Barva", "barva", "Color", "color"].includes(variant.type);
                const selected = selectedVariants[variant.type];
                return (
                  <div key={variant.type}>
                    <p className="text-text-base font-semibold text-sm mb-3">
                      {variantAttr(tv, variant.type)}
                      {selected && (
                        <span className="text-text-muted font-normal ml-2">
                          — {variantLabel(tv, selected, variant.options.find(o => o.value === selected)?.label)}
                        </span>
                      )}
                    </p>
                    {isColorVariant ? (
                      <ColorSwatch
                        colors={translateOptions(tv, variant.options)}
                        selected={selected ?? ""}
                        label={variantAttr(tv, variant.type)}
                        onChange={(val) => setSelectedVariants(prev => ({ ...prev, [variant.type]: val }))}
                      />
                    ) : (
                      <SizePills
                        options={translateOptions(tv, variant.options)}
                        selected={selected ?? ""}
                        label={variantAttr(tv, variant.type)}
                        onChange={(val) => setSelectedVariants(prev => ({ ...prev, [variant.type]: val }))}
                      />
                    )}
                  </div>
                );
              })}

              {/* ── Cart button + trust bar v jednom obdélníku ── */}
              <div className="rounded-2xl border border-border bg-secondary overflow-hidden">

                {/* Tlačítko košíku */}
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
                      {/* Počítadlo */}
                      {/* Znaménka − / + nesdělí čtečce, co dělají — proto aria-label.
                          aria-live na počtu ohlásí novou hodnotu po kliknutí. */}
                      <div className="flex items-center rounded-xl border border-border bg-white overflow-hidden shrink-0">
                        <button
                          onClick={() => setQty(q => Math.max(1, q - 1))}
                          disabled={qty <= 1}
                          aria-label={t("decreaseQty")}
                          className={`w-11 min-h-11 h-full flex items-center justify-center transition-colors text-base font-light ${
                            qty <= 1
                              ? "text-border cursor-not-allowed"
                              : "text-text-muted hover:text-text-base hover:bg-surface"
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
                          onClick={() => setQty(q => Math.min(canAddMoreQty, q + 1))}
                          disabled={qty >= canAddMoreQty}
                          aria-label={t("increaseQty")}
                          className={`w-11 min-h-11 h-full flex items-center justify-center transition-colors text-base font-light ${
                            qty >= canAddMoreQty
                              ? "text-border cursor-not-allowed"
                              : "text-text-muted hover:text-text-base hover:bg-surface"
                          }`}
                        >
                          +
                        </button>
                      </div>

                      {/* Přidat do košíku */}
                      <button
                        key={added ? "added" : "default"}
                        onClick={handleAddToCart}
                        disabled={added || (!isOutOfStock && !canAddToCart)}
                        className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                          added
                            ? "bg-primary/15 text-primary-ink cursor-default"
                            : !canAddToCart
                            ? "bg-border text-text-subtle cursor-not-allowed"
                            : "bg-primary text-on-primary hover:brightness-105 active:scale-[0.98] shadow-md shadow-primary/20"
                        }`}
                      >
                        {added
                          ? <><Check size={15} aria-hidden="true" /><span>{t("added")}</span></>
                          : <><ShoppingCart size={15} aria-hidden="true" /><span>{!canAddToCart ? t("selectVariant") : t("addToCart")}</span></>
                        }
                      </button>
                    </div>
                  )}

                  {!canAddToCart && !isOutOfStock && hasVariants && (
                    <p className="text-text-subtle text-xs text-center mt-2">
                      {t("selectPrompt", {
                        variants: product.variants!
                          .filter(v => !selectedVariants[v.type])
                          .map(v => variantAttr(tv, v.type).toLowerCase())
                          .join(t("and")),
                      })}
                    </p>
                  )}
                </div>

                {/* Trust bar */}
                <div className="border-t border-border grid grid-cols-3">
                  {[
                    { icon: Package,     label: t("trustShipping"), sub: t("trustShippingSub") },
                    { icon: RefreshCw,   label: t("trustReturns"),  sub: t("trustReturnsSub")  },
                    { icon: ShieldCheck, label: t("trustWarranty"), sub: t("trustWarrantySub") },
                  ].map((item, i) => (
                    <div key={item.label} className={`flex flex-col items-center justify-center gap-1.5 py-4 px-2 ${i < 2 ? "border-r border-border" : ""}`}>
                      <item.icon size={20} className="text-primary-ink" />
                      <span className="text-text-base text-xs font-bold leading-none">{item.label}</span>
                      <span className="text-text-subtle text-[11px] leading-none">{item.sub}</span>
                    </div>
                  ))}
                </div>

              </div>

              {/* ── Description ── */}
              <div className="pt-1 border-t border-border">
                <p className="text-text-base font-semibold text-sm mb-2">{t("description")}</p>
                <p className="text-text-muted text-sm leading-relaxed">{getProductDescription(product, locale)}</p>
              </div>

            </div>
          </div>

          {/* ── Related products ── */}
          {related.length > 0 && (
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-text-base mb-5">{t("related")}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {related.map((p) => (
                  <a
                    key={p.slug}
                    href={`/produkt/${p.slug}`}
                    className="group flex flex-col bg-white border border-border rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-md transition-all duration-200"
                  >
                    <div className="relative aspect-square bg-surface">
                      <Image
                        src={p.img}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-contain p-4 transition-transform duration-300 group-hover:scale-[1.04]"
                      />
                    </div>
                    <div className="flex flex-col gap-1 p-3 sm:p-4 border-t border-border">
                      <p className="text-text-base text-xs sm:text-sm font-semibold leading-snug group-hover:text-primary-ink transition-colors line-clamp-2">{getProductName(p, locale)}</p>
                      <p className="text-primary-ink font-bold text-sm sm:text-base mt-0.5">{formatPrice(getPrice(p.price, currency), currency)}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </>
  );
}