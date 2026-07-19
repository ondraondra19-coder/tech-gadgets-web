// ─── Typy ───────────────────────────────────────────

export type Variant = {
  label: string;
  value: string;
};

export type ModelColor = {
  label: string;
  value: string;
  img: string;
  hex?: string;
};

export type ModelColorLayered = {
  label: string;
  value: string;
  body: string;
  cap: string;
  hex?: string;
};

export type PriceValue = number | { CZK: number; EUR?: number; USD?: number };

export type ProductModel = {
  id: string;
  label: string;
  price: PriceValue;
  colors: ModelColor[] | ModelColorLayered[];
  layered?: boolean;
  comboExtra?: PriceValue;
  // Doplněno za běhu vrstvou slev (lib/productDiscounts.ts). Když je na modelu
  // sleva, `price` už drží zlevněnou cenu, `originalPrice` je cena před slevou
  // (přeškrtnutá) a `discountPercent` je zaokrouhlené procento pro odznak.
  originalPrice?: PriceValue;
  discountPercent?: number;
};

export type MediaItem =
  | { type: "image"; src: string }
  | { type: "video"; src: string; poster?: string };

export type ProductColor = {
  label: string;
  value: string;
  hex?: string;
  img?: string;
};

export type ProductSize = {
  label: string;
  value: string;
};

export type Product = {
  slug: string;
  name: string;
  name_en?: string;
  name_sk?: string;
  price: PriceValue;
  categories: string[];
  img: string;
  // Popis je povinný česky; překlady jsou volitelné a čtou se přes
  // getProductDescription(). Chybí-li, spadne to zpět na češtinu.
  description: string;
  description_en?: string;
  description_sk?: string;
  inStock: boolean;
  stock: number;
  tags?: string[];
  colors?: ProductColor[];
  sizes?: ProductSize[];
  sizesLabel?: string;
  media?: MediaItem[];
  variants?: {
    type: string;
    options: Variant[];
  }[];
  models?: ProductModel[];
  related?: string[];
  // Doplněno za běhu vrstvou slev (lib/productDiscounts.ts). Když má produkt
  // slevu, `price` už je zlevněná cena, `originalPrice` původní (přeškrtnutá)
  // a `discountPercent` zaokrouhlené procento pro odznak „−X %".
  originalPrice?: PriceValue;
  discountPercent?: number;
};

// ─── Produkty ───────────────────────────────────────

export const products: Product[] = [
  {
    slug: "prak-x1",
    name: "Prak SLINGR X1",
    price: { CZK: 499 },
    categories: ["zbrane"],
    img: "/images/products/prak-x1/main.jpg",
    description:
      "Lehký a odolný prak, který zvládne celé odpoledne přestřelek. Pohodlný úchop padne do dětské i dospělácké ruky a pružná guma pošle měkkou munici pěkně daleko. Střílí vodní balónky i měkké míčky — vyber si munici podle nálady a vyraz do akce.",
    inStock: true,
    stock: 0,
    tags: ["prak", "zbraň", "slingr", "střílení", "venku", "hračka", "děti", "vodní balónky", "míčky"],
    related: ["micky-do-praku", "vodni-balonky", "terc"],
  },
  {
    slug: "micky-do-praku",
    name: "Míčky do praku SLINGR",
    price: { CZK: 149 },
    categories: ["munice"],
    img: "/images/products/micky/main.jpg",
    description:
      "Balení náhradních míčků do praku SLINGR. Měkké, lehké a barevné — dost velké na přesný zásah, ale šetrné, takže nikoho nebolí. Ideální doplněk, ať ti uprostřed bitvy nedojde munice.",
    inStock: true,
    stock: 0,
    tags: ["míčky", "munice", "náboje", "prak", "slingr", "náhradní", "kuličky"],
    variants: [
      {
        type: "Balení",
        options: [
          { label: "100 ks", value: "100ks" },
          { label: "250 ks", value: "250ks" },
          { label: "500 ks", value: "500ks" },
        ],
      },
    ],
    related: ["prak-x1", "vodni-balonky", "terc"],
  },
  {
    slug: "vodni-balonky",
    name: "Vodní balónky SLINGR",
    price: { CZK: 99 },
    categories: ["munice"],
    img: "/images/products/vodni-balonky/main.jpg",
    description:
      "Sada vodních balónků pro horké letní bitvy. Rychle se plní, pořádně stříkají a při zásahu neškodně prasknou. Nabij prak, zamiř na kámoše a rozjeď vodní válku na zahradě.",
    inStock: true,
    stock: 0,
    tags: ["vodní balónky", "balónky", "munice", "voda", "léto", "prak", "slingr", "zahrada"],
    related: ["prak-x1", "micky-do-praku", "terc"],
  },
  {
    slug: "terc",
    name: "Terč SLINGR",
    price: { CZK: 249 },
    categories: ["prislusenstvi"],
    img: "/images/products/terc/main.jpg",
    description:
      "Skládací terč pro trénink přesnosti i dlouhé souboje o nejvyšší skóre. Postav ho na dvorek, trefuj se do zón a zjisti, kdo má nejlepší mušku. Skvělý parťák k praku i pro sólo střelbu.",
    inStock: true,
    stock: 0,
    tags: ["terč", "příslušenství", "trénink", "přesnost", "prak", "slingr", "cíl", "skóre"],
    related: ["prak-x1", "micky-do-praku", "vodni-balonky"],
  },
];

// ─── Helpers ────────────────────────────────────────

export type Category = {
  slug: string;
  name: string;
  name_en?: string;
  name_sk?: string;
};

export const categories: Category[] = [
  { slug: "vyhodne-sety",  name: "Výhodné sety",  name_en: "Value Bundles", name_sk: "Výhodné sety" },
  { slug: "zbrane",        name: "Zbraně",        name_en: "Blasters",      name_sk: "Zbrane" },
  { slug: "munice",        name: "Munice",        name_en: "Ammo",          name_sk: "Munícia" },
  { slug: "prislusenstvi", name: "Příslušenství", name_en: "Accessories",   name_sk: "Príslušenstvo" },
];

export function getProductsByCategory(slug: string): Product[] {
  return products.filter((p) => p.categories.includes(slug));
}

export function getCategoryBySlug(slug: string) {
  return categories.find((c) => c.slug === slug);
}

// Vyjmenuje všechny prodejné varianty produktu (barva/velikost/model,
// včetně vrstvených barev tělo+hlavička) — používá se pro editaci skladu
// v adminu (ProductsAdminList) i pro přehled nízkého skladu na dashboardu.
// Stock klíč pro danou kombinaci je `${product.slug}|${c.color ?? "-"}|${c.size ?? "-"}`
// (stejný formát jako lib/stock.ts:makeKey).
export type ProductCombination = {
  color?: string;
  size?: string;
};

export function getProductCombinations(product: Product): ProductCombination[] {
  const combos: ProductCombination[] = [];

  if (product.models && product.models.length > 0) {
    product.models.forEach((model) => {
      if (model.colors && model.colors.length > 0) {
        model.colors.forEach((color) => {
          if (model.layered) {
            combos.push({ color: `${color.value}__body`, size: model.id });
            combos.push({ color: `${color.value}__cap`, size: model.id });
          } else {
            combos.push({ color: color.value, size: model.id });
          }
        });
      } else {
        combos.push({ size: model.id });
      }
    });
  } else {
    const hasColors = product.colors && product.colors.length > 0;
    const hasSizes = product.sizes && product.sizes.length > 0;

    if (hasColors && hasSizes) {
      product.colors!.forEach((color) => {
        product.sizes!.forEach((size) => {
          combos.push({ color: color.value, size: size.value });
        });
      });
    } else if (hasColors) {
      product.colors!.forEach((color) => {
        combos.push({ color: color.value });
      });
    } else if (hasSizes) {
      product.sizes!.forEach((size) => {
        combos.push({ size: size.value });
      });
    } else {
      combos.push({});
    }
  }

  return combos;
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  if (product.related && product.related.length > 0) {
    const related = product.related
      .map(slug => products.find(p => p.slug === slug))
      .filter(Boolean) as Product[];
    if (related.length > 0) return related.slice(0, limit);
  }
  return products
    .filter((p) => p.slug !== product.slug && p.categories.some((c) => product.categories.includes(c)))
    .slice(0, limit);
}

// ─── Helper pro získání názvu produktu podle jazyka ──
// ─── Lokalizace katalogu ────────────────────────────
// Všechny tři funkce padají zpět na češtinu, když překlad chybí — radši
// česky než prázdno. Nový produkt tak jde přidat bez překladů a doplnit je
// později, aniž by se web rozbil.

export function getProductName(product: Product, locale: string): string {
  if (locale === "en" && product.name_en) return product.name_en;
  if (locale === "sk" && product.name_sk) return product.name_sk;
  return product.name;
}

export function getProductDescription(product: Product, locale: string): string {
  if (locale === "en" && product.description_en) return product.description_en;
  if (locale === "sk" && product.description_sk) return product.description_sk;
  return product.description;
}

export function getCategoryName(category: Category, locale: string): string {
  if (locale === "en" && category.name_en) return category.name_en;
  if (locale === "sk" && category.name_sk) return category.name_sk;
  return category.name;
}