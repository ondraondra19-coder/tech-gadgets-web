"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/lib/cart";
import Header from "@/components/Header";
import Image from "next/image";
import { ChevronRight, Check, Package, CreditCard, Building2, Truck, MapPin, AlertCircle, Tag } from "lucide-react";
import { useCurrency } from "@/lib/CurrencyContext";
import { formatPrice, getPrice } from "@/lib/currency";
import DiscountWidget from "@/components/DiscountWidget";
import {
  SHIPPING_PRICES,
  SHIPPING_CANONICAL_NAMES,
  PAYMENT_CANONICAL_NAMES,
  type ShippingId,
  type PaymentId,
} from "@/lib/shipping/pricing";
import { useT, type T } from "@/lib/useT";
import { useLang } from "@/lib/LangContext";
import { DOBIRKA_FEE } from "@/lib/fees";
import { trackEvent } from "@/lib/analytics";
import { isBankTransferEnabled } from "@/lib/featureFlags";
import CheckoutStepper from "@/components/CheckoutStepper";

declare global {
  interface Window {
    Packeta: {
      Widget: {
        pick: (apiKey: string, callback: (point: PacketaPoint | null) => void, options?: object) => void;
      };
    };
  }
}

type PacketaPoint = {
  id: string;
  name: string;
  nameStreet: string;
  city: string;
  zip: string;
};

const ZBOX_KEY = "hackpack-zbox";
export const ORDER_KEY = "hackpack-order";

// Popisky pro zákazníka; do záznamu objednávky se ukládá české jméno
// z SHIPPING_CANONICAL_NAMES / PAYMENT_CANONICAL_NAMES podle `id`.
function buildDopravyOptions(t: T) {
  return [
    { id: "zasilkovna_box",    name: t("shipBoxName"),    desc: t("shipBoxDesc"),    price: SHIPPING_PRICES.zasilkovna_box,    hasPickup: true  },
    { id: "zasilkovna_adresa", name: t("shipAddrName"),   desc: t("shipAddrDesc"),   price: SHIPPING_PRICES.zasilkovna_adresa, hasPickup: false },
  ];
}

function buildPlatbyOptions(t: T) {
  return [
    { id: "karta",   name: t("payCardName"),     desc: t("payCardDesc"),     icon: CreditCard },
    { id: "prevod",  name: t("payTransferName"), desc: t("payTransferDesc"), icon: Building2  },
    { id: "dobirka", name: t("payCodName"),      desc: t("payCodDesc"),      icon: Truck      },
  ];
}

// Packeta nemá žádný veřejný sandbox — ani pro plné API (createPacket), ani
// pro tenhle výdejní widget — obojí vyžaduje reálný schválený účet (~3 dny).
// Dokud NEXT_PUBLIC_PACKETA_API_KEY chybí A běžíme v lokálním vývoji, použije
// se tahle vymyšlená nabídka míst místo skutečného widgetu, ať jde celý
// checkout flow (výběr Z-BOXu → objednávka → admin) otestovat naostro i bez
// reálných přístupů. V produkci se mock nikdy nezobrazí — tam beze klíče
// zůstává původní chybová hláška.
const MOCK_ZBOXES: PacketaPoint[] = [
  { id: "99001", name: "Z-BOX Praha, Václavské náměstí", nameStreet: "Václavské náměstí 1", city: "Praha", zip: "11000" },
  { id: "99002", name: "Výdejní místo Brno, náměstí Svobody", nameStreet: "náměstí Svobody 4", city: "Brno", zip: "60200" },
  { id: "99003", name: "Z-BOX Ostrava, Nádražní", nameStreet: "Nádražní 123", city: "Ostrava", zip: "70200" },
];

function MockZboxModal({ onPick, onClose }: { onPick: (point: PacketaPoint) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div>
            <p className="text-text-base font-semibold text-sm">Vybrat výdejní místo</p>
            <p className="text-text-subtle text-xs mt-0.5">Testovací nabídka — skutečný widget zatím nemá API klíč</p>
          </div>
          <button onClick={onClose} className="text-text-subtle hover:text-text-base transition-colors shrink-0">✕</button>
        </div>
        <div className="p-2">
          {MOCK_ZBOXES.map((point) => (
            <button
              key={point.id}
              onClick={() => onPick(point)}
              className="w-full flex items-start gap-2 text-left px-4 py-3 rounded-xl hover:bg-surface transition-colors"
            >
              <MapPin size={14} className="text-primary-ink mt-0.5 shrink-0" />
              <span>
                <span className="block text-text-base text-sm font-semibold">{point.name}</span>
                <span className="block text-text-subtle text-xs">{point.nameStreet}, {point.zip} {point.city}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}


export default function ObjednavkaPage() {
  const { items, getTotalPrice, getItemPrice, appliedDiscount, getDiscountAmount, getFinalPrice } = useCart();
  const { currency } = useCurrency();
  const t = useT("checkout");
  const { locale } = useLang();
  const dopravyOptions = buildDopravyOptions(t);
  const platbyOptions = buildPlatbyOptions(t);
  const [doprava, setDoprava] = useState<string | null>(null);
  const [platba, setPlatba] = useState<string | null>(null);
  const [selectedZbox, setSelectedZbox] = useState<PacketaPoint | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mockPickerOpen, setMockPickerOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ORDER_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.doprava) setDoprava(parsed.doprava);
        // Nenačteme "prevod" ze staršího uloženého výběru, pokud je teď
        // dočasně vypnutý (jinak by šel vybraný, i když v nabídce vůbec není).
        if (parsed.platba && (parsed.platba !== "prevod" || isBankTransferEnabled())) setPlatba(parsed.platba);
      }
      const zbox = localStorage.getItem(ZBOX_KEY);
      if (zbox) setSelectedZbox(JSON.parse(zbox));
    } catch {}
  }, []);

  // Bankovní převod v USD by reálně znamenal drahý a pomalý mezinárodní
  // SWIFT převod (žádné IBAN/SEPA jako u EUR) — pro malý e-shop to nedává
  // smysl, takže tuhle možnost pro USD vůbec nenabízíme. Dočasně (viz
  // lib/featureFlags.ts) je pro USD i mimo lokální vývoj vypnutý úplně —
  // účtenka ještě není hotová naostro (chybí IČO).
  const availablePlatbyOptions = platbyOptions.filter(
    (o) => !(o.id === "prevod" && (currency.code === "USD" || !isBankTransferEnabled())),
  );

  // Zruší dřív vybraný převod, pokud zákazník mezitím přepnul měnu na USD
  // (adjust-state-during-render vzor, ne efekt — viz React docs).
  const [prevCurrencyCode, setPrevCurrencyCode] = useState(currency.code);
  if (currency.code !== prevCurrencyCode) {
    setPrevCurrencyCode(currency.code);
    if (currency.code === "USD" && platba === "prevod") setPlatba(null);
  }

  useEffect(() => {
    if (document.getElementById("packeta-script")) return;
    const script = document.createElement("script");
    script.id = "packeta-script";
    script.src = "https://widget.packeta.com/v6/www/js/library.js";
    document.body.appendChild(script);
  }, []);

  function pickZboxPoint(point: PacketaPoint) {
    setSelectedZbox(point);
    setErrors(prev => ({ ...prev, zasilkovna: "" }));
    try { localStorage.setItem(ZBOX_KEY, JSON.stringify(point)); } catch {}
  }

  function openPacketaWidget() {
    const apiKey = process.env.NEXT_PUBLIC_PACKETA_API_KEY;
    if (!apiKey) {
      if (process.env.NODE_ENV === "development") {
        setMockPickerOpen(true);
        return;
      }
      // Název env proměnné patří do konzole, ne do očí zákazníka — ten s tím
      // nic nezmůže a jen ho to vyděsí.
      console.error("Chybí NEXT_PUBLIC_PACKETA_API_KEY — widget výdejních míst nelze otevřít.");
      alert(t("widgetUnavailable"));
      return;
    }
    if (!window.Packeta?.Widget) { alert(t("widgetLoading")); return; }
    // Widget Zásilkovny umí cs/sk/en — ať se otevře v jazyce, který si
    // zákazník zvolil, místo natvrdo české verze.
    window.Packeta.Widget.pick(apiKey, (point) => {
      if (point) pickZboxPoint(point);
    }, { country: "cz", language: locale });
  }

  const selectedDoprava = dopravyOptions.find(d => d.id === doprava);
  const dobirkaExtra = platba === "dobirka" ? getPrice(DOBIRKA_FEE, currency) : 0;
  const dopravaPrice = selectedDoprava ? getPrice(selectedDoprava.price, currency) : 0;
  const subtotal = getTotalPrice(currency);
  const discountAmount = getDiscountAmount(currency);
  const subtotalAfterDiscount = getFinalPrice(currency);
  const celkem = subtotalAfterDiscount + dopravaPrice + dobirkaExtra;

  function handleSubmit() {
    const e: Record<string, string> = {};
    if (!doprava) e.doprava = t("errShipping");
    if (doprava === "zasilkovna_box" && !selectedZbox) e.zasilkovna = t("errPickPoint");
    if (!platba) e.platba = t("errPayment");
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    try {
      const rawDoprava = dopravyOptions.find(d => d.id === doprava);
      localStorage.setItem(ORDER_KEY, JSON.stringify({
        doprava,
        // Do záznamu jde české jméno podle ID, ne přeložený popisek z UI —
        // tenhle údaj končí ve Stripe, v e-mailech a v administraci, které
        // jsou české. Viz komentář v lib/shipping/pricing.ts.
        dopravaName: SHIPPING_CANONICAL_NAMES[doprava as ShippingId],
        dopravaPrices: rawDoprava?.price,
        platba,
        platbaName: PAYMENT_CANONICAL_NAMES[platba as PaymentId],
        isDobirka: platba === "dobirka",
        zbox: selectedZbox ?? null,
        // Uložíme i slevový kód pro další stránky
        discountCode: appliedDiscount?.code ?? null,
        discountLabel: appliedDiscount?.label ?? null,
      }));
    } catch {}

    trackEvent("checkout_step_completed", { step: 2 });
    window.location.href = "/informace";
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-dark">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 py-10">

          <nav className="flex items-center gap-2 text-xs text-text-subtle mb-8">
            <a href="/" className="hover:text-text-muted transition-colors">{t("home")}</a>
            <ChevronRight size={12} className="text-border" aria-hidden="true" />
            <a href="/kosik" className="hover:text-text-muted transition-colors">{t("cart")}</a>
            <ChevronRight size={12} className="text-border" aria-hidden="true" />
            <span className="text-text-muted">{t("title")}</span>
          </nav>

          <CheckoutStepper step={2} />

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1 flex flex-col gap-6">

              {/* Doprava */}
              <div className="bg-secondary border border-border rounded-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-border">
                  <h2 className="text-text-base font-semibold text-lg">{t("shippingHeading")}</h2>
                </div>
                <div className="p-4 flex flex-col gap-2">
                  {errors.doprava && (
                    <p className="flex items-center gap-1.5 text-red-500 text-xs px-2 pb-1">
                      <AlertCircle size={12} /> {errors.doprava}
                    </p>
                  )}
                  {dopravyOptions.map((opt) => (
                    <div key={opt.id}>
                      <button
                        onClick={() => {
                          setDoprava(opt.id);
                          setErrors(prev => ({ ...prev, doprava: "", zasilkovna: "" }));
                          if (opt.id !== "zasilkovna_box") setSelectedZbox(null);
                        }}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-150 ${
                          doprava === opt.id ? "border-primary bg-primary/5" : "border-border hover:border-border-strong bg-dark"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${doprava === opt.id ? "border-primary" : "border-border-strong"}`}>
                          {doprava === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-border flex items-center justify-center shrink-0">
                          <Package size={16} className="text-text-subtle" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-text-base font-medium text-sm">{opt.name}</p>
                          <p className="text-text-subtle text-xs mt-0.5">{opt.desc}</p>
                        </div>
                        <p className="text-text-base font-semibold text-sm shrink-0">{formatPrice(getPrice(opt.price, currency), currency)}</p>
                      </button>

                      {opt.hasPickup && doprava === opt.id && (
                        <div className="mt-2 ml-4">
                          <button
                            onClick={openPacketaWidget}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all ${
                              selectedZbox ? "border-primary/40 bg-primary/5 text-text-base"
                              : errors.zasilkovna ? "border-red-400 text-red-500"
                              : "border-dashed border-border-strong text-text-muted hover:border-primary/40 hover:text-text-base"
                            }`}
                          >
                            <MapPin size={14} className={selectedZbox ? "text-primary-ink" : errors.zasilkovna ? "text-red-500" : "text-text-subtle"} />
                            {selectedZbox ? selectedZbox.nameStreet : t("pickPoint")}
                            {selectedZbox && <Check size={13} className="text-primary-ink ml-1" />}
                          </button>
                          {errors.zasilkovna && (
                            <p className="flex items-center gap-1 text-red-500 text-xs mt-1 ml-1">
                              <AlertCircle size={11} /> {errors.zasilkovna}
                            </p>
                          )}
                          {selectedZbox && (
                            <p className="text-text-subtle text-xs mt-1 ml-1">{selectedZbox.city}, {selectedZbox.zip}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Platba */}
              <div className="bg-secondary border border-border rounded-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-border">
                  <h2 className="text-text-base font-semibold text-lg">{t("paymentHeading")}</h2>
                </div>
                <div className="p-4 flex flex-col gap-2">
                  {errors.platba && (
                    <p className="flex items-center gap-1.5 text-red-500 text-xs px-2 pb-1">
                      <AlertCircle size={12} /> {errors.platba}
                    </p>
                  )}
                  {availablePlatbyOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => { setPlatba(opt.id); setErrors(prev => ({ ...prev, platba: "" })); }}
                      className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-150 ${
                        platba === opt.id ? "border-primary bg-primary/5" : "border-border hover:border-border-strong bg-dark"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${platba === opt.id ? "border-primary" : "border-border-strong"}`}>
                        {platba === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <opt.icon size={18} className="text-primary-ink" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-text-base font-medium text-sm">{opt.name}</p>
                        <p className="text-text-subtle text-xs mt-0.5">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Souhrn */}
            <div className="w-full lg:w-80 shrink-0 sticky top-24 flex flex-col gap-4">
              <div className="bg-secondary border border-border rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <h2 className="text-text-base font-semibold text-sm">{t("orderHeading")}</h2>
                  <a href="/kosik" className="text-primary-ink text-xs hover:underline">{t("edit")}</a>
                </div>
                <div className="px-5 py-3 flex flex-col gap-3 max-h-52 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.slug + JSON.stringify(item.variants)} className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-lg bg-dark/5 border border-border shrink-0 overflow-hidden">
                        <Image src={item.img} alt="" fill className="object-contain p-1" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-text-base text-xs font-medium line-clamp-1">{item.name}</p>
                        <p className="text-text-subtle text-xs">× {item.quantity}</p>
                      </div>
                      <p className="text-text-base text-xs font-semibold shrink-0">
                        {formatPrice(getItemPrice(item, currency) * item.quantity, currency)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-secondary border border-border rounded-2xl overflow-hidden">
                <div className="px-5 py-4 flex flex-col gap-3">
                  {/* Mezisoučet */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted">{t("subtotal")}</span>
                    <span className={`font-medium ${appliedDiscount && discountAmount > 0 ? "text-text-subtle line-through" : "text-text-base"}`}>
                      {formatPrice(subtotal, currency)}
                    </span>
                  </div>
                  {/* Sleva */}
                  {appliedDiscount && discountAmount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-600 flex items-center gap-1.5">
                        <Tag size={12} aria-hidden="true" /> <span>{appliedDiscount.code}</span>
                      </span>
                      <span className="text-green-600 font-semibold">− {formatPrice(discountAmount, currency)}</span>
                    </div>
                  )}
                  {/* Doprava */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted">{t("shipping")}</span>
                    <span className="text-text-base font-medium">
                      {selectedDoprava ? formatPrice(dopravaPrice, currency) : "—"}
                    </span>
                  </div>
                  {platba === "dobirka" && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-muted">{t("cod")}</span>
                      <span className="text-text-base font-medium">{formatPrice(dobirkaExtra, currency)}</span>
                    </div>
                  )}
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between">
                    <span className="text-text-base font-bold">{t("total")}</span>
                    <span className="text-primary-ink font-extrabold text-xl">{formatPrice(celkem, currency)}</span>
                  </div>
                </div>

                {/* Discount widget */}
                <div className="px-5 pb-4">
                  <DiscountWidget />
                </div>

                <div className="px-5 pb-5">
                  <button onClick={handleSubmit}
                    className="w-full py-4 rounded-2xl bg-primary text-on-primary font-bold text-sm hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                    {t("continueToInfo")} <ChevronRight size={15} aria-hidden="true" />
                  </button>
                  <p className="text-text-subtle text-xs text-center mt-3">{t("securePayment")}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
      {mockPickerOpen && (
        <MockZboxModal
          onPick={(point) => { pickZboxPoint(point); setMockPickerOpen(false); }}
          onClose={() => setMockPickerOpen(false)}
        />
      )}
    </>
  );
}