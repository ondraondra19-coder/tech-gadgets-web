"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";
import { ChevronRight, ShieldCheck, Truck, RotateCcw, Headphones, HelpCircle, ArrowRight } from "lucide-react";
import { useT } from "@/lib/useT";

export default function ONasPage() {
  const t = useT("about");

  const values = [
    { icon: ShieldCheck, title: t("value1Title"), desc: t("value1Desc") },
    { icon: Truck,       title: t("value2Title"), desc: t("value2Desc") },
    { icon: RotateCcw,   title: t("value3Title"), desc: t("value3Desc") },
    { icon: Headphones,  title: t("value4Title"), desc: t("value4Desc") },
  ];

  // Jména členů týmu se nepřekládají — role ano.
  const team = [
    { name: "Jan Novák",       role: t("roleFounder"), img: "/images/tym/jan.jpg"   },
    { name: "Petra Svobodová", role: t("roleSupport"), img: "/images/tym/petra.jpg" },
    { name: "Lukáš Dvořák",    role: t("roleLogistics"), img: "/images/tym/lukas.jpg" },
    { name: "Marie Horáková",  role: t("roleMarketing"), img: "/images/tym/marie.jpg" },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-dark">

        {/* Hero — fotka týmu přes celou šířku */}
        <div className="relative w-full h-screen overflow-hidden rounded-2xl bg-secondary">
          <Image src="/images/page/hero-product.jpg" alt="" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {/* Breadcrumb — nahoře přes obrázek */}
          <div className="absolute top-0 right-15 w-full px-8 md:px-16 lg:px-24 pt-6">
            <nav className="flex items-center gap-2 text-xs text-white/50">
              <a href="/" className="hover:text-white/80 transition-colors">{t("home")}</a>
              <ChevronRight size={12} aria-hidden="true" />
              <span className="text-white/80">{t("title")}</span>
            </nav>
          </div>

          {/* Text dole */}
          <div className="absolute bottom-0 left-0 w-full px-8 md:px-16 lg:px-24 pb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight">
              {t("heroTitle")}
            </h1>
            <p className="text-white/70 text-lg mt-3 max-w-xl">
              {t("heroDesc")}
            </p>
          </div>
        </div>

        {/* Příběh */}
        <div className="max-w-screen-2xl mx-auto px-8 md:px-16 lg:px-24 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
            <div>
              <p className="text-text-subtle text-xs font-semibold uppercase tracking-widest mb-3">{t("storyEyebrow")}</p>
              <h2 className="text-3xl font-extrabold text-text-base mb-6 leading-tight">{t("storyTitle")}</h2>
              <p className="text-text-muted text-base leading-relaxed mb-4">
                {t("storyPara1")}
              </p>
              <p className="text-text-muted text-base leading-relaxed">
                {t("storyPara2")}
              </p>
            </div>
            <div className="relative h-80 rounded-2xl overflow-hidden bg-secondary">
              <Image src="/images/page/setup.jpg" alt="" fill className="object-cover" />
            </div>
          </div>

          {/* Hodnoty */}
          <div className="mb-20">
            <p className="text-text-subtle text-xs font-semibold uppercase tracking-widest mb-3 text-center">{t("valuesEyebrow")}</p>
            <h2 className="text-3xl font-extrabold text-text-base mb-10 text-center">{t("valuesTitle")}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((v) => (
                <div key={v.title} className="flex flex-col items-center text-center gap-3">
                  <div className="w-14 h-14 rounded-full border-2 border-primary/30 flex items-center justify-center">
                    <v.icon size={22} className="text-primary-ink" />
                  </div>
                  <p className="text-text-base font-semibold text-sm">{v.title}</p>
                  <p className="text-text-muted text-sm leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tým */}
          <div className="mb-20">
            <p className="text-text-subtle text-xs font-semibold uppercase tracking-widest mb-3 text-center">{t("teamEyebrow")}</p>
            <h2 className="text-3xl font-extrabold text-text-base mb-10 text-center">{t("teamTitle")}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {team.map((member) => (
                <div key={member.name} className="flex flex-col items-center text-center gap-3">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden bg-secondary">
                    <Image src={member.img} alt="" fill className="object-cover" />
                  </div>
                  <div>
                    <p className="text-text-base font-semibold text-sm">{member.name}</p>
                    <p className="text-text-subtle text-xs mt-0.5">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── CTA ── */}
          <div className="rounded-2xl bg-header relative overflow-hidden p-10 lg:p-14 flex flex-col sm:flex-row items-center justify-between gap-8">
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />
            <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
            <HelpCircle className="absolute -bottom-10 -left-10 w-48 h-48 text-white/[0.03]" />

            <div className="relative z-10">
              <p className="text-white font-extrabold text-2xl mb-2">{t("ctaTitle")}</p>
              <p className="text-white/70 text-sm">
                {t("ctaDesc")}
              </p>
            </div>

            <a
              href="/kontakt"
              className="relative z-10 shrink-0 inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-primary text-on-primary font-bold text-sm hover:brightness-110 active:scale-[0.97] transition-all shadow-lg shadow-primary/20"
            >
              {t("ctaButton")}
              <ArrowRight size={15} aria-hidden="true" />
            </a>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}