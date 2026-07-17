// lib/shipping/pricing.ts
// Jediný zdroj pravdy pro ceny dopravy. Používá to jak stránka /objednavka
// (zobrazení výběru), tak /api/checkout a /api/orders, kde server cenu dopravy
// dopočítá podle ZVOLENÉ dopravy — nevěří částce poslané klientem.

export type ShippingId = "zasilkovna_box" | "zasilkovna_adresa";

export const SHIPPING_PRICES: Record<ShippingId, { CZK: number; EUR: number; USD: number }> = {
  zasilkovna_box: { CZK: 89, EUR: 3.49, USD: 3.79 },
  zasilkovna_adresa: { CZK: 129, EUR: 4.99, USD: 5.49 },
};

export type PaymentId = "karta" | "prevod" | "dobirka";

// Názvy do ZÁZNAMU objednávky — vždy česky, bez ohledu na jazyk zákazníka.
// Tečou do Stripe (název položky), do uloženého `shippingName`, do e-mailů
// a do administrace. Kdyby se překládaly, měl by správce v adminu půlku
// objednávek anglicky a nešly by porovnat.
//
// Co VIDÍ ZÁKAZNÍK, se překládá zvlášť přes namespace `checkout` v
// messages/*.json a páruje se přes tohle ID. Tyhle dva světy nemíchej.
export const SHIPPING_CANONICAL_NAMES: Record<ShippingId, string> = {
  zasilkovna_box: "Zásilkovna — výdejní místo",
  zasilkovna_adresa: "Zásilkovna — na adresu",
};

export const PAYMENT_CANONICAL_NAMES: Record<PaymentId, string> = {
  karta: "Kartou online",
  prevod: "Bankovní převod",
  dobirka: "Dobírka",
};

// Cena dopravy pro daný způsob v dané měně. Neznámý způsob → 0,
// chybějící měna → fallback na CZK.
export function getShippingPrice(dopravaId: string | null | undefined, currencyCode: string): number {
  if (!dopravaId || !(dopravaId in SHIPPING_PRICES)) return 0;
  const price = SHIPPING_PRICES[dopravaId as ShippingId];
  return price[currencyCode as keyof typeof price] ?? price.CZK;
}
