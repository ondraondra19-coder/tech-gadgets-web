"use client";

// První sekce homepage — celoobrazovkové video s tmavým overlayem a centrovaným
// textem (styl blastro.cz). Klientská komponenta kvůli překladům (jazyk se čte
// z cookie až po hydrataci, viz lib/locale.ts).
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useT } from "@/lib/useT";

export default function VideoHero() {
  const t = useT("videohero");

  return (
    <section className="relative w-full overflow-hidden bg-header h-[clamp(560px,86svh,880px)]">

      {/* Pozadí — video. Dekorativní (obsah nese text vedle), proto aria-hidden.
          muted+playsInline je nutné, aby autoplay prošel na mobilech i v Safari. */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      >
        <source src="/videos/uvod.mp4" type="video/mp4" />
      </video>

      {/* Tmavý overlay pro čitelnost bílého textu — základ + spodní gradient,
          aby text i odznaky měly dost kontrastu i nad světlými záběry videa. */}
      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/40" />

      {/* Obsah */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-white font-extrabold tracking-tight leading-[1.05] text-4xl sm:text-6xl lg:text-7xl max-w-4xl drop-shadow-sm">
          {t("headline")}
        </h1>

        <p className="mt-5 text-white/85 text-lg sm:text-xl max-w-xl leading-relaxed">
          {t("sub")}
        </p>

        <Link
          href="/kategorie/zbrane"
          className="mt-8 inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-on-primary font-bold text-base hover:brightness-105 active:scale-[0.98] transition-all duration-150 shadow-lg"
        >
          {t("cta")}
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>

    </section>
  );
}
