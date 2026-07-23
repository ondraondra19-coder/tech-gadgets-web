"use client";

// components/FooterNewsletter.tsx
// Klientský ostrůvek vyříznutý z Footeru.
//
// PROČ ZVLÁŠŤ: Footer je na každé stránce a byl celý "use client" jenom kvůli
// tomuhle jedinému formuláři. Kvůli němu se do prohlížeče posílal i všechen
// statický obsah patičky včetně dvanácti ikon. Interaktivní je tady jen tenhle
// formulář — zbytek patičky je od teď serverový a žádný JS nepotřebuje.
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { useT } from "@/lib/useT";
import { isValidEmail } from "@/lib/emailValidation";

export default function Newsletter() {
  const t = useT("footer");
  const tn = useT("newsletter");
  const tc = useT("common");
  const [email,     setEmail]     = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [loading,   setLoading]   = useState(false);

  // API vrací kód, ne hotovou větu — text se vybírá tady podle jazyka.
  // Neznámý kód spadne na obecné "nepovedlo se", ať nikdy neukážeme
  // "newsletter.neco" místo chyby.
  function messageForCode(code: unknown): string {
    switch (code) {
      case "invalid_email":   return tn("errorInvalidEmail");
      case "rate_limited":    return tn("errorRateLimited");
      case "not_configured":  return tn("errorUnavailable");
      default:                return tn("errorFailed");
    }
  }

  async function handleSubmit() {
    if (loading) return;
    if (!isValidEmail(email)) {
      setError(t("emailError"));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => null);
        setError(messageForCode(data?.code));
      }
    } catch {
      setError(tn("errorNetwork"));
    } finally {
      setLoading(false);
    }
  }

  // Po úspěšném přihlášení nahradíme CELÝ blok čistým potvrzením — ať tam
  // nezůstane viset výzva „Buďte první…", když už je uživatel přihlášený.
  if (submitted) {
    return (
      <div className="border-b border-white/8">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 py-10">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <Check size={18} strokeWidth={2.5} className="text-primary" aria-hidden="true" />
            </div>
            <div>
              <p className="text-white font-bold text-base">{t("subscribedTitle")}</p>
              <p className="text-white/60 text-sm">{t("subscribedDesc")}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-white/8">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 py-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">

          {/* Left */}
          <div className="flex-1">
            <p className="text-white font-bold text-base mb-1">
              {t("newsletter")}
            </p>
            <p className="text-white/60 text-sm">
              {t("newsletterDesc")}
            </p>
          </div>

          {/* Form */}
          <div className="w-full lg:w-auto">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-auto">
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(null); }}
                    onKeyDown={e => e.key === "Enter" && handleSubmit()}
                    disabled={loading}
                    placeholder={t("emailPlaceholder")}
                    aria-label={tn("emailLabel")}
                    aria-invalid={!!error}
                    /* border-white/40 = 3.81:1 vůči #1c1c1c — hranice formulářového
                       pole je UI komponenta a potřebuje 3:1 (dřív /12 ≈ 1.3:1). */
                    className={`w-full sm:w-64 bg-white/6 border rounded-full px-4 py-2.5 text-sm text-white placeholder-white/55 focus:outline-none focus:border-primary/60 transition-colors disabled:opacity-60 ${
                      error ? "border-red-500/60" : "border-white/40"
                    }`}
                  />
                  {error && (
                    <p className="absolute -bottom-5 left-4 text-red-400 text-[10px]">
                      {error}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-primary text-on-primary font-bold text-sm hover:brightness-105 active:scale-[0.98] transition-all shrink-0 w-full sm:w-auto disabled:opacity-70 disabled:active:scale-100"
                >
                  <span>{loading ? tc("sending") : t("subscribe")}</span>
                  {!loading && <ArrowRight size={14} />}
                </button>
              </div>
          </div>

        </div>
      </div>
    </div>
  );
}
