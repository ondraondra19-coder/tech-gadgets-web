"use client";

// Horizontální carousel produktových karet ve stylu blastro.cz. Karta má
// brandovou šrafovanou dlaždici s fotkou, odznaky (sleva / poslední kusy),
// hvězdičky (volitelné), zvýrazněnou cenu v pilulce s přeškrtnutou původní,
// zelené „Odeslání do 24 hodin!" a u docházejících kusů „Zbývá N skladem".
// Nadpis sekce vlevo, vpravo „Zobrazit vše" + šipky (desktop). Znovupoužitelné
// pro libovolnou sekci (kategorie, novinky…).
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ArrowRight, Star, Truck, Plus } from "lucide-react";
import type { Product } from "@/lib/products";
import { getProductName } from "@/lib/products";
import { useCurrency } from "@/lib/CurrencyContext";
import { formatPrice, getPrice, CURRENCIES } from "@/lib/currency";
import { useCart } from "@/lib/cart";
import { useLang } from "@/lib/LangContext";
import { useT } from "@/lib/useT";

// Do kolika kusů na skladě křičíme „Poslední kusy!" / „Zbývá N skladem".
const LOW_STOCK_THRESHOLD = 10;

// Brandová dlaždice pod fotkou — jemné diagonální šrafování ve dvou odstínech
// naší teal barvy. Fotky (barevné blastery) na ní vyniknou líp než na bílé.
const TILE_STYLE: React.CSSProperties = {
  backgroundColor: "#eaf8f4",
  backgroundImage:
    "repeating-linear-gradient(-45deg, rgba(40,191,166,0.07) 0 16px, rgba(40,191,166,0.15) 16px 32px)",
};

type ProductRowT = ReturnType<typeof useT>;

function RatingStars({ rating, count, t }: { rating: number; count?: number; t: ProductRowT }) {
  const full = Math.round(rating);
  return (
    <div className="flex items-center gap-1" aria-label={t("ratingAria", { rating })}>
      <span className="flex">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star
            key={i}
            size={13}
            className={i < full ? "text-amber-400" : "text-zinc-300"}
            fill="currentColor"
            aria-hidden="true"
          />
        ))}
      </span>
      <span className="text-xs font-bold text-text-muted">{rating.toFixed(1)}</span>
      {count !== undefined && <span className="text-xs text-text-subtle">{count}×</span>}
    </div>
  );
}

function ProductCard({
  product,
  available,
  t,
  locale,
}: {
  product: Product;
  available?: number;
  t: ProductRowT;
  locale: string;
}) {
  const { currency } = useCurrency();
  const { addItem, items } = useCart();
  const router = useRouter();

  const hasSale = !!product.discountPercent && !!product.originalPrice;
  const current = formatPrice(getPrice(product.price, currency), currency);
  const original = hasSale ? formatPrice(getPrice(product.originalPrice!, currency), currency) : "";

  // Dostupnost: když známe reálný sklad (available != undefined), řídíme se jím,
  // jinak fallback na statické product.inStock z katalogu.
  const known = available !== undefined;
  const inStock = known ? available > 0 : product.inStock;

  // Kolik kusů už zákazník má v košíku — odečteme od skladu, ať karta ukazuje,
  // kolik REÁLNĚ zbývá přidat (sklad 3, v košíku 2 → „Zbývá 1 skladem").
  const inCartQty = items.find((i) => i.slug === product.slug)?.quantity ?? 0;
  const remaining = known ? Math.max(0, available - inCartQty) : undefined;
  const low = remaining !== undefined && remaining > 0 && remaining <= LOW_STOCK_THRESHOLD;

  // Produkty nemají volby, takže „+" přidá 1× rovnou do košíku — ale jen když se
  // tam ještě další kus vejde (zbývá > 0).
  const canQuickAdd = known ? (remaining ?? 0) > 0 : product.inStock;

  function quickAdd(e: React.MouseEvent | React.KeyboardEvent) {
    e.preventDefault(); // nesmí navigovat na detail (jsme uvnitř <Link>)
    e.stopPropagation();
    addItem(
      {
        slug: product.slug,
        name: getProductName(product, locale),
        priceCZK: getPrice(product.price, CURRENCIES.CZK),
        priceRaw: product.price,
        img: product.img,
      },
      available,
    );
    // Po přidání rovnou do košíku (CartProvider je nad stránkou, takže položka
    // v client-side navigaci nezmizí).
    router.push("/kosik");
  }

  return (
    <Link
      href={`/produkt/${product.slug}`}
      className="group relative shrink-0 snap-start w-[230px] sm:w-[250px] rounded-2xl border border-border bg-white overflow-hidden hover:shadow-xl hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Fotka na brandové dlaždici */}
      <div className="relative aspect-square overflow-hidden" style={TILE_STYLE}>
        {/* Odznaky */}
        <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between p-2.5 pointer-events-none">
          {hasSale ? (
            <span className="text-[11px] leading-none text-white bg-rose-600 rounded-lg px-2 py-1 shadow-sm">
              {t("sale")} <b className="font-extrabold">−{product.discountPercent}&nbsp;%</b>
            </span>
          ) : (
            <span />
          )}
          {low && (
            <span className="text-[11px] font-bold leading-none text-white bg-header rounded-lg px-2 py-1 shadow-sm">
              {t("lastPieces")}
            </span>
          )}
        </div>

        <Image
          src={product.img}
          alt=""
          fill
          sizes="250px"
          className="object-contain p-5 transition-transform duration-300 group-hover:scale-105"
        />

        {/* Hover CTA „+" — u produktů bez voleb přidá 1× rovnou do košíku */}
        {canQuickAdd ? (
          <span
            role="button"
            tabIndex={0}
            aria-label={t("quickAdd")}
            onClick={quickAdd}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") quickAdd(e);
            }}
            className={`absolute bottom-3 right-3 z-10 w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-primary text-on-primary transition-all duration-200 cursor-pointer opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 hover:brightness-110 active:scale-90 focus:outline-none focus:ring-2 focus:ring-primary/40`}
          >
            {/* Bez potvrzovací ikony — zpětná vazba je jen zmáčknutí tlačítka. */}
            <Plus size={20} strokeWidth={2} aria-hidden="true" />
          </span>
        ) : null}
      </div>

      {/* Text */}
      <div className="p-4 pt-3 border-t border-border">
        <p className="text-text-base font-semibold text-sm leading-snug line-clamp-2 min-h-[2.5rem]">
          {getProductName(product, locale)}
        </p>

        {product.rating !== undefined && (
          <div className="mt-1.5">
            <RatingStars rating={product.rating} count={product.reviewCount} t={t} />
          </div>
        )}

        {/* Cena — současná vždy stejný řez/velikost (sleva už je vidět v odznaku
            na fotce), u slevy jen růžová + přeškrtnutá původní vedle ní. */}
        <div className="mt-2 flex items-baseline gap-2 flex-wrap">
          <span
            className={`text-lg font-bold tabular-nums tracking-tight leading-none ${
              hasSale ? "text-rose-600" : "text-text-base"
            }`}
          >
            {current}
          </span>
          {hasSale && (
            <span className="text-sm font-medium text-text-subtle line-through tabular-nums leading-none">
              {original}
            </span>
          )}
        </div>

        {/* Trust / sklad */}
        {inStock ? (
          <div className="mt-2.5 space-y-1">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <Truck size={14} aria-hidden="true" />
              {t("ship24")}
            </p>
            {low && (
              <p className="text-xs text-text-muted font-medium">
                {t("stockLeft", { count: remaining ?? 0 })}
              </p>
            )}
          </div>
        ) : (
          <p className="mt-2.5 text-xs font-semibold text-text-subtle">{t("outStock")}</p>
        )}
      </div>
    </Link>
  );
}

export default function ProductRow({
  title,
  subtitle,
  viewAllHref,
  products,
  availability,
}: {
  title: string;
  subtitle?: string;
  viewAllHref: string;
  products: Product[];
  /** slug → počet dostupných kusů. Když chybí, karta spadne na product.inStock. */
  availability?: Record<string, number>;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const { locale } = useLang();
  const t = useT("productrow");

  if (products.length === 0) return null;

  function scrollByCards(dir: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  }

  return (
    <section className="py-6 lg:py-8">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">

        {/* Hlavička sekce — velký poutavý nadpis + krátký popisek */}
        <div className="flex items-end justify-between gap-4 mb-5">
          <div className="min-w-0">
            <h2 className="text-2xl lg:text-3xl font-extrabold text-text-base tracking-tight leading-tight">{title}</h2>
            {subtitle && <p className="mt-1 text-text-muted text-sm lg:text-base">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <Link
              href={viewAllHref}
              className="inline-flex items-center gap-1.5 text-primary-ink text-sm font-semibold hover:gap-2.5 transition-all whitespace-nowrap"
            >
              {t("viewAll")}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={() => scrollByCards(-1)}
                aria-label={t("prev")}
                className="w-10 h-10 rounded-full border-2 border-border-strong text-text-muted flex items-center justify-center hover:border-primary hover:text-primary-ink transition-colors"
              >
                <ChevronLeft size={17} />
              </button>
              <button
                onClick={() => scrollByCards(1)}
                aria-label={t("next")}
                className="w-10 h-10 rounded-full border-2 border-border-strong text-text-muted flex items-center justify-center hover:border-primary hover:text-primary-ink transition-colors"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel */}
        <div
          ref={trackRef}
          className="flex gap-4 overflow-x-auto snap-x pb-2 -mx-1 px-1"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        >
          {products.map((product) => (
            <ProductCard
              key={product.slug}
              product={product}
              available={availability?.[product.slug]}
              t={t}
              locale={locale}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
