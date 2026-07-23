"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  ChevronRight,
  Plus,
  Truck,
  RotateCcw,
  ShieldCheck,
  CreditCard,
  Package,
  Headphones,
} from "lucide-react";

// ── Data ──────────────────────────────────────────────────────────────────────

import { useT, type T } from "@/lib/useT";

type FaqCategory = {
  id: string;
  icon: typeof Truck;
  label: string;
  color: string;
  bg: string;
  questions: { q: string; a: string }[];
};

// Otázky i odpovědi žijí v messages/*.json — tady zůstává jen struktura
// (pořadí, ikony). Klíče jsou vypsané, ne skládané přes `t(\`${id}Q${n}\`)`,
// aby je našel scripts/check-messages.mjs.
function buildCategories(t: T): FaqCategory[] {
  const style = { color: "text-primary-ink", bg: "bg-primary/8" };
  return [
    {
      id: "doprava", icon: Truck, label: t("catShipping"), ...style,
      questions: [
        { q: t("shippingQ1"), a: t("shippingA1") },
        { q: t("shippingQ2"), a: t("shippingA2") },
        { q: t("shippingQ3"), a: t("shippingA3") },
        { q: t("shippingQ4"), a: t("shippingA4") },
      ],
    },
    {
      id: "vraceni", icon: RotateCcw, label: t("catReturns"), ...style,
      questions: [
        { q: t("returnsQ1"), a: t("returnsA1") },
        { q: t("returnsQ2"), a: t("returnsA2") },
        { q: t("returnsQ4"), a: t("returnsA4") },
      ],
    },
    {
      id: "platba", icon: CreditCard, label: t("catPayment"), ...style,
      questions: [
        { q: t("paymentQ1"), a: t("paymentA1") },
        { q: t("paymentQ2"), a: t("paymentA2") },
        { q: t("paymentQ3"), a: t("paymentA3") },
      ],
    },
    {
      id: "produkty", icon: Package, label: t("catProducts"), ...style,
      questions: [
        { q: t("productsQ1"), a: t("productsA1") },
        { q: t("productsQ2"), a: t("productsA2") },
        { q: t("productsQ3"), a: t("productsA3") },
        { q: t("productsQ4"), a: t("productsA4") },
      ],
    },
    {
      id: "podpora", icon: Headphones, label: t("catSupport"), ...style,
      questions: [
        { q: t("supportQ1"), a: t("supportA1") },
        { q: t("supportQ2"), a: t("supportA2") },
        { q: t("supportQ3"), a: t("supportA3") },
      ],
    },
    {
      id: "zabezpeceni", icon: ShieldCheck, label: t("catSecurity"), ...style,
      questions: [
        { q: t("securityQ1"), a: t("securityA1") },
        { q: t("securityQ2"), a: t("securityA2") },
      ],
    },
  ];
}

// ── Single accordion item ─────────────────────────────────────────────────────

function AccordionItem({
  question,
  answer,
  isOpen,
  onToggle,
  index,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}) {
  return (
    <div
      className={`border-b border-border last:border-0 transition-colors duration-200 ${
        isOpen ? "bg-surface/60" : ""
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-4 px-6 py-5 text-left group"
        aria-expanded={isOpen}
      >
        <span className="shrink-0 w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center mt-0.5">
          <span className="text-[10px] font-bold text-text-subtle tabular-nums">
            {String(index + 1).padStart(2, "0")}
          </span>
        </span>

        <span className="flex-1 text-text-base font-semibold text-sm sm:text-base leading-snug group-hover:text-primary-ink transition-colors duration-150">
          {question}
        </span>

        <span
          className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 mt-0.5 ${
            isOpen
              ? "border-primary bg-primary text-on-primary rotate-45"
              : "border-border-strong text-text-muted"
          }`}
        >
          <Plus size={12} strokeWidth={2.5} />
        </span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <p className="px-6 pb-6 text-text-muted text-sm sm:text-base leading-relaxed pl-16">
          {answer}
        </p>
      </div>
    </div>
  );
}

// ── Category section ──────────────────────────────────────────────────────────

function CategorySection({
  category,
  openKey,
  setOpenKey,
}: {
  category: FaqCategory;
  openKey: string | null;
  setOpenKey: (k: string | null) => void;
}) {
  const t = useT("faq");
  const Icon = category.icon;

  return (
    <div id={category.id} className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-9 h-9 rounded-xl ${category.bg} flex items-center justify-center shrink-0`}>
          <Icon size={17} className={category.color} />
        </div>
        <h2 className="text-lg font-bold text-text-base">{category.label}</h2>
        <span className="ml-auto text-text-subtle text-xs font-medium">
          {t.plural(category.questions.length, "questionCount")}
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
        {category.questions.map((item, i) => {
          const key = `${category.id}-${i}`;
          return (
            <AccordionItem
              key={key}
              question={item.q}
              answer={item.a}
              isOpen={openKey === key}
              onToggle={() => setOpenKey(openKey === key ? null : key)}
              index={i}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function FaqPage() {
  const t = useT("faq");
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("doprava");

  const categories = buildCategories(t);
  const totalQuestions = categories.reduce((s, c) => s + c.questions.length, 0);

  function scrollTo(id: string) {
    setActiveCategory(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface">

        {/* Hero */}
        <div className="bg-header relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

          <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 py-14 lg:py-20 relative z-10">
            <nav className="flex items-center gap-2 text-xs text-white/30 mb-8">
              <Link href="/" className="hover:text-white/60 transition-colors">{t("home")}</Link>
              <ChevronRight size={11} aria-hidden="true" />
              <span className="text-white/60">{t("title")}</span>
            </nav>

            <div className="max-w-2xl">
              <p className="text-primary-ink text-xs font-bold uppercase tracking-[0.18em] mb-4">
                {t("eyebrow")}
              </p>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight mb-5">
                {t("title")}
              </h1>
              <p className="text-white/50 text-base leading-relaxed">
                {t("intro", { count: totalQuestions })}{" "}
                <a href="/kontakt" className="text-primary-ink hover:underline font-medium">
                  {t("introLink")}
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12 py-10 lg:py-14">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">

            {/* Sidebar */}
            <aside className="w-full lg:w-56 xl:w-64 shrink-0 lg:sticky lg:top-8 lg:self-start">
              <p className="text-text-subtle text-[11px] font-bold uppercase tracking-widest mb-3 px-1">
                {t("categories")}
              </p>
              <nav className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0" style={{ scrollbarWidth: "none" }}>
                {categories.map(cat => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => scrollTo(cat.id)}
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 whitespace-nowrap lg:w-full text-left ${
                        activeCategory === cat.id
                          ? "bg-white border border-border shadow-sm text-text-base"
                          : "text-text-muted hover:text-text-base hover:bg-white/60"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg ${cat.bg} flex items-center justify-center shrink-0`}>
                        <Icon size={13} className={cat.color} />
                      </div>
                      <span className="hidden sm:block">{cat.label}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* Obsah */}
            <div className="flex-1 min-w-0 flex flex-col gap-10">
              {categories.map(cat => (
                <CategorySection
                  key={cat.id}
                  category={cat}
                  openKey={openKey}
                  setOpenKey={setOpenKey}
                />
              ))}

              {/* Spodní CTA s jedním tlačítkem */}
              <div className="rounded-2xl bg-header p-8 sm:p-10 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
                <div
                  className="absolute inset-0 opacity-[0.04]"
                  style={{
                    backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                  }}
                />
                <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
                
                <div className="relative z-10 flex-1 text-center sm:text-left">
                  <p className="text-white font-bold text-xl mb-1">{t("ctaTitle")}</p>
                  <p className="text-white/50 text-sm">
                    {t("ctaDesc")}
                  </p>
                </div>

                <div className="relative z-10 shrink-0">
                  <a
                    href="/kontakt"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
                  >
                    {t("ctaButton")}
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}