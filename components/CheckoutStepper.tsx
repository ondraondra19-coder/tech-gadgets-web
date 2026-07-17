"use client";

// components/CheckoutStepper.tsx
// Ukazatel kroku objednávky: Košík → Doprava a platba → Informace.
//
// PROČ ZVLÁŠŤ: byl třikrát zkopírovaný (kosik, objednavka, informace) — tři
// kopie stejného kódu, které se lišily jen zalomením řádků, a při překladu by
// každá potřebovala vlastní klíče. Popisky kroků teď žijí na jednom místě.

import { useT } from "@/lib/useT";

export default function CheckoutStepper({ step }: { step: 1 | 2 | 3 }) {
  const t = useT("cart");

  const steps = [
    { n: 1, label: t("step1"), href: "/kosik" as string | null },
    { n: 2, label: t("step2"), href: "/objednavka" as string | null },
    { n: 3, label: t("step3"), href: null as string | null },
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
                <a href={s.href!} aria-label={t("backToStep", { step: s.label })}>
                  <span className="w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center bg-primary text-on-primary hover:brightness-110 transition-all">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path d="M2 7L5.5 10.5L12 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </a>
              ) : (
                <span className={`w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center ${active ? "bg-primary text-on-primary" : "bg-border text-text-subtle"}`}>
                  {s.n}
                </span>
              )}
              <span className={`text-xs font-medium whitespace-nowrap ${active ? "text-text-base" : done ? "text-text-muted" : "text-text-subtle"}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div aria-hidden="true" className={`flex-1 h-px mx-3 mb-5 transition-colors ${done ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
