"use client";

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";
import {
  ChevronRight, ShieldCheck, Truck, RotateCcw, Headphones,
  HelpCircle, ArrowRight, Target, Sparkles, HeartHandshake, Quote,
} from "lucide-react";
import { useT } from "@/lib/useT";

export default function ONasPage() {
  const t = useT("about");

  const stats = [
    { value: t("stat1Value"), label: t("stat1Label") },
    { value: t("stat2Value"), label: t("stat2Label") },
    { value: t("stat3Value"), label: t("stat3Label") },
    { value: t("stat4Value"), label: t("stat4Label") },
  ];

  const values = [
    { icon: ShieldCheck, title: t("value1Title"), desc: t("value1Desc") },
    { icon: Truck,       title: t("value2Title"), desc: t("value2Desc") },
    { icon: RotateCcw,   title: t("value3Title"), desc: t("value3Desc") },
    { icon: Headphones,  title: t("value4Title"), desc: t("value4Desc") },
  ];

  const promises = [
    { icon: Target,         title: t("promise1Title"), desc: t("promise1Desc") },
    { icon: Sparkles,       title: t("promise2Title"), desc: t("promise2Desc") },
    { icon: HeartHandshake, title: t("promise3Title"), desc: t("promise3Desc") },
  ];

  // Jména členů týmu se nepřekládají — role ano. Slingr vede zatím jeden člověk.
  const team = [
    { name: "Ondřej Kubrický", role: t("roleFounder"), img: "/images/tym/ondrej.jpg" },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-dark">

        {/* Hero — fotka přes celou šířku */}
        <div className="relative w-full h-[80vh] min-h-[480px] overflow-hidden bg-secondary">
          <Image src="/images/page/hero-product.jpg" alt="" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />

          <div className="absolute top-0 left-0 w-full px-8 md:px-16 lg:px-24 pt-6">
            <nav className="flex items-center gap-2 text-xs text-white/50">
              <Link href="/" className="hover:text-white/80 transition-colors">{t("home")}</Link>
              <ChevronRight size={12} aria-hidden="true" />
              <span className="text-white/80">{t("title")}</span>
            </nav>
          </div>

          <div className="absolute bottom-0 left-0 w-full px-8 md:px-16 lg:px-24 pb-12">
            <p className="text-primary text-xs font-bold uppercase tracking-[0.18em] mb-3">{t("heroEyebrow")}</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.05] tracking-tight max-w-3xl">
              {t("heroTitle")}
            </h1>
            <p className="text-white/70 text-lg mt-4 max-w-xl leading-relaxed">
              {t("heroDesc")}
            </p>
          </div>
        </div>

        <div className="max-w-screen-2xl mx-auto px-8 md:px-16 lg:px-24 py-16">

          {/* Příběh */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-20">
            <div>
              <p className="text-text-subtle text-xs font-semibold uppercase tracking-widest mb-3">{t("storyEyebrow")}</p>
              <h2 className="text-3xl font-extrabold text-text-base mb-6 leading-tight">{t("storyTitle")}</h2>
              <p className="text-text-muted text-base leading-relaxed mb-4">{t("storyPara1")}</p>
              <p className="text-text-muted text-base leading-relaxed">{t("storyPara2")}</p>
            </div>
            <div className="relative h-80 rounded-2xl overflow-hidden bg-secondary">
              <Image src="/images/page/setup.jpg" alt="" fill className="object-cover" />
            </div>
          </div>

          {/* Čísla */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-border bg-secondary/40 p-6 text-center">
                <p className="text-3xl lg:text-4xl font-extrabold text-primary-ink tracking-tight tabular-nums">{s.value}</p>
                <p className="text-text-muted text-xs sm:text-sm mt-1.5 leading-snug">{s.label}</p>
              </div>
            ))}
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

          {/* Náš slib */}
          <div className="mb-20">
            <p className="text-text-subtle text-xs font-semibold uppercase tracking-widest mb-3 text-center">{t("promiseEyebrow")}</p>
            <h2 className="text-3xl font-extrabold text-text-base mb-10 text-center">{t("promiseTitle")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {promises.map((p) => (
                <div key={p.title} className="rounded-2xl border border-border bg-white shadow-sm p-6 flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
                    <p.icon size={19} className="text-primary-ink" />
                  </div>
                  <p className="text-text-base font-bold text-base">{p.title}</p>
                  <p className="text-text-muted text-sm leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tým + citát zakladatele */}
          <div className="mb-20">
            <p className="text-text-subtle text-xs font-semibold uppercase tracking-widest mb-3 text-center">{t("teamEyebrow")}</p>
            <h2 className="text-3xl font-extrabold text-text-base mb-10 text-center">{t("teamTitle")}</h2>
            <div className="flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-16 max-w-4xl mx-auto">
              {team.map((member) => (
                <div key={member.name} className="flex flex-col items-center text-center gap-4 shrink-0">
                  <div className="relative w-40 h-40 rounded-full overflow-hidden bg-secondary ring-2 ring-primary/20">
                    <Image src={member.img} alt="" fill className="object-cover" />
                  </div>
                  <div>
                    <p className="text-text-base font-semibold text-base">{member.name}</p>
                    <p className="text-text-subtle text-sm mt-0.5">{member.role}</p>
                  </div>
                </div>
              ))}
              <blockquote className="relative max-w-md text-center lg:text-left">
                <Quote size={28} className="text-primary/30 mb-3 mx-auto lg:mx-0" aria-hidden="true" />
                <p className="text-text-base text-lg font-medium leading-relaxed italic">
                  {t("founderQuote")}
                </p>
              </blockquote>
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
              <p className="text-white/70 text-sm">{t("ctaDesc")}</p>
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
