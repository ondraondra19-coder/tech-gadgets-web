"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  getProductBySlug,
  isBundle,
  type Product,
  type PriceValue,
} from "@/lib/products";
import { formatPrice } from "@/lib/currency";
import ProductOrderPanel from "./ProductOrderPanel";

// Sjednotí PriceValue (může to být holé číslo NEBO objekt {CZK,EUR,USD})
// do plného objektu, ať se s tím v editoru pracuje jednotně.
function normalizePrice(price: PriceValue): { CZK: number; EUR?: number; USD?: number } {
  if (typeof price === "number") return { CZK: price };
  return { CZK: price.CZK, EUR: price.EUR, USD: price.USD };
}

function priceEquals(a: { CZK: number; EUR?: number; USD?: number }, b: { CZK: number; EUR?: number; USD?: number }): boolean {
  return a.CZK === b.CZK && (a.EUR ?? null) === (b.EUR ?? null) && (a.USD ?? null) === (b.USD ?? null);
}

type ProductsAdminListProps = {
  products: Product[];
  stock: Record<string, number>;
  // Slevy: klíč "slug" nebo "slug::modelId" → procento slevy. Z něj + základní
  // ceny se v editoru dopočítá zlevněná cena, kterou admin může přímo přepsat.
  discounts: Record<string, number>;
  initialQuery?: string;
};

// Z procenta slevy a základní CZK ceny dopočítá zlevněnou cenu (zaokrouhlenou
// na celé koruny). 0 = bez slevy.
function saleFromPercent(baseCZK: number, percent: number | undefined): number {
  if (!percent || percent < 1 || baseCZK <= 0) return 0;
  return Math.max(0, Math.round(baseCZK * (1 - percent / 100)));
}

// Z původní a zlevněné CZK ceny dopočítá procento slevy. <= 0 nebo >= základ
// znamená „bez slevy" (0).
function percentFromSale(baseCZK: number, saleCZK: number): number {
  if (saleCZK <= 0 || baseCZK <= 0 || saleCZK >= baseCZK) return 0;
  return (1 - saleCZK / baseCZK) * 100;
}

export default function ProductsAdminList({ products, stock, discounts, initialQuery }: ProductsAdminListProps) {
  // Každý produkt = jedna skladová položka pod klíčem = jeho slug (viz lib/stock.ts).
  const buildInitialStock = () => {
    const initial: Record<string, number> = {};
    products.forEach((p) => {
      initial[p.slug] = stock[p.slug] ?? 0;
    });
    return initial;
  };

  const [currentStock, setCurrentStock] = useState<Record<string, number>>(buildInitialStock);
  // Poslední potvrzený (uložený) stav — proti tomuhle se porovnává, jestli je varianta "změněná".
  const [savedStock, setSavedStock] = useState<Record<string, number>>(buildInitialStock);

  // Ceny — klíč je slug produktu.
  const buildInitialPrices = () => {
    const initial: Record<string, { CZK: number; EUR?: number; USD?: number }> = {};
    products.forEach((p) => {
      initial[p.slug] = normalizePrice(p.price);
    });
    return initial;
  };

  const [currentPrices, setCurrentPrices] = useState(buildInitialPrices);
  const [savedPrices, setSavedPrices] = useState(buildInitialPrices);

  // Zlevněné ceny (CZK) — stejný klíč jako ceny. 0 = bez slevy. Init z předaných
  // procent slev + základní CZK ceny.
  const buildInitialSale = () => {
    const initial: Record<string, number> = {};
    products.forEach((p) => {
      initial[p.slug] = saleFromPercent(normalizePrice(p.price).CZK, discounts[p.slug]);
    });
    return initial;
  };

  const [currentSale, setCurrentSale] = useState<Record<string, number>>(buildInitialSale);
  const [savedSale, setSavedSale] = useState<Record<string, number>>(buildInitialSale);

  const [savingAll, setSavingAll] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialQuery ?? "");
  // Rozbalené sety — u kterých slugů je vidět rozpad na komponenty.
  const [expandedSets, setExpandedSets] = useState<Record<string, boolean>>({});
  // Sbalitelný panel „Doporučené pořadí produktů".
  const [orderOpen, setOrderOpen] = useState(false);

  const toggleSet = (slug: string) =>
    setExpandedSets((prev) => ({ ...prev, [slug]: !prev[slug] }));

  const changedStockKeys = Object.keys(currentStock).filter((k) => currentStock[k] !== savedStock[k]);
  const changedPriceKeys = Object.keys(currentPrices).filter((k) => !priceEquals(currentPrices[k], savedPrices[k]));
  const changedSaleKeys = Object.keys(currentSale).filter((k) => (currentSale[k] ?? 0) !== (savedSale[k] ?? 0));
  const changedCount = changedStockKeys.length + changedPriceKeys.length + changedSaleKeys.length;

  const handleStockChange = (key: string, value: number) => {
    setCurrentStock((prev) => ({
      ...prev,
      [key]: Math.max(0, value),
    }));
  };

  // ── Modal pro ceny ve všech měnách ──────────────────────────────────────
  // Katalog má u většiny produktů jen CZK. Kliknutím na cenu se otevře okno,
  // kde jde doplnit EUR/USD i zlevněnou cenu. Modal edituje jen svůj DRAFT;
  // teprve „Hotovo" ho zapíše do rozpracovaných změn (uloží se přes spodní lištu).
  const [priceModal, setPriceModal] = useState<{ key: string; label: string } | null>(null);
  const [draft, setDraft] = useState<{ CZK: string; EUR: string; USD: string; sale: string }>({
    CZK: "",
    EUR: "",
    USD: "",
    sale: "",
  });
  const [modalError, setModalError] = useState<string | null>(null);

  const openPriceModal = (key: string, label: string) => {
    const p = currentPrices[key] ?? { CZK: 0 };
    setDraft({
      CZK: p.CZK ? String(p.CZK) : "",
      EUR: p.EUR !== undefined ? String(p.EUR) : "",
      USD: p.USD !== undefined ? String(p.USD) : "",
      sale: currentSale[key] ? String(currentSale[key]) : "",
    });
    setModalError(null);
    setPriceModal({ key, label });
  };

  const applyPriceModal = () => {
    if (!priceModal) return;
    const czk = parseFloat(draft.CZK) || 0;
    if (czk <= 0) {
      setModalError("Cena v CZK musí být kladné číslo.");
      return;
    }
    const eur = draft.EUR.trim() === "" ? undefined : Math.max(0, parseFloat(draft.EUR) || 0);
    const usd = draft.USD.trim() === "" ? undefined : Math.max(0, parseFloat(draft.USD) || 0);
    const priceObj: { CZK: number; EUR?: number; USD?: number } = { CZK: czk };
    if (eur !== undefined) priceObj.EUR = eur;
    if (usd !== undefined) priceObj.USD = usd;
    setCurrentPrices((prev) => ({ ...prev, [priceModal.key]: priceObj }));
    setCurrentSale((prev) => ({ ...prev, [priceModal.key]: Math.max(0, parseFloat(draft.sale) || 0) }));
    setPriceModal(null);
  };

  // Uloží VŠECHNY změněné varianty i ceny napříč všemi produkty najednou.
  const handleSaveAll = async () => {
    if (changedCount === 0) return;
    setSavingAll(true);
    setSaveError(null);
    try {
      const requests: Promise<Response>[] = [];

      if (changedStockKeys.length > 0) {
        const entries = changedStockKeys.map((slug) => ({ slug, value: currentStock[slug] }));
        requests.push(
          fetch("/api/admin/stock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ entries }),
          }),
        );
      }

      if (changedPriceKeys.length > 0) {
        const entries = changedPriceKeys.map((slug) => ({ slug, price: currentPrices[slug] }));
        requests.push(
          fetch("/api/admin/prices", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ entries }),
          }),
        );
      }

      if (changedSaleKeys.length > 0) {
        // Zlevněnou cenu (CZK) převedeme na procento z aktuální základní ceny.
        // 0 / >= základ = sleva se zruší (percent 0 → server smaže).
        const entries = changedSaleKeys.map((slug) => {
          const baseCZK = currentPrices[slug]?.CZK ?? 0;
          const percent = percentFromSale(baseCZK, currentSale[slug] ?? 0);
          return { slug, percent };
        });
        requests.push(
          fetch("/api/admin/product-discounts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ entries }),
          }),
        );
      }

      const results = await Promise.all(requests);
      for (const res of results) {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Uložení se nezdařilo.");
        }
      }

      setSavedStock((prev) => ({ ...prev, ...currentStock }));
      setSavedPrices((prev) => ({ ...prev, ...currentPrices }));
      setSavedSale((prev) => ({ ...prev, ...currentSale }));
    } catch (error) {
      console.error("Chyba při ukládání:", error);
      setSaveError(error instanceof Error ? error.message : "Uložení se nezdařilo.");
    } finally {
      setSavingAll(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    return (
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const renderStockControls = (slug: string) => {
    const currentQty = currentStock[slug] ?? 0;
    const hasChanged = currentQty !== (savedStock[slug] ?? 0);

    // Sklad setu se needituje — dopočítává se z komponent (lib/stock.ts).
    // Ukazujeme ho jen pro čtení, ať je vidět, kolik setů zrovna jde složit;
    // server by zápis stejně zahodil a editovatelné pole by jen mátlo.
    const product = getProductBySlug(slug);
    if (product && isBundle(product)) {
      const parts = product.bundle!.map((b) => `${b.quantity}× ${b.slug}`).join(" + ");
      return (
        <div className="flex items-center space-x-4" onClick={(e) => e.stopPropagation()}>
          <div
            title={`Dopočítáno ze skladu komponent: ${parts}`}
            className="flex items-center gap-1.5 border border-dashed border-zinc-300 rounded-lg px-2.5 py-1 bg-zinc-50"
          >
            <span className="text-xs font-bold font-mono text-zinc-700">{currentQty}</span>
            <span className="text-[10px] text-zinc-400 font-medium">ze setu</span>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-4" onClick={(e) => e.stopPropagation()}>
        <div
          className={`flex items-center border rounded-lg p-0.5 w-24 justify-between transition-colors ${
            hasChanged ? "bg-zinc-200 border-zinc-400" : "bg-[#f1f1f1] border-[#e5e7eb]"
          }`}
        >
          <button
            type="button"
            onClick={() => handleStockChange(slug, currentQty - 1)}
            className="w-5 h-5 rounded bg-white flex items-center justify-center text-[10px] font-bold text-zinc-600 hover:bg-zinc-100 shadow-sm active:scale-95 transition-all"
          >
            –
          </button>
          <input
            type="number"
            value={currentQty}
            onChange={(e) => handleStockChange(slug, parseInt(e.target.value) || 0)}
            className="w-8 bg-transparent text-center text-xs font-bold font-mono focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={() => handleStockChange(slug, currentQty + 1)}
            className="w-5 h-5 rounded bg-white flex items-center justify-center text-[10px] font-bold text-zinc-600 hover:bg-zinc-100 shadow-sm active:scale-95 transition-all"
          >
            +
          </button>
        </div>
      </div>
    );
  };

  // Buňka ceny v tabulce — jen souhrn (CZK + které měny jsou nastavené + sleva).
  // Kliknutím se otevře modal s poli pro všechny měny.
  const renderPriceCell = (priceKey: string, label: string) => {
    const current = currentPrices[priceKey] ?? { CZK: 0 };
    const saved = savedPrices[priceKey] ?? { CZK: 0 };
    const hasChanged = !priceEquals(current, saved) || (currentSale[priceKey] ?? 0) !== (savedSale[priceKey] ?? 0);

    const saleCZK = currentSale[priceKey] ?? 0;
    const salePercent = Math.round(percentFromSale(current.CZK ?? 0, saleCZK));
    const saleActive = salePercent >= 1;

    const extras = [
      current.EUR !== undefined ? `€ ${current.EUR}` : null,
      current.USD !== undefined ? `$ ${current.USD}` : null,
    ].filter(Boolean);

    return (
      <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => openPriceModal(priceKey, label)}
          title="Upravit ceny ve všech měnách"
          className={`flex flex-col items-end gap-0.5 rounded-lg px-2.5 py-1.5 border transition-colors ${
            hasChanged ? "bg-zinc-200 border-zinc-400" : "border-transparent hover:bg-zinc-100"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span className="text-xs font-bold font-mono text-[#0f0f10]">{formatPrice(current.CZK ?? 0)}</span>
            {saleActive && <span className="text-[10px] font-bold font-mono text-rose-600">−{salePercent} %</span>}
            {hasChanged && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
          </span>
          <span className="text-[10px] font-mono text-zinc-400">
            {extras.length > 0 ? extras.join(" · ") : "jen CZK — klikni pro víc měn"}
          </span>
        </button>
      </div>
    );
  };

  // Rozpad setu na komponenty + ekonomika balíčku. Všechno se počítá z živých
  // (editovaných) cen a skladu, takže se panel přepočítá hned, jak admin něco
  // změní v jiném řádku. Vše v CZK — admin edituje primárně koruny.
  const renderBundleBreakdown = (product: Product) => {
    const items = (product.bundle ?? []).map((part) => {
      const comp = getProductBySlug(part.slug);
      const unit = currentPrices[part.slug]?.CZK ?? 0;
      const compStock = currentStock[part.slug] ?? 0;
      const perSet = Math.max(1, Math.floor(part.quantity));
      return {
        part,
        comp,
        unit,
        lineTotal: unit * part.quantity,
        compStock,
        setsFromThis: Math.floor(compStock / perSet),
      };
    });

    const sumOfParts = items.reduce((s, i) => s + i.lineTotal, 0);
    const bundlePrice = currentPrices[product.slug]?.CZK ?? 0;
    const savings = sumOfParts - bundlePrice;
    const savingsPct = sumOfParts > 0 ? Math.round((savings / sumOfParts) * 100) : 0;
    const setStock = items.length ? Math.min(...items.map((i) => i.setsFromThis)) : 0;

    return (
      <div className="rounded-xl border border-[#e5e7eb] bg-[#fcfbf9] p-4 space-y-3">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-zinc-400 font-mono">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          Obsah setu · {items.length} {items.length === 1 ? "položka" : items.length >= 2 && items.length <= 4 ? "položky" : "položek"}
        </div>

        <div className="divide-y divide-[#e5e7eb]/70">
          {items.map(({ part, comp, unit, lineTotal, compStock, setsFromThis }) => {
            const isBottleneck = setsFromThis === setStock;
            return (
              <div key={part.slug} className="flex items-center gap-3 py-2">
                <div className="w-8 h-8 rounded-md bg-[#f1f1f3] border border-[#e5e7eb] overflow-hidden flex-shrink-0 relative">
                  {comp && <Image src={comp.img} alt={comp.name} fill className="object-cover" unoptimized />}
                </div>
                <span className="text-[11px] font-bold font-mono text-zinc-500 w-8 flex-shrink-0">{part.quantity}×</span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-[#0f0f10] truncate">{comp?.name ?? part.slug}</div>
                  <button
                    type="button"
                    onClick={() => setSearchQuery(part.slug)}
                    className="text-[10px] font-mono text-zinc-400 hover:text-zinc-700 hover:underline truncate"
                    title="Vyfiltrovat komponentu v seznamu"
                  >
                    {part.slug}
                  </button>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[11px] font-mono text-zinc-400">{formatPrice(unit)} / ks</div>
                  <div className="text-xs font-bold font-mono text-[#0f0f10]">{formatPrice(lineTotal)}</div>
                </div>
                <div
                  className={`text-right flex-shrink-0 w-24 ${isBottleneck ? "text-amber-700" : "text-zinc-400"}`}
                  title={isBottleneck ? "Tahle komponenta limituje, kolik setů jde složit" : undefined}
                >
                  <div className="text-[11px] font-mono">{compStock} skladem</div>
                  <div className="text-[10px] font-mono">
                    = {setsFromThis} {setsFromThis === 1 ? "set" : "setů"}
                    {isBottleneck && items.length > 1 && " ⚠"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[#e5e7eb] pt-3 text-xs">
          <div>
            <span className="text-zinc-400 font-mono text-[10px] uppercase tracking-wider block">Po kusech</span>
            <span className="font-bold font-mono text-zinc-500 line-through">{formatPrice(sumOfParts)}</span>
          </div>
          <div>
            <span className="text-zinc-400 font-mono text-[10px] uppercase tracking-wider block">Cena setu</span>
            <span className="font-bold font-mono text-[#0f0f10]">{formatPrice(bundlePrice)}</span>
          </div>
          <div>
            <span className="text-zinc-400 font-mono text-[10px] uppercase tracking-wider block">Úspora</span>
            <span className={`font-bold font-mono ${savings > 0 ? "text-emerald-600" : savings < 0 ? "text-rose-600" : "text-zinc-500"}`}>
              {savings > 0 ? "−" : savings < 0 ? "+" : ""}
              {formatPrice(Math.abs(savings))}
              {sumOfParts > 0 && <span className="ml-1 text-[10px]">({savings >= 0 ? "−" : "+"}{Math.abs(savingsPct)} %)</span>}
            </span>
          </div>
          <div className="ml-auto text-right">
            <span className="text-zinc-400 font-mono text-[10px] uppercase tracking-wider block">Skladem</span>
            <span className="font-bold font-mono text-[#0f0f10]">{setStock} {setStock === 1 ? "set" : "setů"}</span>
          </div>
        </div>

        {savings < 0 && (
          <div className="text-[11px] font-mono text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-1.5">
            Pozor: set je dražší než součet komponent po kusech.
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Doporučené pořadí produktů (sbalitelné) ── */}
      <div className="rounded-2xl border border-[#e5e7eb] bg-white overflow-hidden">
        <button
          type="button"
          onClick={() => setOrderOpen((v) => !v)}
          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#fcfbf9] transition-colors"
        >
          <svg
            className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${orderOpen ? "rotate-90" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-xs font-bold text-[#0f0f10]">Doporučené pořadí produktů</span>
          <span className="ml-auto text-[10px] font-mono text-zinc-400">homepage i kategorie</span>
        </button>
        {orderOpen && (
          <div className="px-4 pb-4 pt-1 border-t border-[#e5e7eb]">
            <ProductOrderPanel products={products} />
          </div>
        )}
      </div>

      {/* Plovoucí lišta — "fixed" (ne "sticky"), takže nepatří do normálního toku stránky
          a její objevení/zmizení nezpůsobí posun zbytku obsahu. Zůstává viditelná a klikatelná
          i po scrollu, protože je ukotvená k viewportu, ne ke kontejneru seznamu. */}
      {changedCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-[calc(100vw-2rem)] bg-[#1c1c1c] text-white rounded-3xl sm:rounded-full pl-5 pr-2 py-2 shadow-2xl">
          <span className="text-xs font-semibold whitespace-nowrap">
            {changedCount} {changedCount === 1 ? "neuložená změna" : changedCount >= 2 && changedCount <= 4 ? "neuložené změny" : "neuložených změn"}
          </span>
          {saveError && <span className="text-[11px] text-rose-300">{saveError}</span>}
          <button
            type="button"
            disabled={savingAll}
            onClick={handleSaveAll}
            className="px-4 py-2 rounded-full text-[11px] font-bold bg-white text-[#0f0f10] hover:bg-zinc-200 disabled:opacity-60 transition-all whitespace-nowrap"
          >
            {savingAll ? "Ukládám…" : "Uložit všechny změny"}
          </button>
        </div>
      )}

      <div className="flex gap-4 justify-between items-center border-b border-[#e5e7eb] pb-5">
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Hledat produkt podle názvu nebo slugu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#f1f1f3] border border-[#e5e7eb] rounded-xl pl-9 pr-4 py-2 text-xs text-[#0f0f10] placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white transition-all"
          />
        </div>
        <div className="text-[11px] font-mono text-zinc-400 hidden sm:block">
          Nalezeno produktů: {filteredProducts.length}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#e5e7eb] text-[10px] uppercase tracking-wider font-bold text-zinc-400 font-mono">
              <th className="pb-3 pl-2">Produkt</th>
              <th className="pb-3 text-right">Cena / sleva</th>
              <th className="pb-3 text-right pr-2 w-40">Skladem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]/60">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-xs text-zinc-400 font-mono">
                  Žádné produkty neodpovídají vyhledávání.
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => {
                // Katalog praků nemá barvy, velikosti ani modely — každý produkt
                // je jediná skladová položka pod klíčem = jeho slug, takže se cena
                // i sklad edituje rovnou v řádku a nic se nerozklikává.
                const qty = currentStock[product.slug] ?? 0;

                const bundle = isBundle(product);
                const expanded = bundle && expandedSets[product.slug];

                return (
                  <React.Fragment key={product.slug}>
                    <tr className="group hover:bg-[#fcfbf9]/60 transition-colors">
                      <td className="py-3 pl-2">
                        <div className="flex items-center space-x-3">
                          {/* Rozklikávací šipka jen u setů; ostatní řádky dostanou
                              stejně široký prázdný slot, ať jsou obrázky zarovnané. */}
                          {bundle ? (
                            <button
                              type="button"
                              onClick={() => toggleSet(product.slug)}
                              aria-label={expanded ? "Sbalit set" : "Rozbalit set"}
                              className="w-4 h-4 flex-shrink-0 flex items-center justify-center text-zinc-400 hover:text-zinc-800 transition-colors"
                            >
                              <svg
                                className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-90" : ""}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.5}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          ) : (
                            <span className="w-4 flex-shrink-0" />
                          )}
                          <div className="w-10 h-10 rounded-lg bg-[#f1f1f3] border border-[#e5e7eb] overflow-hidden flex-shrink-0 relative">
                            <Image src={product.img} alt={product.name} fill className="object-cover" unoptimized />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-bold text-[#0f0f10] leading-tight truncate">
                                {product.name}
                              </h4>
                              {bundle && (
                                <span className="text-[8px] font-bold font-mono px-1 py-0.5 rounded bg-zinc-800 text-white uppercase tracking-wider flex-shrink-0">
                                  Set
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-zinc-400 block mt-0.5 truncate">
                              {product.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3">
                        {renderPriceCell(product.slug, product.name)}
                      </td>

                      <td className="py-3 pr-2">
                        <div className="flex items-center justify-end gap-2">
                          {qty === 0 && (
                            <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 uppercase tracking-wider">
                              Vyprodáno
                            </span>
                          )}
                          {renderStockControls(product.slug)}
                        </div>
                      </td>
                    </tr>

                    {expanded && (
                      <tr className="bg-[#fcfbf9]/60">
                        <td colSpan={3} className="px-2 pb-4 pt-0">
                          {renderBundleBreakdown(product)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal: ceny ve všech měnách ── */}
      {priceModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPriceModal(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-[#e5e7eb] p-5">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-[#0f0f10]">Ceny ve všech měnách</h3>
              <p className="text-[11px] font-mono text-zinc-400 truncate">{priceModal.label}</p>
            </div>

            <div className="space-y-3">
              {([
                { code: "CZK" as const, symbol: "Kč", label: "Česká koruna", required: true },
                { code: "EUR" as const, symbol: "€", label: "Euro", required: false },
                { code: "USD" as const, symbol: "$", label: "Americký dolar", required: false },
              ]).map(({ code, symbol, label, required }) => (
                <label key={code} className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-zinc-600">
                    {label} {required && <span className="text-rose-500">*</span>}
                  </span>
                  <span className="flex items-center border rounded-lg px-2 py-1 bg-[#f1f1f3] border-[#e5e7eb] focus-within:border-zinc-400 focus-within:bg-white transition-colors">
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={draft[code]}
                      onChange={(e) => setDraft((d) => ({ ...d, [code]: e.target.value }))}
                      placeholder={required ? "0" : "—"}
                      className="w-24 bg-transparent text-right text-sm font-bold font-mono focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-[11px] font-mono text-zinc-400 ml-1 w-4 text-center">{symbol}</span>
                  </span>
                </label>
              ))}

              {/* Zlevněná cena (CZK) — procento se dopočítá a při uložení aplikuje na EUR/USD */}
              <div className="pt-3 mt-1 border-t border-[#e5e7eb]">
                <label className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-rose-500">Zlevněná cena (CZK)</span>
                  <span className="flex items-center border rounded-lg px-2 py-1 bg-rose-50 border-rose-200 focus-within:border-rose-300 transition-colors">
                    <input
                      type="number"
                      step="1"
                      min={0}
                      value={draft.sale}
                      onChange={(e) => setDraft((d) => ({ ...d, sale: e.target.value }))}
                      placeholder="—"
                      className="w-24 bg-transparent text-right text-sm font-bold font-mono text-rose-700 placeholder-zinc-300 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-[11px] font-mono text-rose-300 ml-1 w-4 text-center">Kč</span>
                  </span>
                </label>
                {(() => {
                  const base = parseFloat(draft.CZK) || 0;
                  const sale = parseFloat(draft.sale) || 0;
                  const pct = Math.round(percentFromSale(base, sale));
                  return (
                    <p className={`text-[10px] font-mono text-right mt-1 ${pct >= 1 ? "text-rose-600" : "text-zinc-300"}`}>
                      {pct >= 1 ? `Sleva −${pct} % (EUR/USD se dopočítají)` : "Bez slevy"}
                    </p>
                  );
                })()}
              </div>
            </div>

            {modalError && <p className="text-[11px] text-rose-600 mt-3">{modalError}</p>}

            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setPriceModal(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-500 hover:bg-zinc-100 transition-colors"
              >
                Zrušit
              </button>
              <button
                type="button"
                onClick={applyPriceModal}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#0f0f10] text-white hover:bg-zinc-800 transition-colors"
              >
                Hotovo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}