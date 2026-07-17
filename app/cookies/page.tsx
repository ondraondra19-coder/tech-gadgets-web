"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Shield, Eye, BarChart3, Check } from "lucide-react";
import {
  acceptAll,
  clearConsent,
  getConsentPreferences,
  saveConsent,
} from "@/lib/consent";
import LegalLayout, { Section } from "@/components/legal/LegalLayout";
import {
  STORAGE_LIST,
  BROWSER_HELP,
  COOKIES_TITLE,
  COOKIES_SUBTITLE,
  COOKIES_EFFECTIVE_FROM,
  COOKIES_INTRO,
  COOKIES_CATEGORIES,
  COOKIES_CONSENT_INTRO,
  type StorageType,
} from "@/content/legal/cookies";
import { useT } from "@/lib/useT";
import { useLang } from "@/lib/LangContext";

export default function CookiesPage() {
  const t = useT("cookies");
  const { locale } = useLang();
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  const Intro = COOKIES_INTRO[locale];
  const Categories = COOKIES_CATEGORIES[locale];
  const ConsentIntro = COOKIES_CONSENT_INTRO[locale];

  // Uloženou volbu čteme až po mountu — na serveru localStorage neexistuje.
  useEffect(() => {
    const prefs = getConsentPreferences();
    if (!prefs) return;
    setAnalytics(prefs.analytics);
    setMarketing(prefs.marketing);
  }, []);

  // Zápis jde přes lib/consent, který zároveň rozešle CONSENT_CHANGED_EVENT —
  // díky tomu se PostHog vypne/zapne hned, ne až po obnovení stránky.
  function handleAcceptAll() {
    acceptAll();
    setAnalytics(true);
    setMarketing(true);
    setSavedNote(t("notedAcceptedAll"));
  }

  function handleSaveCustom() {
    saveConsent({ analytics, marketing });
    setSavedNote(t("notedSaved"));
  }

  function handleRevoke() {
    clearConsent();
    setAnalytics(false);
    setMarketing(false);
    setSavedNote(t("notedRevoked"));
  }

  // Štítek typu se vybírá podle klíče, ne podle zobrazeného textu — dřív se
  // porovnávalo `type === "Nezbytné"` a po překladu by štítky zšedly.
  const typeLabel: Record<StorageType, string> = {
    necessary: t("typeNecessary"),
    preference: t("typePreference"),
    analytics: t("typeAnalytics"),
  };

  return (
    <>
      <title>{`${COOKIES_TITLE[locale]} | HackPack`}</title>

      <Header />
      <LegalLayout
        title={COOKIES_TITLE[locale]}
        effectiveFrom={`${COOKIES_EFFECTIVE_FROM} · ${COOKIES_SUBTITLE[locale]}`}
      >
        <Section title={t("section1")}>
          <Intro />
        </Section>

        <Section title={t("section2")}>
          <Categories />
        </Section>

        <Section title={t("section3")}>
          <ConsentIntro />

          {/* ROZTAŽENÝ PANEL SE ZAŠKRTÁVÁTKY */}
          <div className="w-full border border-border bg-dark/20 rounded-xl p-6 mt-6 max-w-none">
            <h3 className="text-text-base font-bold text-base mb-4">
              {t("panelTitle")}
            </h3>

            <div className="flex flex-col gap-3 mb-6">
              {/* Technické */}
              <div className="p-4 bg-dark/40 border border-border rounded-xl flex items-start justify-between">
                <div className="flex gap-3">
                  <Shield size={18} className="text-primary-ink mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    <span className="font-bold text-sm text-text-base block">{t("technicalTitle")}</span>
                    <span className="text-text-muted text-xs block mt-1">{t("technicalDesc")}</span>
                  </div>
                </div>
                <div className="h-5 w-5 rounded bg-border/40 text-primary-ink flex items-center justify-center text-xs shrink-0">
                  <Check size={14} className="stroke-[3]" aria-hidden="true" />
                </div>
              </div>

              {/* Analytické */}
              <label
                htmlFor="page-analytics"
                className="p-4 bg-dark/40 border border-border hover:border-border/80 rounded-xl flex items-start justify-between cursor-pointer transition-colors"
              >
                <div className="flex gap-3">
                  <BarChart3 size={18} className="text-text-muted mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    <span className="font-bold text-sm text-text-base block">{t("analyticsTitle")}</span>
                    <span className="text-text-muted text-xs block mt-1">{t("analyticsDesc")}</span>
                  </div>
                </div>
                <input
                  id="page-analytics"
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => { setAnalytics(e.target.checked); setSavedNote(null); }}
                  className="mt-1 h-4 w-4 rounded border-border bg-dark text-primary-ink focus:ring-0 cursor-pointer accent-primary shrink-0"
                />
              </label>

              {/* Marketingové */}
              <label
                htmlFor="page-marketing"
                className="p-4 bg-dark/40 border border-border hover:border-border/80 rounded-xl flex items-start justify-between cursor-pointer transition-colors"
              >
                <div className="flex gap-3">
                  <Eye size={18} className="text-text-muted mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    <span className="font-bold text-sm text-text-base block">{t("marketingTitle")}</span>
                    <span className="text-text-muted text-xs block mt-1">{t("marketingDesc")}</span>
                  </div>
                </div>
                <input
                  id="page-marketing"
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => { setMarketing(e.target.checked); setSavedNote(null); }}
                  className="mt-1 h-4 w-4 rounded border-border bg-dark text-primary-ink focus:ring-0 cursor-pointer accent-primary shrink-0"
                />
              </label>
            </div>

            {/* Tlačítka akcí */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAcceptAll}
                className="flex-1 py-2.5 px-4 rounded-lg bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs tracking-wide transition-colors cursor-pointer text-center"
              >
                {t("acceptAll")}
              </button>
              <button
                onClick={handleSaveCustom}
                className="flex-1 py-2.5 px-4 rounded-lg border border-border hover:border-text-muted text-text-base font-medium text-xs tracking-wide transition-colors cursor-pointer text-center bg-transparent"
              >
                {t("savePreferences")}
              </button>
              <button
                onClick={handleRevoke}
                className="flex-1 py-2.5 px-4 rounded-lg border border-border hover:border-text-muted text-text-muted font-medium text-xs tracking-wide transition-colors cursor-pointer text-center bg-transparent"
              >
                {t("revoke")}
              </button>
            </div>

            {savedNote && (
              <p role="status" className="mt-4 inline-flex items-center gap-2 text-primary-ink text-xs font-medium">
                <Check size={13} className="stroke-[3]" aria-hidden="true" />
                {savedNote}
              </p>
            )}
          </div>
        </Section>

        {/* Tabulka cookies */}
        <Section title={t("section4")}>
          <p className="mb-2">{t("tableIntro")}</p>

          <div className="w-full border border-border rounded-xl overflow-hidden bg-dark/40 mt-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-dark/80 border-b border-border text-text-base font-bold">
                    <th className="p-4">{t("colName")}</th>
                    <th className="p-4">{t("colStorage")}</th>
                    <th className="p-4">{t("colProvider")}</th>
                    <th className="p-4">{t("colPurpose")}</th>
                    <th className="p-4">{t("colExpiry")}</th>
                    <th className="p-4">{t("colType")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-text-muted">
                  {STORAGE_LIST.map((item) => (
                    <tr key={item.name} className="hover:bg-dark/20 transition-colors">
                      <td className="p-4 font-mono text-text-base whitespace-nowrap">{item.name}</td>
                      <td className="p-4 whitespace-nowrap">{item.storage}</td>
                      <td className="p-4 whitespace-nowrap">{item.provider}</td>
                      <td className="p-4 min-w-[220px] leading-relaxed">{item.purpose[locale]}</td>
                      <td className="p-4 whitespace-nowrap">{item.expiry[locale]}</td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold ${
                          item.type === "necessary" ? "bg-primary/10 text-primary-ink border border-primary/20" : "bg-border/40 text-text-muted"
                        }`}>
                          {typeLabel[item.type]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        <Section title={t("section5")}>
          <p>{t("browserIntro")}</p>
          <ul>
            {BROWSER_HELP[locale].map((b) => (
              <li key={b.label}>
                <a href={b.href} target="_blank" rel="noopener noreferrer">{b.label}</a>
              </li>
            ))}
          </ul>
        </Section>
      </LegalLayout>
      <Footer />
    </>
  );
}
