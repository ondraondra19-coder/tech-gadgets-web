"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ChevronRight, Phone, Mail, MapPin, Clock, Check, Send } from "lucide-react";
import { useT } from "@/lib/useT";
import { UDAJE, telHref, mailHref } from "@/lib/udaje";

export default function KontaktPage() {
  const t = useT("contact");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = !!name && !!email && !!message && !sending;

  // API vrací kód, ne hotovou větu — text vybíráme tady podle jazyka. Neznámý
  // kód spadne na obecné "nepovedlo se", ať nikdy neukážeme "contact.neco".
  function messageForCode(code: unknown, minutes: unknown): string {
    switch (code) {
      case "invalid_name":  return t("errorInvalidName");
      case "invalid_email": return t("errorInvalidEmail");
      case "invalid_text":  return t("errorInvalidText");
      case "cooldown":      return t("errorCooldown", { minutes: typeof minutes === "number" ? minutes : 5 });
      default:              return t("errorFailed");
    }
  }

  // Formulář posílá do stejného endpointu jako chat widget — zpráva se objeví
  // v adminu na jednom místě a jde z ní odpovědět e-mailem. `source` jen
  // odliší, odkud přišla.
  async function handleSubmit() {
    if (!canSubmit) return;

    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, text: message, source: "kontakt" }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(messageForCode(data?.code, data?.minutes));
      }

      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorFailed"));
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 py-10">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-text-subtle mb-8">
            <Link href="/" className="hover:text-text-muted transition-colors">{t("home")}</Link>
            <ChevronRight size={12} className="text-border" aria-hidden="true" />
            <span className="text-text-muted">{t("title")}</span>
          </nav>

          <div className="mb-10">
            <p className="text-text-subtle text-xs font-semibold uppercase tracking-widest mb-2">{t("eyebrow")}</p>
            <h1 className="text-4xl font-extrabold text-text-base tracking-tight">{t("title")}</h1>
          </div>

          {/* Dvě karty vedle sebe */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            {/* Kontaktní info */}
            <div className="bg-white rounded-2xl shadow-sm p-8 flex flex-col gap-8">
              <div>
                <h2 className="text-lg font-bold text-text-base mb-5">{t("detailsHeading")}</h2>
                <div className="flex flex-col gap-5">
                  <a href={telHref} className="flex items-start gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Phone size={18} className="text-primary-ink" />
                    </div>
                    <div>
                      <p className="text-text-subtle text-xs mb-0.5">{t("phone")}</p>
                      <p className="text-text-base font-semibold group-hover:text-primary-ink transition-colors">{UDAJE.phone}</p>
                    </div>
                  </a>
                  <a href={mailHref} className="flex items-start gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Mail size={18} className="text-primary-ink" />
                    </div>
                    <div>
                      <p className="text-text-subtle text-xs mb-0.5">{t("email")}</p>
                      <p className="text-text-base font-semibold group-hover:text-primary-ink transition-colors">{UDAJE.email}</p>
                    </div>
                  </a>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPin size={18} className="text-primary-ink" />
                    </div>
                    <div>
                      <p className="text-text-subtle text-xs mb-0.5">{t("address")}</p>
                      <p className="text-text-base font-semibold">{UDAJE.addressStreet}</p>
                      <p className="text-text-muted text-sm">{UDAJE.addressCity}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold text-text-base mb-5">{t("hoursHeading")}</h2>
                <div className="flex flex-col gap-2">
                  {/* `closed` je vlastní příznak, ne porovnání textu s "Zavřeno" —
                      to by po překladu přestalo platit a neděle by se vykreslila
                      jako otevřený den. */}
                  {[
                    { day: t("weekdays"), time: UDAJE.openingHours.weekdays, closed: false },
                    { day: t("saturday"), time: UDAJE.openingHours.saturday, closed: false },
                    { day: t("sunday"),   time: t("closed"),                 closed: true  },
                  ].map((row) => (
                    <div key={row.day} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-2">
                        <Clock size={13} className="text-text-subtle" aria-hidden="true" />
                        <span className="text-text-muted text-sm">{row.day}</span>
                      </div>
                      <span className={`text-sm font-semibold ${row.closed ? "text-text-subtle" : "text-text-base"}`}>{row.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Formulář */}
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-lg font-bold text-text-base mb-5">{t("formHeading")}</h2>

              {sent ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                    <Check size={24} className="text-green-600" aria-hidden="true" />
                  </div>
                  <p className="text-text-base font-semibold">{t("sentTitle")}</p>
                  <p className="text-text-muted text-sm">{t("sentDesc")}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-text-muted text-xs font-medium mb-1.5">{t("nameLabel")}</label>
                      <input value={name} onChange={e => setName(e.target.value)} placeholder={t("namePlaceholder")} aria-label={t("nameLabel")}
                        className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-text-base placeholder-text-subtle focus:outline-none focus:border-primary/50 transition-colors bg-surface" />
                    </div>
                    <div>
                      <label className="block text-text-muted text-xs font-medium mb-1.5">{t("emailLabel")}</label>
                      <input value={email} onChange={e => setEmail(e.target.value)} placeholder={t("emailPlaceholder")} aria-label={t("emailLabel")}
                        className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-text-base placeholder-text-subtle focus:outline-none focus:border-primary/50 transition-colors bg-surface" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-text-muted text-xs font-medium mb-1.5">{t("messageLabel")}</label>
                    <textarea value={message} onChange={e => setMessage(e.target.value)}
                      placeholder={t("messagePlaceholder")} aria-label={t("messageLabel")}
                      rows={6}
                      className="w-full border border-border rounded-xl px-4 py-3 text-sm text-text-base placeholder-text-subtle focus:outline-none focus:border-primary/50 transition-colors resize-none bg-surface" />
                  </div>
                  {error && (
                    <p role="alert" className="text-red-500 text-xs">{error}</p>
                  )}
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all w-fit ${
                      !canSubmit
                        ? "bg-border text-text-subtle cursor-not-allowed"
                        : "bg-primary text-on-primary hover:brightness-105 active:scale-[0.98]"
                    }`}
                  >
                    <Send size={14} aria-hidden="true" />
                    {sending ? t("sending") : t("submit")}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mapa */}
          <div className="rounded-2xl overflow-hidden shadow-sm h-80 bg-secondary">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d556.5826985800264!2d14.49496265000414!3d50.01383019076257!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x470b9188ab408c39%3A0x5c94b3ab8962c3c1!2sV%20Jahod%C3%A1ch%20887%2C%20148%2000%20Praha-Kunratice!5e0!3m2!1scs!2scz!4v1775937349401!5m2!1scs!2scz"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}