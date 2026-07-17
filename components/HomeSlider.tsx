"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import Image from "next/image";
import { getProductBySlug } from "@/lib/products";
import { useT } from "@/lib/useT";

const slideSlugs = [
  "pouzdro-apple-pencil",
  "magsafe-penezenka",
  "magneticka-paperlike-folie-ipad",
  "silikonovy-reminek-apple-watch",
];

export default function HomeSlider() {
  const t = useT("slider");

  // Klíče schválně vypsané, ne skládané přes `t(`s${i}Label`)` — takhle je
  // najde scripts/check-messages.mjs a pozná, že se používají.
  const copy = [
    { label: t("s1Label"), headline: t("s1Headline"), headlineAccent: t("s1Accent"), sub: t("s1Sub"), cta: t("s1Cta") },
    { label: t("s2Label"), headline: t("s2Headline"), headlineAccent: t("s2Accent"), sub: t("s2Sub"), cta: t("s2Cta") },
    { label: t("s3Label"), headline: t("s3Headline"), headlineAccent: t("s3Accent"), sub: t("s3Sub"), cta: t("s3Cta") },
    { label: t("s4Label"), headline: t("s4Headline"), headlineAccent: t("s4Accent"), sub: t("s4Sub"), cta: t("s4Cta") },
  ];

  const slides = slideSlugs.map((slug, i) => ({
    id: i + 1,
    slug,
    ...copy[i],
    href: `/produkt/${slug}`,
    img: getProductBySlug(slug)?.img ?? "",
  }));

  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [paused, setPaused] = useState(false);
  // Klíč pro reset časovače při každém načtení stránky
  const [mountKey] = useState(() => Date.now());
  const timeoutRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const go = useCallback((idx: number, dir: "left" | "right") => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setCurrent(idx);
      setAnimating(false);
    }, 350);
  }, [animating]);

  // slideSlugs, ne slides.length — `slides` se teď skládá při každém renderu
  // (obsahuje přeložené texty), takže by se tyhle callbacky zbytečně měnily
  // a přenastavovaly interval. Počet slidů je stejně dán slugy.
  const prev = useCallback(() => {
    go((current - 1 + slideSlugs.length) % slideSlugs.length, "left");
  }, [current, go]);

  const next = useCallback(() => {
    go((current + 1) % slideSlugs.length, "right");
  }, [current, go]);

  // mountKey zajistí čistý start při každém načtení stránky
  useEffect(() => {
    if (paused) {
      if (timeoutRef.current) clearInterval(timeoutRef.current);
      return;
    }
    timeoutRef.current = setInterval(next, 6000);
    return () => { if (timeoutRef.current) clearInterval(timeoutRef.current); };
  }, [next, paused, mountKey]);

  const slide = slides[current];

  return (
    <section
      className="relative w-full overflow-hidden bg-dark"
      style={{ height: "clamp(480px, 68vh, 680px)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >

      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, var(--color-primary) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Slide content */}
      <div
        key={slide.id}
        className={`absolute inset-0 flex items-center transition-opacity duration-350 ${animating ? "opacity-0" : "opacity-100"}`}
        style={{ transform: animating ? `translateX(${direction === "right" ? "24px" : "-24px"})` : "translateX(0)", transition: "opacity 350ms ease, transform 350ms ease" }}
      >
        <div className="w-full max-w-screen-2xl mx-auto px-6 lg:px-12 flex items-center justify-between h-full gap-8">

          {/* Text side */}
          <div className="flex flex-col gap-5 max-w-lg">

            {/* Label */}
            <span className="inline-flex items-center gap-2 w-fit px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary-ink text-xs font-semibold uppercase tracking-widest">
              {slide.label}
            </span>

            {/* Headline */}
            <h2 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold leading-[1.1] tracking-tight">
              <span className="text-text-base">{slide.headline}</span>
              <br />
              <span className="text-primary-ink">{slide.headlineAccent}</span>
            </h2>

            {/* Sub */}
            <p className="text-text-muted text-base leading-relaxed max-w-sm">{slide.sub}</p>

            {/* CTA */}
            <div className="flex items-center gap-3 mt-1">
              <a
                href={slide.href}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary font-bold text-sm hover:brightness-105 active:scale-[0.98] transition-all duration-150"
              >
                {slide.cta}
                <ArrowRight size={14} />
              </a>
            </div>

          </div>

          {/* Image side */}
          <div className="hidden md:flex shrink-0 items-center justify-center relative"
            style={{ width: "clamp(280px, 32vw, 440px)", height: "clamp(280px, 32vw, 440px)" }}
          >
            {/* Soft glow behind image */}
            <div className="absolute inset-8 rounded-full bg-primary/8 blur-3xl" />
            <div className="relative w-full h-full">
              {/* Kontejner je clamp(280px, 32vw, 440px) — bez sizes by prohlížeč
                  předpokládal 100vw a stáhl zbytečně velkou variantu. */}
              <Image
                src={slide.img}
                alt={`${slide.headline} ${slide.headlineAccent}`}
                fill
                sizes="(max-width: 768px) 0px, 440px"
                className="object-contain drop-shadow-xl"
                priority
              />
            </div>
          </div>

        </div>
      </div>

      {/* Arrows */}
      <button
        onClick={prev}
        aria-label={t("prev")}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center text-text-muted hover:text-text-base hover:border-border-strong transition-all duration-150 z-10"
      >
        <ChevronLeft size={17} />
      </button>
      <button
        onClick={next}
        aria-label={t("next")}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center text-text-muted hover:text-text-base hover:border-border-strong transition-all duration-150 z-10"
      >
        <ChevronRight size={17} />
      </button>

      {/* Dots — samotná tečka je 6px, což je hluboko pod 24×24. Tlačítko je proto
          44×44 a průhledné; viditelnou tečku kreslí vnitřní <span>. Vzhled beze
          změny, dotykový cíl vyhovuje. */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center z-10" role="tablist" aria-label={t("chooseSlide")}>
        {slides.map((slide, i) => (
          <button
            key={i}
            onClick={() => go(i, i > current ? "right" : "left")}
            role="tab"
            aria-selected={i === current}
            aria-label={`${slide.headline} ${slide.headlineAccent}`}
            className="w-11 h-11 flex items-center justify-center group"
          >
            <span
              aria-hidden="true"
              className={`rounded-full transition-all duration-300 ${
                i === current ? "w-6 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-text-subtle group-hover:bg-text-muted"
              }`}
            />
          </button>
        ))}
      </div>

    </section>
  );
}