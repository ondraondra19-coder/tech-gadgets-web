"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/lib/cart";
import Header from "@/components/Header";
import Image from "next/image";
import { ChevronRight, Check, Package, CreditCard, Building2, Truck, MapPin, AlertCircle, Tag } from "lucide-react";
import { useCurrency } from "@/lib/CurrencyContext";
import { formatPrice, getPrice } from "@/lib/currency";
import DiscountWidget from "@/components/DiscountWidget";
import posthog from "posthog-js";

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

const dopravyOptions = [
  { id: "ppl",        name: "PPL",        desc: "Doručení do 1–2 pracovních dní", price: { CZK: 129, EUR: 4.99, USD: 5.49 }, hasPickup: false },
  { id: "zasilkovna", name: "Zásilkovna", desc: "Výdejní místo dle výběru",        price: { CZK: 89,  EUR: 3.49, USD: 3.79 }, hasPickup: true  },
  { id: "dpd",        name: "DPD",        desc: "Doručení do 1–2 pracovních dní", price: { CZK: 119, EUR: 4.69, USD: 4.99 }, hasPickup: false },
];

const platbyOptions = [
  { id: "karta",   name: "Kartou online",    desc: "Visa, Mastercard, Apple Pay", icon: CreditCard },
  { id: "prevod",  name: "Bankovní převod",  desc: "Platba předem na účet",       icon: Building2  },
  { id: "dobirka", name: "Dobírka",          desc: "Platba při převzetí",         icon: Truck      },
];

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: "Košík",            href: "/kosik"      },
    { n: 2, label: "Doprava a platba", href: "/objednavka" },
    { n: 3, label: "Informace",        href: null          },
  ];
  return (
    <div className="flex items-center w-full mb-10">
      {steps.map((s, i) => {
        const done = s.n < step;
        const active = s.n === step;
        const clickable = done && s.href;
        return (
          <div key={s.n} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              {clickable ? (
                <a href={s.href!}>
                  <span className="w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center bg-primary text-white hover:brightness-110 transition-all">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7L5.5 10.5L12 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                </a>
              ) : (
                <span className={`w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center ${active ? "bg-primary text-dark" : "bg-border text-text-subtle"}`}>
                  {s.n}
                </span>
              )}
              <span className={`text-xs font-medium whitespace-nowrap ${active ? "text-text-base" : done ? "text-text-muted" : "text-text-subtle"}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mx-3 mb-5 transition-colors ${done ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ObjednavkaPage() {
  const { items, getTotalPrice, getItemPrice, appliedDiscount, getDiscountAmount, getFinalPrice } = useCart();
  const { currency } = useCurrency();
  const [doprava, setDoprava] = useState<string | null>(null);
  const [platba, setPlatba] = useState<string | null>(null);
  const [selectedZbox, setSelectedZbox] = useState<PacketaPoint | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ORDER_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.doprava) setDoprava(parsed.doprava);
        if (parsed.platba) setPlatba(parsed.platba);
      }
      const zbox = localStorage.getItem(ZBOX_KEY);
      if (zbox) setSelectedZbox(JSON.parse(zbox));
    } catch {}
  }, []);

  useEffect(() => {
    if (document.getElementById("packeta-script")) return;
    const script = document.createElement("script");
    script.id = "packeta-script";
    script.src = "https://widget.packeta.com/v6/www/js/library.js";
    document.body.appendChild(script);
  }, []);

  function openPacketaWidget() {
    if (!window.Packeta?.Widget) { alert("Widget se načítá, zkuste za chvíli."); return; }
    window.Packeta.Widget.pick("YOUR_API_KEY", (point) => {
      if (point) {
        setSelectedZbox(point);
        setErrors(prev => ({ ...prev, zasilkovna: "" }));
        try { localStorage.setItem(ZBOX_KEY, JSON.stringify(point)); } catch {}
      }
    }, { country: "cz", language: "cs" });
  }

  const selectedDoprava = dopravyOptions.find(d => d.id === doprava);
  const dobirkaExtra = platba === "dobirka" ? getPrice({ CZK: 39, EUR: 1.59, USD: 1.79 }, currency) : 0;
  const dopravaPrice = selectedDoprava ? getPrice(selectedDoprava.price, currency) : 0;
  const subtotal = getTotalPrice(currency);
  const discountAmount = getDiscountAmount(currency);
  const subtotalAfterDiscount = getFinalPrice(currency);
  const celkem = subtotalAfterDiscount + dopravaPrice + dobirkaExtra;

  function handleSubmit() {
    const e: Record<string, string> = {};
    if (!doprava) e.doprava = "Vyberte způsob dopravy";
    if (doprava === "zasilkovna" && !selectedZbox) e.zasilkovna = "Vyberte výdejní místo";
    if (!platba) e.platba = "Vyberte způsob platby";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    try {
      const rawDoprava = dopravyOptions.find(d => d.id === doprava);
      localStorage.setItem(ORDER_KEY, JSON.stringify({
        doprava,
        dopravaName: rawDoprava?.name,
        dopravaPrices: rawDoprava?.price,
        platba,
        platbaName: platbyOptions.find(p => p.id === platba)?.name,
        isDobirka: platba === "dobirka",
        zbox: selectedZbox ?? null,
        // Uložíme i slevový kód pro další stránky
        discountCode: appliedDiscount?.code ?? null,
        discountLabel: appliedDiscount?.label ?? null,
      }));
    } catch {}

    window.location.href = "/informace";
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-dark">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 py-10">

          <nav className="flex items-center gap-2 text-xs text-text-subtle mb-8">
            <a href="/" className="hover:text-text-muted transition-colors">Domů</a>
            <ChevronRight size={12} className="text-border" />
            <a href="/kosik" className="hover:text-text-muted transition-colors">Košík</a>
            <ChevronRight size={12} className="text-border" />
            <span className="text-text-muted">Doprava a platba</span>
          </nav>

          <Stepper step={2} />

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1 flex flex-col gap-6">

              {/* Doprava */}
              <div className="bg-secondary border border-border rounded-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-border">
                  <h2 className="text-text-base font-semibold text-lg">Způsob dopravy</h2>
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
                          if (opt.id !== "zasilkovna") setSelectedZbox(null);
                          posthog.capture("shipping_method_selected", {
                            shipping_method: opt.id,
                            shipping_name: opt.name,
                          });
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
                        <div className="flex-1">
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
                            <MapPin size={14} className={selectedZbox ? "text-primary" : errors.zasilkovna ? "text-red-500" : "text-text-subtle"} />
                            {selectedZbox ? selectedZbox.nameStreet : "Vybrat výdejní místo"}
                            {selectedZbox && <Check size={13} className="text-primary ml-1" />}
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
                  <h2 className="text-text-base font-semibold text-lg">Způsob platby</h2>
                </div>
                <div className="p-4 flex flex-col gap-2">
                  {errors.platba && (
                    <p className="flex items-center gap-1.5 text-red-500 text-xs px-2 pb-1">
                      <AlertCircle size={12} /> {errors.platba}
                    </p>
                  )}
                  {platbyOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setPlatba(opt.id);
                        setErrors(prev => ({ ...prev, platba: "" }));
                        posthog.capture("payment_method_selected", {
                          payment_method: opt.id,
                          payment_name: opt.name,
                        });
                      }}
                      className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-150 ${
                        platba === opt.id ? "border-primary bg-primary/5" : "border-border hover:border-border-strong bg-dark"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${platba === opt.id ? "border-primary" : "border-border-strong"}`}>
                        {platba === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <opt.icon size={18} className="text-primary" />
                      </div>
                      <div className="flex-1">
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
                  <h2 className="text-text-base font-semibold text-sm">Objednávka</h2>
                  <a href="/kosik" className="text-primary text-xs hover:underline">Upravit</a>
                </div>
                <div className="px-5 py-3 flex flex-col gap-3 max-h-52 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.slug + JSON.stringify(item.variants)} className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-lg bg-dark/5 border border-border shrink-0 overflow-hidden">
                        <Image src={item.img} alt={item.name} fill className="object-contain p-1" />
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
                    <span className="text-text-muted">Mezisoučet</span>
                    <span className={`font-medium ${appliedDiscount && discountAmount > 0 ? "text-text-subtle line-through" : "text-text-base"}`}>
                      {formatPrice(subtotal, currency)}
                    </span>
                  </div>
                  {/* Sleva */}
                  {appliedDiscount && discountAmount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-600 flex items-center gap-1.5">
                        <Tag size={12} /> <span className="notranslate" translate="no">{appliedDiscount.code}</span>
                      </span>
                      <span className="text-green-600 font-semibold">− {formatPrice(discountAmount, currency)}</span>
                    </div>
                  )}
                  {/* Doprava */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted">Doprava</span>
                    <span className="text-text-base font-medium">
                      {selectedDoprava ? formatPrice(dopravaPrice, currency) : "—"}
                    </span>
                  </div>
                  {platba === "dobirka" && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-muted">Dobírka</span>
                      <span className="text-text-base font-medium">{formatPrice(dobirkaExtra, currency)}</span>
                    </div>
                  )}
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between">
                    <span className="text-text-base font-bold">Celkem</span>
                    <span className="text-primary font-extrabold text-xl">{formatPrice(celkem, currency)}</span>
                  </div>
                </div>

                {/* Discount widget */}
                <div className="px-5 pb-4">
                  <DiscountWidget />
                </div>

                <div className="px-5 pb-5">
                  <button onClick={handleSubmit}
                    className="w-full py-4 rounded-2xl bg-primary text-dark font-bold text-sm hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                    Pokračovat k informacím <ChevronRight size={15} />
                  </button>
                  <p className="text-text-subtle text-xs text-center mt-3">Zabezpečená platba · SSL šifrování</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </>
  );
}