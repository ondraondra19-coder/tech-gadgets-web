"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Star, ChevronRight, Send, Check, AlertCircle, ChevronDown } from "lucide-react";
import { useT } from "@/lib/useT";
import { LOCALE_TAGS, type Locale } from "@/lib/locale";

const HCAPTCHA_SITE_KEY = "d5505d72-aa1a-4b50-a746-a1b0175c9092";
// Poznámka: cooldown se nyní vynucuje na serveru (podle IP) přes Upstash Redis.
// Tento klíč v localStorage slouží jen jako optimistická UX nápověda pro stejný prohlížeč.
const LAST_REVIEW_KEY = "slingr-last-review";
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

const MAX_CHARS = 600;       // limit znaků v recenzi
const INITIAL_SHOW = 5;      // kolik recenzí se zobrazí hned
const LOAD_MORE_COUNT = 10;  // kolik se přidá po kliknutí

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

function calcStats(reviews: Review[]) {
  if (!reviews.length) return { average: 0, total: 0, distribution: [5,4,3,2,1].map(s => ({ stars: s, count: 0 })) };
  const total = reviews.length;
  const sum = reviews.reduce((a, r) => a + r.rating, 0);
  const average = Math.round((sum / total) * 10) / 10;
  const distribution = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(r => r.rating === stars).length,
  }));
  return { average, total, distribution };
}

// ── Single review card with 4-line clamp ─────────────────────────────────────
function ReviewCard({ review }: { review: Review }) {
  const t = useT("review");
  const [expanded, setExpanded] = useState(false);
  const isLong = review.text.length > 200;

  return (
    <div className="flex gap-4 py-5 border-b border-border last:border-0">
      <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
        <span className="text-primary-ink text-xs font-bold">{review.initials}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-text-base font-semibold text-sm">{review.name}</span>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={12} className={i < review.rating ? "fill-primary text-primary-ink" : "fill-border text-border"} />
            ))}
          </div>
          <span className="text-text-subtle text-xs">{formatDate(review.date, t.locale)}</span>
        </div>
        <p className={`text-text-muted text-sm mt-2 leading-relaxed ${!expanded && isLong ? "line-clamp-4" : ""}`}>
          {review.text}
        </p>
        {isLong && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="mt-1.5 text-xs text-primary-ink hover:underline flex items-center gap-1"
          >
            {expanded ? t("showLess") : t("showMore")}
            <ChevronDown size={11} className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>
    </div>
  );
}

declare global {
  interface Window {
    hcaptcha: {
      render: (el: HTMLElement, options: object) => string;
      reset: (id: string) => void;
    };
    onHcaptchaVerify: (token: string) => void;
    onHcaptchaLoad?: () => void;
  }
}

export default function RecenzePage() {
  const t = useT("review");
  const tr = useT("rating");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_SHOW);

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaId, setCaptchaId] = useState<string | null>(null);
  const [cooldownLeft, setCooldownLeft] = useState<string | null>(null);
  const captchaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/reviews")
      .then((res) => res.json())
      .then((data) => setReviews(data.reviews ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const last = localStorage.getItem(LAST_REVIEW_KEY);
      if (last) {
        const diff = Date.now() - parseInt(last);
        if (diff < COOLDOWN_MS) {
          const remaining = COOLDOWN_MS - diff;
          const hours = Math.floor(remaining / 3600000);
          const minutes = Math.floor((remaining % 3600000) / 60000);
          setCooldownLeft(`${hours}h ${minutes}min`);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (cooldownLeft) return;
    window.onHcaptchaVerify = (token: string) => setCaptchaToken(token);

    if (document.getElementById("hcaptcha-script")) { initCaptcha(); return; }
    const script = document.createElement("script");
    script.id = "hcaptcha-script";
    script.src = "https://js.hcaptcha.com/1/api.js?render=explicit&onload=onHcaptchaLoad";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    window.onHcaptchaLoad = () => initCaptcha();
    // Efekt má běžet jen při změně cooldownLeft; initCaptcha se vytváří každý
    // render, přidání do deps by ho zbytečně spouštělo znovu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cooldownLeft]);

  function initCaptcha() {
    if (captchaRef.current && window.hcaptcha && !captchaId) {
      const id = window.hcaptcha.render(captchaRef.current, {
        sitekey: HCAPTCHA_SITE_KEY,
        callback: "onHcaptchaVerify",
        theme: "light",
        size: "normal",
      });
      setCaptchaId(id);
    }
  }

  const stats = calcStats(reviews);
  const maxCount = Math.max(...stats.distribution.map(d => d.count), 1);
  const charsLeft = MAX_CHARS - text.length;
  const canSubmit = !!rating && !!name.trim() && !!text.trim() && !!captchaToken && !cooldownLeft && text.length <= MAX_CHARS;

  // API vrací kód, ne hotovou větu — text se vybírá tady podle jazyka.
  function messageForCode(code: unknown, hours: unknown, minutes: unknown): string {
    switch (code) {
      case "invalid_name":     return t("errName");
      case "invalid_text":     return t("errText");
      case "invalid_rating":   return t("errRating");
      case "invalid_email":    return t("errEmail");
      case "captcha_missing":  return t("errCaptchaMissing");
      case "captcha_failed":   return t("errCaptchaFailed");
      case "cooldown":         return t("errCooldown", {
        hours: typeof hours === "number" ? hours : 23,
        minutes: typeof minutes === "number" ? minutes : 59,
      });
      default:                 return t("errFailed");
    }
  }

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), rating, text: text.trim(), email: email.trim(), captchaToken }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSubmitError(messageForCode(data?.code, data?.hours, data?.minutes));
        setCaptchaToken(null);
        if (captchaId !== null && window.hcaptcha) window.hcaptcha.reset(captchaId);
        return;
      }

      setReviews(prev => [data.review, ...prev]);
      try {
        localStorage.setItem(LAST_REVIEW_KEY, String(Date.now()));
      } catch {}
      setSubmitted(true);
      setCaptchaToken(null);
      if (captchaId !== null && window.hcaptcha) window.hcaptcha.reset(captchaId);
      setTimeout(() => {
        setSubmitted(false);
        setRating(0);
        setName("");
        setEmail("");
        setText("");
        setCooldownLeft("23h 59min");
      }, 3000);
    } catch {
      setSubmitError(t("errNetwork"));
    } finally {
      setSubmitting(false);
    }
  }

  const shownReviews = reviews.slice(0, visibleCount);
  const hasMore = visibleCount < reviews.length;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-10">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-text-subtle mb-8">
            <Link href="/" className="hover:text-text-muted transition-colors">{t("home")}</Link>
            <ChevronRight size={12} className="text-border" />
            <span className="text-text-muted">{tr("title")}</span>
          </nav>

          <h1 className="text-3xl font-extrabold text-text-base mb-8">{tr("title")}</h1>

          {/* Souhrn */}
          {reviews.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 flex flex-col sm:flex-row gap-8 items-center">
              <div className="flex flex-col items-center shrink-0">
                <span className="text-6xl font-extrabold text-text-base leading-none">{stats.average}</span>
                <div className="flex items-center gap-0.5 mt-2">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const filled = i + 1 <= Math.floor(stats.average);
                    const partial = !filled && i === Math.floor(stats.average) && stats.average % 1 > 0;
                    const frac = stats.average % 1;
                    return partial ? (
                      <span key={i} className="relative inline-block w-[18px] h-[18px]">
                        <Star size={18} className="fill-border text-border absolute inset-0" />
                        <span className="absolute inset-0 overflow-hidden" style={{ width: `${Math.round(frac * 100)}%` }}>
                          <Star size={18} className="fill-amber-400 text-amber-400" />
                        </span>
                      </span>
                    ) : (
                      <Star key={i} size={18} className={filled ? "fill-amber-400 text-amber-400" : "fill-border text-border"} />
                    );
                  })}
                </div>
                <span className="text-text-subtle text-xs mt-1.5">{tr.plural(stats.total, "count")}</span>
              </div>
              <div className="flex-1 w-full flex flex-col gap-2">
                {stats.distribution.map((d) => (
                  <div key={d.stars} className="flex items-center gap-3">
                    <div className="flex items-center gap-0.5 w-20 justify-end shrink-0">
                      {Array.from({ length: d.stars }).map((_, i) => (
                        <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${(d.count / maxCount) * 100}%` }} />
                    </div>
                    <span className="text-text-subtle text-xs w-10 text-right shrink-0">{d.count}×</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formulář */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="text-text-base font-semibold text-base mb-5">{tr("writeReview")}</h2>

            {cooldownLeft && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                <AlertCircle size={16} className="text-amber-500 shrink-0" aria-hidden="true" />
                <p className="text-amber-700 text-sm">
                  {(() => {
                    const [before, after] = t("cooldownBanner").split("{time}");
                    return <>{before}<strong>{cooldownLeft}</strong>{after}</>;
                  })()}
                </p>
              </div>
            )}

            {!cooldownLeft && (
              submitted ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Check size={22} className="text-green-600" />
                  </div>
                  <p className="text-text-base font-semibold">{t("sentTitle")}</p>
                  <p className="text-text-muted text-sm">{t("sentDesc")}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Hvězdičky */}
                  <div>
                    <label className="block text-text-muted text-xs font-medium mb-2">{t("ratingLabel")} <span aria-hidden="true">*</span></label>
                    {/* Hvězdičky jsou výběr jedné hodnoty z pěti — radiogroup to
                        čtečce sdělí i s pořadím ("3 z 5"). Bez aria-labelu to byla
                        pětice nepojmenovaných tlačítek. */}
                    <div className="flex items-center gap-1" role="radiogroup" aria-label={t("starsLabel")}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button key={i}
                          onMouseEnter={() => setHovered(i + 1)}
                          onMouseLeave={() => setHovered(0)}
                          onClick={() => setRating(i + 1)}
                          role="radio"
                          aria-checked={rating === i + 1}
                          aria-label={t.plural(i + 1, "star")}
                          className="w-11 h-11 flex items-center justify-center transition-transform hover:scale-110"
                        >
                          <Star size={28} aria-hidden="true" className={i < (hovered || rating) ? "fill-primary text-primary-ink" : "fill-border text-border"} />
                        </button>
                      ))}
                      {rating > 0 && (
                        <span className="ml-2 text-text-muted text-sm">
                          {[t("rate1"), t("rate2"), t("rate3"), t("rate4"), t("rate5")][rating - 1]}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="review-name" className="block text-text-muted text-xs font-medium mb-1.5">{t("nameLabel")} <span aria-hidden="true">*</span></label>
                      <input id="review-name" value={name} onChange={e => setName(e.target.value)} placeholder={t("namePlaceholder")}
                        className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text-base placeholder-text-subtle focus:outline-none focus:border-primary/50 transition-colors" />
                    </div>
                    <div>
                      <label htmlFor="review-email" className="block text-text-muted text-xs font-medium mb-1.5">{t("emailLabel")}</label>
                      <input id="review-email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t("emailPlaceholder")}
                        className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text-base placeholder-text-subtle focus:outline-none focus:border-primary/50 transition-colors" />
                    </div>
                  </div>

                  {/* Textarea s počítadlem znaků */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="review-text" className="block text-text-muted text-xs font-medium">{t("textLabel")} <span aria-hidden="true">*</span></label>
                      <span className={`text-xs ${charsLeft < 50 ? (charsLeft < 0 ? "text-red-500 font-semibold" : "text-amber-500") : "text-text-subtle"}`}>
                        {charsLeft} znaků zbývá
                      </span>
                    </div>
                    <textarea
                      value={text}
                      onChange={e => { if (e.target.value.length <= MAX_CHARS) setText(e.target.value); }}
                      placeholder={t("textPlaceholder")}
                      rows={4}
                      maxLength={MAX_CHARS}
                      className={`w-full bg-surface border rounded-xl px-4 py-3 text-sm text-text-base placeholder-text-subtle focus:outline-none transition-colors resize-none ${
                        charsLeft < 0 ? "border-red-400 focus:border-red-400" : "border-border focus:border-primary/50"
                      }`}
                    />
                  </div>

                  {/* hCaptcha */}
                  <div>
                    <div ref={captchaRef} />
                    {!captchaToken && (
                      <p className="text-text-subtle text-xs mt-1.5">{t("captchaPrompt")}</p>
                    )}
                    {captchaToken && (
                      <p className="flex items-center gap-1.5 text-green-600 text-xs mt-1.5">
                        <Check size={12} aria-hidden="true" /> {t("captchaOk")}
                      </p>
                    )}
                  </div>

                  {submitError && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
                      <AlertCircle size={16} className="text-red-500 shrink-0" />
                      <p className="text-red-700 text-sm">{submitError}</p>
                    </div>
                  )}

                  <button onClick={handleSubmit} disabled={!canSubmit || submitting}
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all w-fit ${
                      !canSubmit || submitting
                        ? "bg-border text-text-subtle cursor-not-allowed"
                        : "bg-primary text-on-primary hover:brightness-105 active:scale-[0.98]"
                    }`}>
                    <Send size={14} />
                    {submitting ? t("submitting") : t("submit")}
                  </button>
                </div>
              )
            )}
          </div>

          {/* Seznam recenzí */}
          {reviews.length > 0 ? (
            <div className="bg-white rounded-2xl shadow-sm px-6 py-2">
              <h2 className="text-text-base font-semibold text-base py-4 border-b border-border">
                {t("listTitle")}
                <span className="text-text-subtle font-normal text-sm ml-2">({stats.total} celkem)</span>
              </h2>

              {shownReviews.map((r) => <ReviewCard key={r.id} review={r} />)}

              {/* Load more */}
              {hasMore && (
                <div className="py-5 flex justify-center border-t border-border">
                  <button
                    onClick={() => setVisibleCount(v => v + LOAD_MORE_COUNT)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-border text-text-muted text-sm font-medium hover:border-primary hover:text-primary-ink transition-all"
                  >
                    {t("showMoreReviews")}
                    <ChevronDown size={15} aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
              <p className="text-text-muted text-sm">{t("empty")}</p>
            </div>
          )}

        </div>
      </main>
      <Footer />
    </>
  );
}