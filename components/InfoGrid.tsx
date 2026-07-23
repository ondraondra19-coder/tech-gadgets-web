"use client";

import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { useT } from "@/lib/useT";
import { UDAJE } from "@/lib/udaje";

export default function InfoGrid() {
  const t = useT("infogrid");

  return (
    <section className="py-10">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Levý — tým */}
          <div className="relative overflow-hidden rounded-2xl min-h-[320px] flex items-end p-8 bg-[#1a1a1a]">
            {/* Přes next/image: syrový <img> obcházel optimalizaci a stahoval
                plných 188 KB JPEG. sizes = dva sloupce od md výš, jinak celá šířka. */}
            <Image
              src="/images/page/hero-product.jpg"
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <div className="relative z-10">
              <h3 className="text-white text-2xl font-extrabold leading-tight">
                {t("teamTitle")}<br />
                <span className="font-normal text-white/80">{t("teamSubtitle")}</span>
              </h3>
              <div className="flex items-center gap-3 mt-4">
                <a
                  href="/o-nas"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/40 bg-white/10 backdrop-blur-sm text-white text-sm font-medium hover:bg-white/20 transition-all"
                >
                  {t("teamBtn")}
                  <ArrowUpRight size={14} />
                </a>
              </div>
            </div>
          </div>

          {/* Pravý — kontakt */}
          <div className="relative overflow-hidden rounded-2xl min-h-[220px] flex items-end p-8 bg-[#1a1a1a]">
            <Image
              src="/images/page/setup.jpg"
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <div className="relative z-10">
              <h3 className="text-white text-2xl font-extrabold leading-tight">
                {t("contactTitle")}<br />
                <span className="font-normal text-white/80">{t("contactSubtitle")}</span>
              </h3>
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                <a
                  href="/kontakt"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/40 bg-white/10 backdrop-blur-sm text-white text-sm font-medium hover:bg-white/20 transition-all"
                >
                  {t("contactBtn")}
                  <ArrowUpRight size={14} />
                </a>
                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 backdrop-blur-sm text-white/80 text-sm">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
                  <span>{UDAJE.openingHours.line}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}