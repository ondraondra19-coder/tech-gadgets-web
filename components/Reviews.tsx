"use client";

import { useState, useEffect } from "react";
import { Star, ArrowRight, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useT } from "@/lib/useT";
import { LOCALE_TAGS, type Locale } from "@/lib/locale";

type Review = {
  id: string;
  initials: string;
  name: string;
  rating: number;
  date: string; // ISO string ze serveru
  text: string;
};

function formatDate(iso: string, locale: Locale): string {
  try {
    return new Date(iso).toLocaleDateString(LOCALE_TAGS[locale], { day: "numeric", month: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={i < rating ? "fill-amber-400 text-amber-400" : "fill-border text-border"}
        />
      ))}
    </div>
  );
}

function calcAvg(reviews: Review[]) {
  if (!reviews.length) return 0;
  return Math.round(reviews.reduce((a, r) => a + r.rating, 0) / reviews.length * 10) / 10;
}

// ── Single review card with 4-line clamp + expand ────────────────────────────
function ReviewCard({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false);
  const t = useT("reviews");

  // Rough estimate: if text is longer than ~200 chars it might overflow 4 lines
  const isLong = review.text.length > 200;

  return (
    <div className="flex flex-col gap-4 p-5 lg:p-6 rounded-2xl bg-white shadow-sm shrink-0 w-full">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-primary-ink text-xs font-bold">{review.initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-text-base text-sm font-semibold leading-none">{review.name}</p>
          <p className="text-text-subtle text-xs mt-0.5">{formatDate(review.date, t.locale)}</p>
        </div>
        <StarRating rating={review.rating} />
      </div>

      <div>
        <p
          className={`text-text-muted text-sm leading-relaxed ${
            !expanded && isLong ? "line-clamp-4" : ""
          }`}
        >
          &bdquo;{review.text}&ldquo;
        </p>
        {isLong && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="mt-1.5 text-xs text-primary-ink hover:underline flex items-center gap-1"
          >
            {expanded ? t("showLess") : t("showMore")}
            <ChevronDown
              size={12}
              className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>
    </div>
  );
}

export default function Reviews() {
  const t = useT("reviews");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [index, setIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);

  useEffect(() => {
    fetch("/api/reviews")
      .then((res) => res.json())
      .then((data) => setReviews(data.reviews ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function update() {
      setVisibleCount(window.innerWidth < 768 ? 1 : 3);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    setIndex(0);
  }, [visibleCount]);

  if (reviews.length === 0) return null;

  const avg = calcAvg(reviews);
  const maxIndex = Math.max(0, reviews.length - visibleCount);
  const gap = 20;

  function prev() { setIndex(i => Math.max(0, i - 1)); }
  function next() { setIndex(i => Math.min(maxIndex, i + 1)); }

  return (
    <section className="py-12 lg:py-16">
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-12">

        {/* Header */}
        <div className="flex flex-col gap-5 mb-8 lg:mb-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-text-subtle text-xs font-semibold uppercase tracking-widest mb-2">{t("sectionSubtitle")}</p>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-text-base tracking-tight">{t("sectionTitle")}</h2>
          </div>
          <div className="flex items-center justify-between lg:justify-end gap-5 lg:gap-6 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-3xl lg:text-4xl font-extrabold text-text-base leading-none">{avg}</span>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const filled = i + 1 <= Math.floor(avg);
                    const partial = !filled && i === Math.floor(avg) && avg % 1 > 0;
                    const fraction = avg % 1;
                    return partial ? (
                      <span key={i} className="relative inline-block w-[16px] h-[16px]">
                        <Star size={16} className="fill-border text-border absolute inset-0" />
                        <span className="absolute inset-0 overflow-hidden" style={{ width: `${Math.round(fraction * 100)}%` }}>
                          <Star size={16} className="fill-amber-400 text-amber-400" />
                        </span>
                      </span>
                    ) : (
                      <Star key={i} size={16} className={filled ? "fill-amber-400 text-amber-400" : "fill-border text-border"} />
                    );
                  })}
                </div>
                <p className="text-text-subtle text-xs">{t.plural(reviews.length, "count")}</p>
              </div>
            </div>
            <a
              href="/napsat-recenzi"
              className="inline-flex items-center gap-2 px-4 lg:px-5 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:brightness-105 transition-all"
            >
              {t("allReviews")}
              <ArrowRight size={14} />
            </a>
          </div>
        </div>

        {/* Slider */}
        <div className="flex items-center gap-2 lg:gap-4">
          <button
            onClick={prev}
            disabled={index === 0}
            aria-label={t("prev")}
            className={`shrink-0 w-11 h-11 rounded-full border flex items-center justify-center transition-all ${
              index === 0
                ? "border-border text-border cursor-default"
                : "border-border-strong text-text-muted hover:text-text-base hover:border-text-subtle"
            }`}
          >
            <ChevronLeft size={15} aria-hidden="true" />
          </button>

          <div className="flex-1 overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                gap: `${gap}px`,
                transform: `translateX(calc(-${index} * (100% / ${visibleCount} + ${gap / visibleCount}px)))`,
              }}
            >
              {reviews.map(r => (
                <div
                  key={r.id}
                  className="shrink-0"
                  style={{ width: `calc((100% - ${(visibleCount - 1) * gap}px) / ${visibleCount})` }}
                >
                  <ReviewCard review={r} />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={next}
            disabled={index >= maxIndex}
            aria-label={t("next")}
            className={`shrink-0 w-11 h-11 rounded-full border flex items-center justify-center transition-all ${
              index >= maxIndex
                ? "border-border text-border cursor-default"
                : "border-border-strong text-text-muted hover:text-text-base hover:border-text-subtle"
            }`}
          >
            <ChevronRight size={15} aria-hidden="true" />
          </button>
        </div>

      </div>
    </section>
  );
}