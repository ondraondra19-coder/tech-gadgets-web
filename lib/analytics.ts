// lib/analytics.ts
// Jednotné rozhraní pro sledování — komponenty NIKDY nevolají posthog-js
// přímo, vždy přes trackEvent/identifyUser odsud. Bez souhlasu s analytickými
// cookies (viz components/PostHogProvider.tsx) je PostHog neinicializovaný,
// takže obě funkce v tichosti nic neudělají — volající se o souhlas nemusí
// starat.
//
// Server-side eventy (Stripe webhook) mají vlastní implementaci v
// lib/posthog-server.ts (posthog-node, ne posthog-js — ten by na serveru
// neměl co dělat), ale typy/názvy eventů sdílí odsud přes `import type`, aby
// zůstaly konzistentní s tím, co pak čte lib/posthog-query.ts pro admin panel.
import posthog from "posthog-js";

export function isPostHogLoaded(): boolean {
  return Boolean((posthog as unknown as { __loaded?: boolean }).__loaded);
}

// ── Client-side eventy (chování návštěvníka) ────────────────────────────────

export type ClientAnalyticsEventMap = {
  product_viewed: { slug: string; name: string; price: number; currency: string };
  product_clicked: { slug: string; name: string; price: number; currency: string };
  add_to_cart: { slug: string; name: string; price: number; currency: string; quantity: number };
  checkout_step_completed: { step: 1 | 2 | 3 };
};

export type ClientAnalyticsEventName = keyof ClientAnalyticsEventMap;

export function trackEvent<E extends ClientAnalyticsEventName>(
  event: E,
  properties: ClientAnalyticsEventMap[E],
): void {
  if (!isPostHogLoaded()) return; // bez souhlasu (nebo mimo klienta) se nic neposílá
  posthog.capture(event, properties);
}

export function identifyUser(distinctId: string, properties?: Record<string, string>): void {
  if (!isPostHogLoaded()) return;
  posthog.identify(distinctId, properties);
}

// ── Server-side eventy (Stripe webhook) ─────────────────────────────────────
// Typy jen pro sdílení názvů/vlastností s lib/posthog-server.ts — `import type`
// se v runtime úplně vypustí, takže server soubory tímhle neimportují posthog-js.

export type ServerAnalyticsEventMap = {
  order_completed: { order_id: string; currency: string; revenue: number; item_count: number };
  product_purchased: { order_id: string; slug: string; name: string; quantity: number; currency: string };
};

export type ServerAnalyticsEventName = keyof ServerAnalyticsEventMap;
