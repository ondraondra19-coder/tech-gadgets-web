"use client";

// Řádky produktů po kategoriích na homepage (styl blastro.cz). Jeden ProductRow
// na každou kategorii; kategorie bez produktů se nevykreslí (ProductRow vrátí
// null u prázdného seznamu).
import type { Product } from "@/lib/products";
import { categories, getCategoryName } from "@/lib/products";
import { useLang } from "@/lib/LangContext";
import { useT } from "@/lib/useT";
import ProductRow from "./ProductRow";

export default function CategoryProductRows({
  products,
  slugs,
  availability,
}: {
  products: Product[];
  /** Které kategorie tady vykreslit. Nevyplněno = všechny. Umožní rozmístit
      jednotlivé řádky na různá místa homepage. */
  slugs?: string[];
  /** slug → počet dostupných kusů (pro odznaky skladu na kartách). */
  availability?: Record<string, number>;
}) {
  const { locale } = useLang();
  const t = useT("rows");

  // Slug → poutavý nadpis + popisek (styl blastro: velký tučný nadpis, ne jen
  // „Zbraně"). Kategorie mimo mapu spadnou zpět na holý název kategorie.
  const copy: Record<string, { title: string; sub: string }> = {
    "vyhodne-sety": { title: t("setyTitle"), sub: t("setySub") },
    "zbrane": { title: t("zbraneTitle"), sub: t("zbraneSub") },
    "munice": { title: t("municeTitle"), sub: t("municeSub") },
    "prislusenstvi": { title: t("prislusenstviTitle"), sub: t("prislusenstviSub") },
  };

  return (
    <>
      {categories.map((cat) => {
        if (slugs && !slugs.includes(cat.slug)) return null;
        const items = products.filter((p) => p.categories.includes(cat.slug));
        const c = copy[cat.slug];
        return (
          <ProductRow
            key={cat.slug}
            title={c?.title ?? getCategoryName(cat, locale)}
            subtitle={c?.sub}
            viewAllHref={`/kategorie/${cat.slug}`}
            products={items}
            availability={availability}
          />
        );
      })}
    </>
  );
}
