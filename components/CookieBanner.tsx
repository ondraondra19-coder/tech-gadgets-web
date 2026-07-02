"use client";

import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";

const STORAGE_KEY = "techgadgets-cookie-consent";

export function getConsent(): "accepted" | null {
  if (typeof window === "undefined") return null;
  try {
    return (localStorage.getItem(STORAGE_KEY) as "accepted") ?? null;
  } catch {
    return null;
  }
}

export default function CookieBanner() {
  type State = "idle" | "blocking" | "visible" | "leaving" | "gone";
  const [state, setState] = useState<State>("idle");

  useEffect(() => {
    if (getConsent()) {
      setState("gone");
      return;
    }
    setState("blocking");
    const t = setTimeout(() => setState("visible"), 50);
    return () => clearTimeout(t);
  }, []);

  function accept() {
    try {
      localStorage.setItem(STORAGE_KEY, "accepted");
    } catch {}
    setState("leaving");
    setTimeout(() => setState("gone"), 500);
  }

  if (state === "idle" || state === "gone") return null;

  const isLeaving = state === "leaving";
  const isBlocking = state === "blocking";

  return (
    <>
      {/* Overlay pozadí */}
      <div
        aria-hidden="true"
        onClick={(e) => e.stopPropagation()}
        className={`fixed inset-0 z-[199] transition-opacity duration-500 ${
          isLeaving
            ? "opacity-0 pointer-events-none"
            : isBlocking
            ? "opacity-0 pointer-events-auto"
            : "opacity-100 pointer-events-auto"
        }`}
        style={{ background: "rgba(0,0,0,0.4)" }}
      />

      {/* Kontajner pro vycentrování banneru na spodu obrazovky */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Souhlas s cookies"
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-6xl px-4 z-[200] transition-all duration-500 ease-out ${
          isLeaving || isBlocking
            ? "translate-y-12 opacity-0"
            : "translate-y-0 opacity-100"
        }`}
      >
        {/* Tělo banneru — tmavě šedé, zaoblené s jemným borderem */}
        <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-12">
          
          {/* Levá textová část */}
          <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
            <div>
              <h2 className="text-white font-bold text-base md:text-lg mb-1.5 tracking-wide">
                Tato webová stránka používá cookies
              </h2>
              <p className="text-[#a3a3a3] text-xs md:text-sm leading-relaxed max-w-4xl">
                K personalizaci obsahu a reklam, poskytování funkcí sociálních médií a analýze naší návštěvnosti využíváme soubory cookie. 
                Informace o tom, jak náš web používáte, sdílíme se svými partnery pro sociální média, inzerci a analýzy. Partneři tyto údaje 
                mohou zkombinovat s dalšími informacemi, které jste jim poskytli nebo které získali v důsledku toho, že používáte jejich služby.
              </p>
            </div>
            
            {/* Odkaz Zobrazit detaily */}
            <div className="mt-4 md:mt-6">
              <button className="text-[#dc143c] hover:text-[#ff2e5b] text-xs md:text-sm font-medium inline-flex items-center gap-1.5 transition-colors duration-200 bg-transparent border-none p-0 cursor-pointer">
                Zobrazit detaily
                <ChevronRight size={14} className="stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Pravá tlačítková část */}
          <div className="flex flex-col gap-3 w-full md:w-auto shrink-0 min-w-[200px]">
            {/* Tlačítko Povolit vše — plná červená */}
            <button
              onClick={accept}
              className="w-full md:w-48 py-3 px-6 rounded-xl bg-[#dc143c] hover:bg-[#b00f2e] text-black font-bold text-sm tracking-wide transition-colors duration-200 cursor-pointer text-center"
            >
              Povolit vše
            </button>

            {/* Tlačítko Upravit — obrysové s šipkou */}
            <button className="w-full md:w-48 py-3 px-6 rounded-xl border-2 border-[#dc143c] hover:bg-[#dc143c]/10 text-white font-bold text-sm tracking-wide flex items-center justify-center gap-1 transition-colors duration-200 cursor-pointer">
              <span>Upravit</span>
              <ChevronRight size={14} className="stroke-[2.5]" />
            </button>
          </div>

        </div>
      </div>
    </>
  );
}