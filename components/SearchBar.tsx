"use client";

import { useState, useRef, useEffect, useCallback, useMemo, useId } from "react";
import Fuse from "fuse.js";
import { Search, X, ArrowUpRight } from "lucide-react";
import { products as staticProducts } from "@/lib/products";
import { useCurrency } from "@/lib/CurrencyContext";
import { formatPrice, getPrice } from "@/lib/currency";
import Image from "next/image";
import { useT } from "@/lib/useT";
import { useLang } from "@/lib/LangContext";
import { getProductName, getCategoryName, categories } from "@/lib/products";
import type { Locale } from "@/lib/locale";

type SearchResult = typeof staticProducts[0] & { score: number };

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const SEARCH_SYNONYMS: Record<string, string> = {
  "case": "pouzdro",
  "cover": "pouzdro kryt",
  "silicone": "silikonove silikon",
  "silicon": "silikonove silikon",
  "pencil": "pencil",
  "watch": "watch",
  "strap": "reminek",
  "band": "reminek",
  "tips": "hroty koncovky",
  "tip": "hrot",
  "nib": "hrot",
  "cleaning": "cisteni cisticí",
  "cleaner": "cistic cisticí",
  "screen": "displej obrazovka",
  "display": "displej",
  "wallet": "penezenka",
  "organizer": "organizer",
  "cable": "kabel",
  "dust": "prachovka prach",
  "plug": "prachovka krytka",
  "webcam": "webkamera",
  "camera": "kamera webkamera",
  "brush": "kartacek pero",
  "earbuds": "sluchatka airpods",
  "eartips": "koncovky spunty",
  "film": "folie",
  "paper": "paperfeel folie",
  "magnetic": "magneticka magsafe",
  "tracker": "airtag lokator",
  "keychain": "klicenka",
  "tag": "airtag",
  "replacement": "nahradni",
  "protector": "ochrana folie",
  "stand": "stojan",
  "holder": "drzak pouzdro",
  "charger": "nabíječka nabijeni",
  "charging": "nabijeni nabíječka",
  "sleeve": "pouzdro obal",
  "pouch": "pouzdro obal",
  "gel": "hmota cisticí",
  "putty": "hmota cisticí",
  "spray": "sprej cistic",
  "cloth": "mikrovlakno cistic",
  "puzdro": "pouzdro",
  "kryt": "kryt",
  "obal": "obal",
  "silikónové": "silikonove",
  "silikón": "silikon",
  "remienok": "reminek",
  "náramok": "reminek",
  "hroty": "hroty",
  "hrot": "hrot",
  "čistenie": "cisteni",
  "čistič": "cistic",
  "čistiaca": "cisticí",
  "displej": "displej",
  "obrazovka": "obrazovka",
  "peňaženka": "penezenka",
  "organizér": "organizer",
  "kábel": "kabel",
  "prachovka": "prachovka",
  "krytka": "krytka",
  "webkamera": "webkamera",
  "kefka": "kartacek",
  "kefa": "kartacek",
  "slúchadlá": "sluchatka",
  "fólia": "folie",
  "magnetická": "magneticka",
  "náhradné": "nahradni",
  "nabíjačka": "nabíječka",
  "nabíjanie": "nabijeni",
  "držiak": "drzak",
  "stojan": "stojan",
};

function expandQuery(q: string): string {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const expanded = new Set<string>();
  for (const word of words) {
    expanded.add(word);
    const synonyms = SEARCH_SYNONYMS[word];
    if (synonyms) synonyms.split(" ").forEach(s => expanded.add(s));
  }
  return Array.from(expanded).join(" ");
}

// Fuse.js index — fuzzy matching (toleruje překlepy), na rozdíl od starého
// scoreProduct() založeného na přesných podřetězcích. Skóre Fuse je 0=perfektní
// shoda, 1=žádná — proto se níž invertuje na 1-score, ať vyšší číslo = lepší
// shoda (stejná konvence jako měl původní ruční scoring).
function buildFuse(products: typeof staticProducts) {
  return new Fuse(products, {
    keys: [
      { name: "name", weight: 3 },
      { name: "name_en", weight: 1.5 },
      { name: "name_sk", weight: 1.5 },
      { name: "tags", weight: 2 },
      { name: "description", weight: 1 },
    ],
    threshold: 0.4,
    ignoreLocation: true,
    includeScore: true,
    minMatchCharLength: 2,
  });
}

// Prohledá katalog dotazem i všemi jeho synonymy (expandQuery) — Fuse sám
// o sobě vyžaduje shodu zadaných slov, synonyma (např. anglicko-české překlady)
// mu bez tohohle rozšíření unikají. Pro každý produkt se bere nejlepší skóre
// napříč variantami dotazu.
function searchProducts(fuse: Fuse<typeof staticProducts[0]>, query: string): SearchResult[] {
  const variants = Array.from(new Set([query, ...expandQuery(query).split(" ")])).filter((v) => v.length >= 2);
  const best = new Map<string, SearchResult>();

  for (const variant of variants) {
    for (const r of fuse.search(variant)) {
      const score = 1 - (r.score ?? 1);
      const existing = best.get(r.item.slug);
      if (!existing || score > existing.score) {
        best.set(r.item.slug, { ...r.item, score });
      }
    }
  }

  return Array.from(best.values()).sort((a, b) => b.score - a.score).slice(0, 7);
}

// Určí, zda je výsledek dostatečně dominantní na "confident" zobrazení.
// Škála skóre je teď 0–1 (invertované Fuse skóre), ne 0–20 jako u starého scoringu.
function isConfidentResult(results: SearchResult[]): boolean {
  if (results.length === 0) return false;
  const top = results[0];
  if (top.score < 0.55) return false;
  if (results.length === 1) return true;
  return top.score >= results[1].score * 1.4;
}

function highlightMatch(text: string, query: string) {
  const normalizedText = normalize(text);
  const normalizedQuery = normalize(query);
  const idx = normalizedText.indexOf(normalizedQuery);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary/20 text-primary rounded-sm px-0.5 not-italic font-semibold">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// Dřív tu byla vlastní kopie názvů kategorií. Rozešla se s katalogem
// (měla "iPad & Pencil", katalog "iPad & Apple Pencil") a překlady by musela
// držet podruhé — bere se proto přímo z lib/products.ts.
function getCategoryLabel(slug: string, locale: Locale): string {
  const category = categories.find(c => c.slug === slug);
  return category ? getCategoryName(category, locale) : slug.replace(/-/g, " ");
}

// ── Confident card ────────────────────────────────────────────────────────────

function ConfidentCard({
  product,
  query,
  currency,
  locale,
  onClick,
}: {
  product: SearchResult;
  query: string;
  currency: ReturnType<typeof useCurrency>["currency"];
  locale: Locale;
  onClick: () => void;
}) {
  return (
    <a
      href={`/produkt/${product.slug}`}
      onClick={onClick}
      className="flex items-center gap-5 px-5 py-5 hover:bg-white/5 transition-colors group"
    >
      {/* Velká fotka */}
      <div className="relative w-28 h-28 rounded-2xl border border-white/10 bg-white/5 shrink-0 overflow-hidden">
        <Image
          src={product.img}
          alt=""
          fill
          sizes="112px"
          className="object-contain p-2.5 group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-text-strong text-strong font-semibold leading-snug line-clamp-2">
          {highlightMatch(getProductName(product, locale), query)}
        </p>
        <p className="text-white/55 text-xs mt-1.5 capitalize">
          {getCategoryLabel(product.categories[0], locale)}
        </p>
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className="text-primary font-bold text-lg">
          {formatPrice(getPrice(product.price, currency), currency)}
        </span>
        <ArrowUpRight
          size={16}
          className="text-white/55 group-hover:text-white/70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150"
        />
      </div>
    </a>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const { currency } = useCurrency();
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useT("search");
  const { locale } = useLang();
  // SearchBar je na stránce dvakrát (desktop + mobil), takže id musí být
  // unikátní — jinak by aria-controls/aria-activedescendant mířily na cizí
  // seznam. useId vygeneruje stabilní id shodné mezi serverem a klientem.
  const uid = useId();
  const listboxId = `${uid}-listbox`;
  const optionId = (i: number) => `${uid}-opt-${i}`;

  // Vyhledávání funguje hned se statickým katalogem (žádné čekání na síť),
  // a jakmile dorazí odpověď z /api/products (s aktuálními cenami z admina),
  // se tiše přepne na ni — beze změny v UI, uživatel to nepozná.
  const [products, setProducts] = useState(staticProducts);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.products) setProducts(data.products);
      })
      .catch(() => {
        // Fetch nevyšel — zůstaneme u staticProducts, vyhledávání dál funguje.
      });
  }, []);

  const fuse = useMemo(() => buildFuse(products), [products]);

  const trimmed = query.trim();

  // useMemo, ne holý výpočet: `results` je v závislostech handleKeyDown, a nové
  // pole při každém renderu by ten useCallback dělalo zbytečně — React Compiler
  // kvůli tomu memoizaci vzdával úplně.
  const results: SearchResult[] = useMemo(
    () => (trimmed.length > 1 ? searchProducts(fuse, trimmed) : []),
    [fuse, trimmed]
  );

  const confident = isConfidentResult(results);

  useEffect(() => { setActiveIndex(-1); }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
        inputRef.current?.blur();
        return;
      }
      if (!open || results.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex(i => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex(i => Math.max(i - 1, -1));
      } else if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        window.location.href = `/produkt/${results[activeIndex].slug}`;
      } else if (e.key === "Enter" && confident) {
        e.preventDefault();
        window.location.href = `/produkt/${results[0].slug}`;
      }
    },
    [open, results, activeIndex, confident]
  );

  function handleClear() {
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  }

  function handleResultClick() {
    setOpen(false);
    setQuery("");
  }

  const showDropdown = open && trimmed.length > 1;
  const otherResults = confident ? results.slice(1) : results;

  return (
    <div ref={ref} className="relative w-full">

      {/* Input */}
      <div className={`relative flex items-center transition-all duration-200 ${showDropdown ? "ring-2 ring-primary/30 rounded-full" : ""}`}>
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle pointer-events-none z-10 shrink-0"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={t("placeholder")}
          autoComplete="off"
          spellCheck={false}
          aria-label={t("label")}
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          /* combobox bez aria-controls je nekompletní — čtečka pak neví, který
             seznam k poli patří. aria-activedescendant hlásí položku vybranou
             šipkami, aniž by se z inputu ztratil fokus. */
          aria-controls={showDropdown ? listboxId : undefined}
          aria-activedescendant={showDropdown && activeIndex >= 0 ? optionId(activeIndex) : undefined}
          aria-autocomplete="list"
          role="combobox"
         
          className="w-full bg-secondary border border-border rounded-full pl-10 pr-9 py-2.5 text-sm text-text-base placeholder-text-subtle focus:outline-none focus:border-primary/40 transition-colors"
        />
        {query && (
          <button
            onClick={handleClear}
            aria-label={t("clear")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text-base transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown — role="listbox" NEPATŘÍ na tenhle vnější obal: obsahuje i
          hlavičku s počtem a oddělovač, a listbox smí mít jen položky (jinak je
          strom přístupnosti rozbitý). Listboxem je až vnitřní <ul> níž. */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-header border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {results.length === 0 ? (
            <div className="px-5 py-8 text-center">
              {/* Dropdown má tmavé pozadí (bg-header) — text-muted/subtle jsou
                  laděné na světlá pozadí, tady by splynuly. */}
              <p className="text-white/60 text-sm">{t("noResults")}</p>
              <p className="text-white/90 text-sm font-semibold mt-0.5">&bdquo;{trimmed}&ldquo;</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between">
                <span aria-live="polite" className="text-white/55 text-xs">
                  {t.plural(results.length, "resultsFor", { query: trimmed })}
                </span>
                <kbd aria-hidden="true" className="hidden sm:inline-flex items-center gap-1 text-white/50 text-[10px] font-mono">
                  <span>↑↓</span> {t("navigate")}
                </kbd>
              </div>

              {/* Jeden listbox pro všechny položky — včetně "confident" karty,
                  která je taky plnohodnotný výsledek (index 0 při navigaci šipkami). */}
              <ul role="listbox" id={listboxId} aria-label={t("resultsLabel")}>
                {confident && (
                  <li id={optionId(0)} role="option" aria-selected={activeIndex === 0}>
                    <ConfidentCard
                      product={results[0]}
                      query={trimmed}
                      currency={currency}
                      locale={locale}
                      onClick={handleResultClick}
                    />
                  </li>
                )}
                {confident && otherResults.length > 0 && (
                  /* Vizuální předěl uvnitř listboxu musí být presentation,
                     jinak by ho čtečka počítala jako další položku. */
                  <li role="presentation" className="px-4 py-1.5 border-t border-b border-white/5">
                    <span className="text-white/50 text-[10px] uppercase tracking-wider font-medium">
                      {t("moreResults")}
                    </span>
                  </li>
                )}
                {otherResults.map((product, i) => {
                  const navIndex = confident ? i + 1 : i;
                  return (
                    <li key={product.slug} id={optionId(navIndex)} role="option" aria-selected={navIndex === activeIndex}>
                      <a
                        href={`/produkt/${product.slug}`}
                        onClick={handleResultClick}
                        onMouseEnter={() => setActiveIndex(navIndex)}
                        className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                          navIndex === activeIndex ? "bg-white/8" : "hover:bg-white/5"
                        }`}
                      >
                        <div className="relative w-11 h-11 rounded-xl border border-white/10 bg-white/5 shrink-0 overflow-hidden">
                          <Image
                            src={product.img}
                            alt=""
                            fill
                            sizes="44px"
                            className="object-contain p-1.5"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white/90 text-sm font-medium line-clamp-1">
                            {highlightMatch(getProductName(product, locale), trimmed)}
                          </p>
                          <p className="text-white/55 text-xs mt-0.5 capitalize">
                            {getCategoryLabel(product.categories[0], locale)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-primary font-bold text-sm">
                            {formatPrice(getPrice(product.price, currency), currency)}
                          </span>
                          <ArrowUpRight
                            size={14}
                            className={`text-white/50 transition-all duration-150 ${
                              navIndex === activeIndex ? "text-white/60 translate-x-0.5 -translate-y-0.5" : ""
                            }`}
                          />
                        </div>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}