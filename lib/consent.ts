"use client";

// lib/consent.ts
// Jediné místo, kde se souhlas s cookies čte a zapisuje.
//
// Dřív žila stejná logika zvlášť v components/CookieBanner.tsx a znovu
// v app/cookies/page.tsx — a rozešly se: stránka /cookies volbu uložila,
// ale neposlala CONSENT_CHANGED_EVENT, takže odvolání souhlasu se projevilo
// až po ručním obnovení stránky (PostHog do té doby dál sbíral data).
// Proto každý zápis musí jít přes saveConsent()/clearConsent() odsud —
// notifikace je součástí zápisu a nejde ji zapomenout.

export const CONSENT_STORAGE_KEY = "slingr-cookie-consent";
export const CONSENT_SESSION_KEY = "slingr-cookie-visited-details";
export const CONSENT_CHANGED_EVENT = "slingr-consent-changed";

export type ConsentPreferences = {
  essential: true; // technické cookies nejdou vypnout, jsou nutné pro košík a pokladnu
  analytics: boolean;
  marketing: boolean;
};

function readRaw(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(CONSENT_STORAGE_KEY);
  } catch {
    return null; // např. Safari v privátním režimu nebo zakázané úložiště
  }
}

/** True, pokud návštěvník už jakkoliv rozhodl — podle toho se skrývá lišta. */
export function hasDecided(): boolean {
  return readRaw() !== null;
}

/**
 * Vrátí uložené předvolby, nebo null, pokud návštěvník ještě nerozhodl.
 *
 * Starší verze lišty ukládala "Povolit vše" jako holý řetězec "accepted"
 * místo JSON objektu. Pořád ho umíme přečíst, aby se návštěvníkům, kteří
 * souhlas dali dřív, lišta neukázala znovu a jejich volba platila dál.
 */
export function getConsentPreferences(): ConsentPreferences | null {
  const raw = readRaw();
  if (!raw) return null;
  if (raw === "accepted") return { essential: true, analytics: true, marketing: true };
  try {
    const parsed = JSON.parse(raw);
    return {
      essential: true,
      analytics: parsed?.analytics === true,
      marketing: parsed?.marketing === true,
    };
  } catch {
    return null; // rozbitá hodnota = jako by nerozhodl, lišta se ukáže znovu
  }
}

export function hasAnalyticsConsent(): boolean {
  return getConsentPreferences()?.analytics === true;
}

/**
 * Zatím nikdo nevolá — marketingové nástroje na webu nasazené nejsou.
 * Až nějaký přibyde, musí se ptát tudy (stejně jako PostHogProvider volá
 * hasAnalyticsConsent), ne číst localStorage přímo.
 */
export function hasMarketingConsent(): boolean {
  return getConsentPreferences()?.marketing === true;
}

// Notifikace je mimo try/catch úmyslně: i když zápis do úložiště selže,
// zbytek aplikace se musí dozvědět, že se volba změnila.
function notifyChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT));
}

export function saveConsent(prefs: { analytics: boolean; marketing: boolean }): void {
  const value: ConsentPreferences = {
    essential: true,
    analytics: prefs.analytics,
    marketing: prefs.marketing,
  };
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(value));
    sessionStorage.removeItem(CONSENT_SESSION_KEY);
  } catch {}
  notifyChanged();
}

export function acceptAll(): void {
  saveConsent({ analytics: true, marketing: true });
}

export function rejectAll(): void {
  saveConsent({ analytics: false, marketing: false });
}

/** Úplné odvolání — vrátí web do stavu "návštěvník ještě nerozhodl". */
export function clearConsent(): void {
  try {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
    sessionStorage.removeItem(CONSENT_SESSION_KEY);
  } catch {}
  notifyChanged();
}

// ── Zobrazení lišty ─────────────────────────────────────────────────────────

export function markDetailsVisited(): void {
  try {
    sessionStorage.setItem(CONSENT_SESSION_KEY, "true");
  } catch {}
}

export function hasVisitedDetails(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(CONSENT_SESSION_KEY) === "true";
  } catch {
    return false;
  }
}
