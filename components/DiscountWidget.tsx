"use client";

import { useState } from "react";
import { Tag, X, Check, AlertCircle, Sparkles, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useCurrency } from "@/lib/CurrencyContext";
import { formatPrice } from "@/lib/currency";
import { approxConvert, getActiveSlugs } from "@/lib/discounts";
import { products } from "@/lib/products";
import { CURRENCIES } from "@/lib/currency";
import posthog from "posthog-js";

export default function DiscountWidget() {
  const { applyDiscountCode, removeDiscount, appliedDiscount, totalPriceCZK, isDiscountActive } = useCart();
  const { currency } = useCurrency();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "invalid">("idle");

  const active = isDiscountActive();

  // Chybějící částka vždy v CZK (tak je minimum definované)
  const missingCZK = appliedDiscount?.minOrderCZK
    ? Math.max(0, appliedDiscount.minOrderCZK - totalPriceCZK)
    : 0;

  // Orientační přepočet do aktuální měny (jen pro zobrazení)
  const showApprox = currency.code !== "CZK" && missingCZK > 0;
  const missingApprox = showApprox
    ? approxConvert(missingCZK, currency.code)
    : 0;

  function handleApply() {
    if (!code.trim()) return;
    const result = applyDiscountCode(code);
    setStatus(result);
    if (result === "ok") {
      posthog.capture("discount_code_applied", {
        discount_code: code.toUpperCase(),
      });
      setCode("");
    }
  }

  function handleRemove() {
    removeDiscount();
    setStatus("idle");
    setCode("");
  }

  if (appliedDiscount) {
    return (
      <div className="flex flex-col gap-2">
        {/* Hlavička — zelená pokud aktivní, amber pokud pod minimem */}
        <div className={`flex items-center justify-between gap-2 px-3.5 py-3 rounded-xl border ${
          active ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${active ? "bg-green-500" : "bg-amber-400"}`}>
              <Check size={12} strokeWidth={3} className="text-white" />
            </div>
            <div>
              <p className={`text-xs font-extrabold tracking-wide notranslate ${active ? "text-green-800" : "text-amber-800"}`} translate="no">
                {appliedDiscount.code}
              </p>
              <p className={`text-[11px] ${active ? "text-green-600" : "text-amber-600"}`}>
                {appliedDiscount.label}
              </p>
              {(() => {
                const slugs = getActiveSlugs(appliedDiscount);
                return slugs && slugs.length > 0 ? (
                  <p className="text-[10px] text-amber-500 mt-0.5">
                    Platí jen pro: {slugs.map(s => products.find(p => p.slug === s)?.name ?? s).join(", ")}
                  </p>
                ) : null;
              })()}
            </div>
          </div>
          <button
            onClick={handleRemove}
            className={`p-1 rounded-lg transition-colors ${active ? "text-green-400 hover:text-green-700 hover:bg-green-100" : "text-amber-400 hover:text-amber-700 hover:bg-amber-100"}`}
          >
            <X size={14} />
          </button>
        </div>

        {/* Upsell — pod minimem */}
        {missingCZK > 0 && (
          <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-amber-50 border border-amber-200">
            <Sparkles size={14} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-amber-800 text-xs leading-relaxed">
              Nakupte ještě za{" "}
              <span className="font-extrabold text-amber-900">
                {showApprox
                  ? <>{formatPrice(missingApprox, currency)}*</>
                  : formatPrice(missingCZK, CURRENCIES.CZK)
                }
              </span>
              {" "}a sleva se automaticky uplatní!
              <a
                href="/"
                className="ml-1.5 inline-flex items-center gap-0.5 text-amber-700 font-semibold hover:text-amber-900 transition-colors underline underline-offset-2"
              >
                Přejít do obchodu <ArrowRight size={11} />
              </a>
              {showApprox && (
                <span className="block text-amber-500 text-[10px] mt-1">
                  * Orientační přepočet. Podmínka platnosti kódu se počítá v Kč.
                </span>
              )}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle pointer-events-none" />
          <input
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setStatus("idle"); }}
            onKeyDown={e => e.key === "Enter" && handleApply()}
            placeholder="Slevový kód"
            className={`w-full pl-8 pr-3 py-2.5 text-sm rounded-xl border bg-dark text-text-base placeholder-text-subtle focus:outline-none transition-colors ${
              status === "invalid" ? "border-red-400 focus:border-red-400" : "border-border focus:border-primary/50"
            }`}
          />
        </div>
        <button
          onClick={handleApply}
          disabled={!code.trim()}
          className="px-4 py-2.5 rounded-xl bg-primary text-dark font-bold text-sm hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          Uplatnit
        </button>
      </div>
      {status === "invalid" && (
        <p className="flex items-center gap-1 text-red-500 text-xs">
          <AlertCircle size={11} /> Tento kód neexistuje nebo již není platný.
        </p>
      )}
    </div>
  );
}