"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ShoppingCart, Check, ChevronRight, Package, RefreshCw, ShieldCheck, ChevronLeft, Bell, Play, X } from "lucide-react";
import type { Product, ModelColor, ModelColorLayered } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { useCurrency } from "@/lib/CurrencyContext";
import { formatPrice, getPrice, CURRENCIES } from "@/lib/currency";
import { useStockPolling } from "@/lib/useStockPolling";

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
  const state = !anyInStock ? "none" : available === 0 ? "variant" : available >= 5 ? "plenty" : "low";
  const colorClass = state === "plenty" ? "text-green-600" : state === "low" ? "text-amber-500" : "text-red-500";
  const dotClass = state === "plenty" ? "bg-green-500" : state === "low" ? "bg-amber-400 animate-pulse" : "bg-red-400";
  const label =
    state === "none"    ? "Není skladem" :
    state === "variant" ? "Tato varianta není skladem" :
    state === "plenty"  ? "Skladem" :
                          `Poslední ${available} ${available === 1 ? "kus" : "kusy"}`;
  return (
    <span key={state} className={`inline-flex items-center gap-1.5 text-[12px] font-semibold ${colorClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full inline-block ${dotClass}`} />
      <span>{label}</span>
    </span>
  );
}

// ── Color swatch ─────────────────────────────────────────────────────────────

function ColorSwatch({
  colors,
  selected,
  onChange,
}: {
  colors: { label: string; value: string; hex?: string }[];
  selected: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {colors.map((c) => {
        const hex = c.hex ?? COLOR_MAP[c.value] ?? "#cccccc";
        const bright = parseInt(hex.replace("#", ""), 16) > 0xbbbbbb;
        return (
          <button
            key={c.value}
            onClick={() => onChange(c.value)}
            title={c.label}
            className={`relative w-8 h-8 rounded-full transition-all duration-150 focus:outline-none ring-offset-2 ring-offset-white ${
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
}: {
  options: { label: string; value: string }[];
  selected: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-150 ${
            selected === opt.value
              ? "bg-primary text-dark border-primary"
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
        ? <Image src={poster} alt="" fill className="object-cover" />
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
}: {
  items: MediaItem[];
  layeredBody?: string;
  layeredCap?: string;
}) {
  const [active, setActive] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const itemKey = items.map(i => i.src).join("|");
  useEffect(() => { setActive(0); }, [itemKey]);

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
            <Image src={layeredBody} alt="" fill className="object-contain" priority />
            {layeredCap && <Image src={layeredCap} alt="" fill className="object-contain" />}
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
            alt=""
            fill
            className="object-contain"
            priority
          />
        ) : null}

        {/* Arrow nav */}
        {!layeredBody && items.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm border border-border shadow flex items-center justify-center text-text-muted hover:text-text-base transition-all z-10"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm border border-border shadow flex items-center justify-center text-text-muted hover:text-text-base transition-all z-10"
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
              className={`relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                i === active ? "border-primary" : "border-border hover:border-border-strong"
              }`}
            >
              {item.type === "video"
                ? <VideoThumb poster={item.poster} />
                : <Image src={item.src} alt="" fill className="object-contain" />
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
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Zavřít */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-text-subtle hover:text-text-base hover:bg-surface transition-all"
        >
          <X size={18} />
        </button>

        {/* Obsah */}
        <div className="p-8">
          {/* Produkt */}
          <div className="flex items-center gap-5 mb-8">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-surface border border-border shrink-0">
              <Image src={productImg} alt={productName} fill className="object-contain p-2" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Check size={11} strokeWidth={3} className="text-primary" />
                </div>
                <p className="text-base font-bold text-text-base">Přidali jste do košíku</p>
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
              ← Zpět do obchodu
            </button>
            <a
              href="/kosik"
              className="flex-1 py-3.5 rounded-2xl bg-primary text-dark font-bold text-sm text-center hover:brightness-105 active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
            >
              Pokračovat do košíku →
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Notify modal ──────────────────────────────────────────────────────────────

function NotifyModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Bell size={16} className="text-primary" />
            <p className="text-text-base font-semibold text-sm"><span>Připomenout, až bude skladem</span></p>
          </div>
          <button onClick={onClose} className="text-text-subtle hover:text-text-base transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Check size={22} className="text-green-600" />
              </div>
              <p className="text-text-base font-semibold text-sm"><span>Hotovo!</span></p>
              <p className="text-text-muted text-sm"><span>Jakmile bude zboží dostupné, dáme ti vědět.</span></p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2.5 rounded-xl bg-primary text-dark font-semibold text-sm hover:brightness-105 transition-all"
              >
                <span>Zavřít</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-text-muted text-sm"><span>Zadej svůj e-mail a my ti napíšeme, jakmile produkt naskladníme.</span></p>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && email.trim()) setSent(true); }}
                placeholder="tvuj@email.cz"
                autoFocus
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-text-base placeholder-text-subtle focus:outline-none focus:border-primary/50 transition-colors bg-surface"
              />
              <button
                onClick={() => { if (email.trim()) setSent(true); }}
                disabled={!email.trim()}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                  !email.trim()
                    ? "bg-border text-text-subtle cursor-not-allowed"
                    : "bg-primary text-dark hover:brightness-105"
                }`}
              >
                <span>Připomenout</span>
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
  const { addItem } = useCart();
  const { currency, mounted: currencyMounted } = useCurrency();
  const productAny = product as any;

  const newColors:  { label: string; value: string; hex?: string; img?: string }[] = productAny.colors  ?? [];
  const newSizes:   { label: string; value: string }[]                             = productAny.sizes   ?? [];
  const extraMedia: MediaItem[]                                                    = productAny.media   ?? [];
  const sizesLabel: string                                                         = productAny.sizesLabel ?? "Velikost";

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
  const basePrice  = getPrice(rawBasePrice as any, currency);
  const comboExtra = (isLayered && combo && bodyValue !== capValue)
    ? getPrice(rawComboExtra as any, currency)
    : 0;
  const totalPrice = basePrice + comboExtra;

  const basePriceCZK  = getPrice(rawBasePrice as any, CZK);
  const comboExtraCZK = (isLayered && combo && bodyValue !== capValue)
    ? getPrice(rawComboExtra as any, CZK)
    : 0;
  const totalPriceCZK = basePriceCZK + comboExtraCZK;

  const priceRawForCart = (isLayered && combo && bodyValue !== capValue && model?.comboExtra)
    ? (typeof rawBasePrice === "number"
        ? totalPriceCZK
        : Object.fromEntries(
            (["CZK", "EUR", "USD"] as const).map(c => [
              c,
              getPrice(rawBasePrice as any, CURRENCIES[c]) + getPrice(model!.comboExtra as any, CURRENCIES[c]),
            ])
          ))
    : rawBasePrice;

  const allLegacyVariantsSelected = !hasVariants ||
    product.variants!.every(v => selectedVariants[v.type]);

  const canAddToCart = hasModels
    ? true
    : hasVariants
      ? allLegacyVariantsSelected
      : true;

  const hasSheetData = Object.keys(stockData).length > 0;

  // Klíč(e) ve stejném formátu jako klíče Google Sheets skladu — "color|size".
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

  function resolveStock(data: Record<string, number>, keys: string | string[]): number {
    if (Array.isArray(keys)) {
      return Math.min(...keys.map(k => data[k] ?? 0));
    }
    return data[keys] ?? 0;
  }

  // Polling skladu ze Sheets — jednoduchý, bez Redis, bez rezervací
  const { stockData: liveStockData, loading: stockLoading } = useStockPolling(product.slug);

  // Aktuální sklad pro tuto variantu — po prvním pollu z live dat, jinak server prop
  const currentStock = (() => {
    if (!stockLoading && Object.keys(liveStockData).length > 0) {
      return resolveStock(liveStockData, stockKeys);
    }
    // Fallback na server-side prop dokud polling nenačte
    if (hasSheetData) {
      return resolveStock(stockData, stockKeys);
    }
    return product.inStock ? product.stock : 0;
  })();

  const availableQty = currentStock;
  const canAddMoreQty = currentStock;
  const isOutOfStock = currentStock === 0;

  // Když se změní varianta a nový sklad je nižší než qty, ořízni qty
  useEffect(() => {
    if (canAddMoreQty > 0 && qty > canAddMoreQty) {
      setQty(canAddMoreQty);
    } else if (canAddMoreQty === 0 && !isOutOfStock) {
      setQty(1);
    }
  }, [canAddMoreQty, isOutOfStock]); // eslint-disable-line react-hooks/exhaustive-deps

  const anyInStock = hasSheetData
    ? Object.values(stockData).some(v => v > 0)
    : product.inStock && product.stock > 0;

  const selectedColorObj = newColors.find(c => c.value === colorValue);
  const mainImgSrc = selectedColorObj?.img ?? product.img;

  const legacyColorObj  = model?.colors.find(c => c.value === legacyColor);
  const legacyImgSrc    = legacyColorObj && !isLayeredColor(legacyColorObj as any)
    ? (legacyColorObj as ModelColor).img
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

    // Přidáme qty kusů do košíku, maxQuantity = currentStock jako ochrana
    for (let i = 0; i < qty; i++) {
      addItem({
        slug: product.slug,
        name: product.name,
        priceCZK: totalPriceCZK,
        priceRaw: priceRawForCart as any,
        img: imgForCart,
        variants: Object.keys(variantInfo).length > 0 ? variantInfo : undefined,
        stockKey: stockKeys, // přesný klíč (nebo dva u vrstvených barev) pro lookup skladu v košíku
      }, currentStock);
    }
    setAdded(true);
  }


  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {added && <AddedModal productName={product.name} productImg={mainImgSrc} onClose={() => { setAdded(false); setQty(1); }} />}
      {notifyOpen && <NotifyModal onClose={() => setNotifyOpen(false)} />}

      <main className="min-h-screen bg-surface">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12 py-6 lg:py-10">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-text-subtle mb-5 lg:mb-8 flex-wrap">
            <a href="/" className="hover:text-text-muted transition-colors"><span>Domů</span></a>
            <ChevronRight size={11} className="text-border" />
            {product.categories[0] && (
              <>
                <a href={`/kategorie/${product.categories[0]}`} className="hover:text-text-muted transition-colors capitalize">
                  <span>{product.categories[0].replace(/-/g, " ")}</span>
                </a>
                <ChevronRight size={11} className="text-border" />
              </>
            )}
            <span className="text-text-muted line-clamp-1">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-16 mb-16 lg:mb-24">

            {/* ── Gallery — sticky on desktop ── */}
            <div className="lg:sticky lg:top-6 lg:self-start">
              <Gallery
                items={galleryItems}
                layeredBody={layeredBodySrc}
                layeredCap={layeredCapSrc}
              />
            </div>

            {/* ── Info panel ── */}
            <div className="flex flex-col gap-5">

              {/* Name + price + stock */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-text-base leading-tight tracking-tight">
                  <span>{product.name}</span>
                </h1>
                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  <span className="text-3xl sm:text-4xl font-extrabold text-primary leading-none">
                    {currencyMounted ? formatPrice(totalPrice, currency) : <span className="opacity-0">—</span>}
                  </span>
                  {comboExtra > 0 && (
                    <span className="text-xs text-text-subtle">
                      <span>({formatPrice(basePrice, currency)} + {formatPrice(comboExtra, currency)} za různé barvy)</span>
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
                    <span>Barva</span>
                    <span className="text-text-muted font-normal ml-2">
                      — <span>{newColors.find(c => c.value === colorValue)?.label}</span>
                    </span>
                  </p>
                  <ColorSwatch colors={newColors} selected={colorValue} onChange={(v) => { setColorValue(v); setQty(1); }} />
                </div>
              )}

              {/* ── NEW: size / type pills ── */}
              {hasNewSizes && (
                <div>
                  <p className="text-text-base font-semibold text-sm mb-3">
                    <span>{sizesLabel}</span>
                    <span className="text-text-muted font-normal ml-2">
                      — <span>{newSizes.find(s => s.value === sizeValue)?.label}</span>
                    </span>
                  </p>
                  <SizePills options={newSizes} selected={sizeValue} onChange={(v) => { setSizeValue(v); setQty(1); }} />
                </div>
              )}

              {/* ── LEGACY: models (pencil) ── */}
              {hasModels && model && (
                <>
                  {!combo && model.colors.length > 0 && (
                    <div>
                      <p className="text-text-base font-semibold text-sm mb-3">
                        <span>Barva</span>
                        <span className="text-text-muted font-normal ml-2">
                          — <span>{model.colors.find(c => c.value === legacyColor)?.label}</span>
                        </span>
                      </p>
                      <ColorSwatch
                        colors={model.colors as { label: string; value: string; hex?: string }[]}
                        selected={legacyColor}
                        onChange={(v) => { setLegacyColor(v); setQty(1); }}
                      />
                    </div>
                  )}
                  {product.models!.length > 1 && (
                    <div>
                      <p className="text-text-base font-semibold text-sm mb-3"><span>Model</span></p>
                      <SizePills
                        options={product.models!.map(m => ({ label: m.label, value: m.id }))}
                        selected={modelId}
                        onChange={(v) => { handleModelChange(v); setQty(1); }}
                      />
                    </div>
                  )}
                  {isLayered && (
                    <div className="flex flex-col gap-4">
                      <button
                        onClick={() => setCombo(v => !v)}
                        className="flex items-center gap-3 text-sm text-text-muted hover:text-text-base transition-colors w-fit"
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-150 ${
                          combo ? "bg-primary border-primary" : "border-border-strong"
                        }`}>
                          {combo && <Check size={11} strokeWidth={3} className="text-dark" />}
                        </div>
                        <span>Vlastní barevná kombinace</span>
                        <span className="text-text-subtle text-xs">
                          <span>(+{formatPrice(getPrice(model.comboExtra ?? 0, currency), currency)} za různé barvy)</span>
                        </span>
                      </button>
                      {combo && (
                        <div className="flex flex-col gap-4 pl-8 border-l-2 border-primary/20">
                          <div>
                            <p className="text-text-base font-semibold text-sm mb-2">
                              <span>Barva těla</span>
                              <span className="text-text-muted font-normal ml-2">
                                — <span>{model.colors.find(c => c.value === bodyValue)?.label}</span>
                              </span>
                            </p>
                            <ColorSwatch
                              colors={model.colors as { label: string; value: string; hex?: string }[]}
                              selected={bodyValue}
                              onChange={setBodyValue}
                            />
                          </div>
                          <div>
                            <p className="text-text-base font-semibold text-sm mb-2">
                              <span>Barva hlavičky</span>
                              <span className="text-text-muted font-normal ml-2">
                                — <span>{model.colors.find(c => c.value === capValue)?.label}</span>
                              </span>
                            </p>
                            <ColorSwatch
                              colors={model.colors as { label: string; value: string; hex?: string }[]}
                              selected={capValue}
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
                      <span>{variant.type}</span>
                      {selected && (
                        <span className="text-text-muted font-normal ml-2">
                          — <span>{variant.options.find(o => o.value === selected)?.label}</span>
                        </span>
                      )}
                    </p>
                    {isColorVariant ? (
                      <ColorSwatch
                        colors={variant.options}
                        selected={selected ?? ""}
                        onChange={(val) => setSelectedVariants(prev => ({ ...prev, [variant.type]: val }))}
                      />
                    ) : (
                      <SizePills
                        options={variant.options}
                        selected={selected ?? ""}
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
                      <Bell size={16} />
                      <span>Připomenout, až bude skladem</span>
                    </button>
                  ) : (
                    <div className="flex items-stretch gap-2.5">
                      {/* Počítadlo */}
                      <div className="flex items-center rounded-xl border border-border bg-white overflow-hidden shrink-0">
                        <button
                          onClick={() => setQty(q => Math.max(1, q - 1))}
                          className="w-10 h-full flex items-center justify-center text-text-muted hover:text-text-base hover:bg-surface transition-colors text-base font-light"
                        >
                          −
                        </button>
                        <span className="w-7 text-center text-text-base text-sm font-semibold tabular-nums select-none">
                          {qty}
                        </span>
                        <button
                          onClick={() => setQty(q => Math.min(canAddMoreQty, q + 1))}
                          disabled={qty >= canAddMoreQty}
                          className={`w-10 h-full flex items-center justify-center transition-colors text-base font-light ${
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
                            ? "bg-primary/15 text-primary cursor-default"
                            : !canAddToCart
                            ? "bg-border text-text-subtle cursor-not-allowed"
                            : "bg-primary text-dark hover:brightness-105 active:scale-[0.98] shadow-md shadow-primary/20"
                        }`}
                      >
                        {added
                          ? <><Check size={15} /><span>Přidáno</span></>
                          : <><ShoppingCart size={15} /><span>{!canAddToCart ? "Vyberte variantu" : "Přidat do košíku"}</span></>
                        }
                      </button>
                    </div>
                  )}

                  {!canAddToCart && !isOutOfStock && hasVariants && (
                    <p className="text-text-subtle text-xs text-center mt-2">
                      <span>Prosím vyberte {product.variants!.filter(v => !selectedVariants[v.type]).map(v => v.type).join(" a ")}</span>
                    </p>
                  )}
                </div>

                {/* Trust bar */}
                <div className="border-t border-border grid grid-cols-3">
                  {[
                    { icon: Package,     label: "Expedice",  sub: "do 24 hodin" },
                    { icon: RefreshCw,   label: "Vrácení",   sub: "do 30 dní" },
                    { icon: ShieldCheck, label: "Záruka",    sub: "2 roky" },
                  ].map((item, i) => (
                    <div key={item.label} className={`flex flex-col items-center justify-center gap-1.5 py-4 px-2 ${i < 2 ? "border-r border-border" : ""}`}>
                      <item.icon size={20} className="text-primary" />
                      <span className="text-text-base text-xs font-bold leading-none">{item.label}</span>
                      <span className="text-text-subtle text-[11px] leading-none">{item.sub}</span>
                    </div>
                  ))}
                </div>

              </div>

              {/* ── Description ── */}
              <div className="pt-1 border-t border-border">
                <p className="text-text-base font-semibold text-sm mb-2"><span>Popis produktu</span></p>
                <p className="text-text-muted text-sm leading-relaxed"><span>{product.description}</span></p>
              </div>

            </div>
          </div>

          {/* ── Related products ── */}
          {related.length > 0 && (
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-text-base mb-5"><span>Související produkty</span></h2>
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
                        alt={p.name}
                        fill
                        className="object-contain p-4 transition-transform duration-300 group-hover:scale-[1.04]"
                      />
                    </div>
                    <div className="flex flex-col gap-1 p-3 sm:p-4 border-t border-border">
                      <p className="text-text-base text-xs sm:text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2"><span>{p.name}</span></p>
                      <p className="text-primary font-bold text-sm sm:text-base mt-0.5"><span>{formatPrice(getPrice(p.price, currency), currency)}</span></p>
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