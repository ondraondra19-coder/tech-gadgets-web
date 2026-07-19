"use client";

// Sekce „Jak to funguje" — 3 kroky na malinovém pozadí. Text zarovnaný doleva,
// samostatné bílé ikony (bez koleček), nákupní CTA vpravo nahoře vedle nadpisu
// → kompaktní, zabírá málo místa.
import Link from "next/link";
import { Crosshair, Droplets, Rocket, ArrowRight, type LucideIcon } from "lucide-react";
import { useT } from "@/lib/useT";

export default function HowItWorks() {
  const t = useT("howitworks");

  const steps: { icon: LucideIcon; title: string; desc: string }[] = [
    { icon: Crosshair, title: t("step1Title"), desc: t("step1Desc") },
    { icon: Droplets, title: t("step2Title"), desc: t("step2Desc") },
    { icon: Rocket, title: t("step3Title"), desc: t("step3Desc") },
  ];

  return (
    <section className="bg-accent py-12 lg:py-16">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">

        {/* Hlavička — text vlevo, nákupní CTA vpravo nahoře */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-10 lg:mb-12">
          <div className="max-w-2xl">
            <p className="text-white/75 text-sm font-bold uppercase tracking-[0.18em] mb-3">
              {t("eyebrow")}
            </p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-[1.1]">
              {t("title")}
            </h2>
            <p className="mt-4 text-white/90 text-base lg:text-lg leading-relaxed">
              {t("subtitle")}
            </p>
          </div>

          <Link
            href="/kategorie/zbrane"
            className="self-start md:shrink-0 inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-accent font-bold text-base shadow-lg hover:brightness-105 active:scale-[0.98] transition-all duration-150"
          >
            {t("cta")}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>

        {/* Kroky — vlevo zarovnané, samostatné ikony */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-start text-left gap-3">
              <Icon size={36} strokeWidth={1.75} className="text-white" aria-hidden="true" />
              <h3 className="text-lg lg:text-xl font-extrabold text-white">{title}</h3>
              <p className="text-white/90 text-base leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
