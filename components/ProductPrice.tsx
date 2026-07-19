"use client";

// Zobrazení ceny produktu se slevou. Když má produkt slevu (product.discountPercent
// + product.originalPrice, doplněné vrstvou lib/productDiscounts.ts), ukáže
// zlevněnou cenu + přeškrtnutou původní + volitelný odznak „−X %". Bez slevy jen
// prostou cenu. Barvu/velikost hlavní ceny řídí `priceClassName` z místa použití,
// ať karta v carouselu i řádek ve vyhledávání vypadají konzistentně s okolím.
import type { Product } from "@/lib/products";
import { useCurrency } from "@/lib/CurrencyContext";
import { formatPrice, getPrice } from "@/lib/currency";

export default function ProductPrice({
  product,
  priceClassName = "",
  originalClassName = "text-text-subtle",
  badge = true,
  className = "",
}: {
  product: Product;
  /** Třídy pro hlavní (aktuální) cenu — přebírá se z okolí (font, velikost, barva). */
  priceClassName?: string;
  /** Barva přeškrtnuté původní ceny — přebít na tmavém pozadí (např. text-white/40). */
  originalClassName?: string;
  /** Zobrazit odznak „−X %" vedle ceny. */
  badge?: boolean;
  /** Třídy pro obalový prvek při slevě. */
  className?: string;
}) {
  const { currency } = useCurrency();
  const current = formatPrice(getPrice(product.price, currency), currency);

  const hasSale = !!product.discountPercent && !!product.originalPrice;
  if (!hasSale) {
    return <span className={priceClassName}>{current}</span>;
  }

  const original = formatPrice(getPrice(product.originalPrice!, currency), currency);

  return (
    <span className={`inline-flex items-baseline gap-1.5 flex-wrap ${className}`}>
      <span className={priceClassName}>{current}</span>
      <span className={`line-through font-medium text-[0.8em] ${originalClassName}`}>{original}</span>
      {badge && (
        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 rounded px-1 py-0.5 leading-none whitespace-nowrap">
          −{product.discountPercent}&nbsp;%
        </span>
      )}
    </span>
  );
}
