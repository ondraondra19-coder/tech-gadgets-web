"use client";

import { ShieldCheck, Truck, RotateCcw, Headphones } from "lucide-react";
import { useT } from "@/lib/useT";

export default function TrustBar() {
  const t = useT("trustbar");

  // Klíče schválně vypsané, ne skládané přes `t(`${key}Title`)` — takhle je
  // najde scripts/check-messages.mjs a pozná, že se používají.
  // Pořadí: bezpečnost jako první — pro rodiče je to hlavní argument.
  const items = [
    { icon: ShieldCheck, title: t("safetyTitle"),   desc: t("safetyDesc")   },
    { icon: Truck,       title: t("shippingTitle"), desc: t("shippingDesc") },
    { icon: RotateCcw,   title: t("returnsTitle"),  desc: t("returnsDesc")  },
    { icon: Headphones,  title: t("supportTitle"),  desc: t("supportDesc")  },
  ];

  return (
    <section className="bg-accent py-14 lg:py-16">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-12">
          {items.map((item) => (
            <div key={item.title} className="flex flex-col items-center text-center gap-4">
              {/* Velká ikona v bílém čtverci — vynikne na malinovém pozadí, žádné
                  oddělovací linky. */}
              <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                <item.icon size={32} strokeWidth={1.75} className="text-primary-ink" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-white font-bold text-base">{item.title}</p>
                <p className="text-white/90 text-sm leading-relaxed max-w-[220px]">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
