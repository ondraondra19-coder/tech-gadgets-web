"use client";

// lib/shippingLabels.ts
// Popisek dopravy/platby pro zákazníka.
//
// PROČ: v objednávce je uložené české kanonické jméno (viz komentář
// v lib/shipping/pricing.ts) — to je správně pro Stripe, e-maily a admin,
// ale zákazníkovi v anglickém rozhraní ho ukázat nechceme. Zpátky na jeho
// jazyk se dostaneme přes uložené `id`.
//
// Fallback na uložené jméno je schválně: starší objednávky nemusí mít `id`
// (nebo může přibýt nový dopravce dřív než překlad) a v takovém případě je
// lepší ukázat české jméno než prázdno.

import type { T } from "./useT";
import type { ShippingId, PaymentId } from "./shipping/pricing";

const SHIPPING_KEYS: Record<ShippingId, string> = {
  zasilkovna_box: "shipBoxName",
  zasilkovna_adresa: "shipAddrName",
};

const PAYMENT_KEYS: Record<PaymentId, string> = {
  karta: "payCardName",
  prevod: "payTransferName",
  dobirka: "payCodName",
};

/** `t` musí být z namespace "checkout". */
export function shippingLabel(t: T, id: string | null | undefined, fallback?: string | null): string {
  const key = id ? SHIPPING_KEYS[id as ShippingId] : undefined;
  return key ? t(key) : (fallback ?? "");
}

/** `t` musí být z namespace "checkout". */
export function paymentLabel(t: T, id: string | null | undefined, fallback?: string | null): string {
  const key = id ? PAYMENT_KEYS[id as PaymentId] : undefined;
  return key ? t(key) : (fallback ?? "");
}
