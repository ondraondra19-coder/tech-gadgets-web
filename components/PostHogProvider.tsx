"use client";

// components/PostHogProvider.tsx
// Nahrazuje starý AnalyticsTracker. PostHog se vůbec nenačte/nezapne,
// dokud uživatel neodsouhlasí "Analytické cookies" — žádný request na
// PostHog se dřív neposílá. Po odvolání souhlasu (CONSENT_CHANGED_EVENT)
// se sledování okamžitě vypne a lokální identita se smaže.
//
// Přihlášený admin se NIKDY netrackuje (i kdyby cookies odsouhlasil) —
// při přihlášení se vedle httpOnly session cookie nastaví i čitelný
// "admin_hint" cookie (viz lib/adminAuth.ts), podle kterého se tu
// sledování rovnou vypne.
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { isPostHogLoaded } from "@/lib/analytics";
import { CONSENT_CHANGED_EVENT, hasAnalyticsConsent } from "./CookieBanner";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const ADMIN_HINT_COOKIE = "admin_hint"; // musí odpovídat ADMIN_HINT_COOKIE_NAME v lib/adminAuth.ts

function isAdminSession(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((c) => c.startsWith(`${ADMIN_HINT_COOKIE}=`));
}

// Na /admin* se netrackuje nikdy, ani před přihlášením (admin_hint cookie
// existuje až PO přihlášení) — je to interní nástroj, ne návštěvnická stránka.
function isAdminRoute(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.pathname.startsWith("/admin");
}

function capturePageview() {
  posthog.capture("$pageview", { $current_url: window.location.href });
}

function startPostHog() {
  if (!POSTHOG_KEY || !POSTHOG_HOST || isPostHogLoaded() || isAdminSession() || isAdminRoute()) return;
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: "identified_only",
    capture_pageview: false, // posíláme ručně kvůli App Router client-side navigaci
    autocapture: true,
  });
  capturePageview(); // jinak by se stránka, na které padne souhlas, nikdy nezapočítala
}

function stopPostHog() {
  if (!isPostHogLoaded()) return;
  posthog.opt_out_capturing();
  posthog.reset();
}

function syncTrackingState() {
  if (isAdminSession() || isAdminRoute() || !hasAnalyticsConsent()) {
    stopPostHog();
    return;
  }
  if (isPostHogLoaded()) {
    posthog.opt_in_capturing();
    capturePageview();
  } else {
    startPostHog();
  }
}

export default function PostHogProvider() {
  const pathname = usePathname();
  // Zabrání duplicitnímu $pageview: mount efekt už jednou odešle pageview,
  // pokud souhlas existuje už při načtení stránky (viz startPostHog výše).
  const skipNextPathnameCapture = useRef(true);

  useEffect(() => {
    syncTrackingState();

    window.addEventListener(CONSENT_CHANGED_EVENT, syncTrackingState);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, syncTrackingState);
  }, []);

  useEffect(() => {
    if (skipNextPathnameCapture.current) {
      skipNextPathnameCapture.current = false;
      return;
    }
    // Řeší i případ přihlášení do adminu (přesměrování na /admin je změna
    // pathname) — okamžitě se tím vypne případné už běžící sledování.
    if (isAdminSession() || isAdminRoute()) {
      stopPostHog();
      return;
    }
    if (!isPostHogLoaded() || !hasAnalyticsConsent()) return;
    capturePageview();
  }, [pathname]);

  return null;
}
