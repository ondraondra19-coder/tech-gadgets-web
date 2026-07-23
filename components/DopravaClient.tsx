"use client";

// Stránka /doprava — minimalistická, laděná do stejného systému jako ostatní
// info stránky (tmavý hero, eyebrow, čisté karty s okrajem). Ceny se berou
// z jediného zdroje pravdy (lib/shipping/pricing, lib/fees), ať se nikde
// nerozejdou s tím, co reálně počítá checkout.
import { ChevronRight, Clock, MapPin, RotateCcw, ArrowRight } from "lucide-react";
import Link from "next/link";
import { SHIPPING_PRICES } from "@/lib/shipping/pricing";
import { DOBIRKA_FEE } from "@/lib/fees";
import { formatPrice, CURRENCIES } from "@/lib/currency";
import { useT, type T } from "@/lib/useT";

function buildShipping(t: T) {
  return [
    {
      name: t("ship1Name"),
      desc: t("ship1Desc"),
      price: formatPrice(SHIPPING_PRICES.zasilkovna_box.CZK, CURRENCIES.CZK),
    },
    {
      name: t("ship2Name"),
      desc: t("ship2Desc"),
      price: formatPrice(SHIPPING_PRICES.zasilkovna_adresa.CZK, CURRENCIES.CZK),
    },
  ];
}

function buildPayment(t: T) {
  return [
    { name: t("pay1Name"), desc: t("pay1Desc"), price: t("free"), free: true },
    { name: t("pay2Name"), desc: t("pay2Desc"), price: t("free"), free: true },
    {
      name: t("pay3Name"),
      desc: t("pay3Desc"),
      price: `+ ${formatPrice(DOBIRKA_FEE.CZK, CURRENCIES.CZK)}`,
      free: false,
    },
  ];
}

function Row({ name, desc, price, accent }: { name: string; desc: string; price: string; accent?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-5 p-5 sm:p-6">
      <div className="min-w-0">
        <p className="text-text-base font-semibold text-base">{name}</p>
        <p className="text-text-muted text-sm leading-relaxed mt-1">{desc}</p>
      </div>
      <p className={`shrink-0 text-base font-bold tabular-nums whitespace-nowrap ${accent ? "text-primary-ink" : "text-text-base"}`}>
        {price}
      </p>
    </div>
  );
}

export default function DopravaClient() {
  const t = useT("shipping");
  const shipping = buildShipping(t);
  const payment = buildPayment(t);

  const facts = [
    { icon: Clock, text: t("fact1") },
    { icon: MapPin, text: t("fact2") },
    { icon: RotateCcw, text: t("fact3") },
  ];

  return (
    <main className="min-h-screen bg-surface">

      {/* ── Hero ── */}
      <div className="bg-header">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 py-14 lg:py-20">
          <nav className="flex items-center gap-2 text-xs text-white/30 mb-8">
            <Link href="/" className="hover:text-white/60 transition-colors">{t("home")}</Link>
            <ChevronRight size={11} aria-hidden="true" />
            <span className="text-white/60">{t("breadcrumb")}</span>
          </nav>

          <div className="max-w-2xl">
            <p className="text-primary-ink text-xs font-bold uppercase tracking-[0.18em] mb-4">
              {t("eyebrow")}
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight mb-5">
              {t("title")}
            </h1>
            <p className="text-white/50 text-base leading-relaxed">
              {t("intro")}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 lg:px-12 py-12 lg:py-16 flex flex-col gap-14">

        {/* ── Doprava ── */}
        <section>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-subtle mb-2">
            {t("shippingEyebrow")}
          </p>
          <h2 className="text-2xl font-extrabold text-text-base tracking-tight mb-6">
            {t("shippingTitle")}
          </h2>
          <div className="bg-white rounded-2xl border border-border shadow-sm divide-y divide-border">
            {shipping.map((s) => (
              <Row key={s.name} name={s.name} desc={s.desc} price={s.price} />
            ))}
          </div>
        </section>

        {/* ── Platba ── */}
        <section>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-subtle mb-2">
            {t("paymentEyebrow")}
          </p>
          <h2 className="text-2xl font-extrabold text-text-base tracking-tight mb-6">
            {t("paymentTitle")}
          </h2>
          <div className="bg-white rounded-2xl border border-border shadow-sm divide-y divide-border">
            {payment.map((p) => (
              <Row key={p.name} name={p.name} desc={p.desc} price={p.price} accent={p.free} />
            ))}
          </div>
        </section>

        {/* ── Fakta ── */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {facts.map((f) => (
            <div key={f.text} className="flex items-center gap-3 bg-white rounded-2xl border border-border shadow-sm px-5 py-4">
              <f.icon size={18} className="text-primary-ink shrink-0" aria-hidden="true" />
              <p className="text-text-base text-sm font-semibold leading-tight">{f.text}</p>
            </div>
          ))}
        </section>

        {/* ── Poznámka / odkaz ── */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 rounded-2xl border border-border bg-white shadow-sm p-6 sm:p-8">
          <div>
            <p className="text-text-base font-bold text-base mb-1">{t("noteTitle")}</p>
            <p className="text-text-muted text-sm leading-relaxed">{t("noteDesc")}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/faq"
              className="inline-flex items-center gap-1.5 text-primary-ink text-sm font-semibold hover:gap-2.5 transition-all whitespace-nowrap"
            >
              {t("noteFaq")}
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
            <Link
              href="/kontakt"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-on-primary font-bold text-sm hover:brightness-110 active:scale-[0.97] transition-all whitespace-nowrap"
            >
              {t("noteContact")}
            </Link>
          </div>
        </section>

      </div>
    </main>
  );
}
