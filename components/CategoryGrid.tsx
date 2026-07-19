"use client";

// Klientská komponenta kvůli jazyku (jazyk se čte z cookie až po hydrataci,
// viz lib/locale.ts). Dřív byla serverová; texty jsou tu jen dva bloky, takže
// rozdíl v bundlu je pár set bajtů.
import { ArrowUpRight, ShieldCheck, Truck } from "lucide-react";
import { useT } from "@/lib/useT";

export default function CategoryGrid() {
  const t = useT("categorygrid");

  return (
    <section className="py-10">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Levý — světlý (primary) */}
          <div className="relative overflow-hidden rounded-2xl bg-primary min-h-[220px] flex items-center p-8 md:p-10">
            {/* Dekorativní kruhy */}
            <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-white/10" />
            <div className="absolute -right-4 -bottom-12 w-64 h-64 rounded-full bg-white/5" />

            {/* Velká jemná ikona místo dřívějšího AI panáka — dekorace k tématu
                (záruka = štít), laděná do stylu zbytku webu (lucide). */}
            <ShieldCheck aria-hidden="true" strokeWidth={1.25} className="absolute -bottom-8 -right-6 w-56 h-56 text-on-primary/15 pointer-events-none" />

            {/* Tyrkys #28bfa6 je světlý — bílý text na něm má 2.32:1. Tmavý
                text-on-primary dává 8.07:1 a pozadí zůstává značkově tyrkysové. */}
            <div className="relative z-10 max-w-[55%]">
              <h3 className="text-on-primary text-2xl font-extrabold leading-tight">
                {t("warrantyTitle")}
              </h3>
              <a
                href="/zaruka"
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-on-primary/40 text-on-primary text-sm font-medium hover:bg-on-primary/10 transition-all"
              >
                {t("warrantyCta")}
                <ArrowUpRight size={14} />
              </a>
            </div>
          </div>

          {/* Pravý — tmavý */}
          <div className="relative overflow-hidden rounded-2xl bg-[#0f1117] min-h-[220px] flex items-center p-8 md:p-10">
            {/* Dekorativní kruhy */}
            <div className="absolute -left-8 -top-8 w-48 h-48 rounded-full bg-white/5" />
            <div className="absolute -left-4 -bottom-12 w-64 h-64 rounded-full bg-white/[0.03]" />

            {/* Velká jemná ikona místo panáka — doprava = kamion, tyrkys pro
                barevný akcent na tmavém pozadí. */}
            <Truck aria-hidden="true" strokeWidth={1.25} className="absolute -bottom-8 -left-6 w-56 h-56 text-primary/25 pointer-events-none" />

            <div className="relative z-10 ml-auto text-right max-w-[55%]">
              <h3 className="text-white text-2xl font-extrabold leading-tight">
                {t("deliveryTitle")}<br />
                <span className="text-primary">{t("deliveryHighlight")}</span>
              </h3>
              <a
                href="/doprava"
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/20 text-white text-sm font-medium hover:bg-white/10 transition-all"
              >
                {t("deliveryCta")}
                <ArrowUpRight size={14} />
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
