"use client";

import { useState, useEffect } from "react";
import { ChevronRight, X } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

const STORAGE_KEY = "techgadgets-cookie-consent";
const SESSION_KEY = "techgadgets-cookie-visited-details";

export function getConsent(): "accepted" | null {
  if (typeof window === "undefined") return null;
  try {
    return (localStorage.getItem(STORAGE_KEY) as "accepted") ?? null;
  } catch {
    return null;
  }
}

export default function CookieBanner() {
  const router = useRouter();
  const pathname = usePathname();
  
  type State = "idle" | "blocking" | "visible" | "leaving" | "gone";
  const [state, setState] = useState<State>("idle");
  
  const [hasVisitedDetails, setHasVisitedDetails] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false);
  const [marketingAllowed, setMarketingAllowed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const visited = sessionStorage.getItem(SESSION_KEY);
      if (visited === "true") {
        setHasVisitedDetails(true);
      }
    }

    if (pathname === "/cookies") {
      try {
        sessionStorage.setItem(SESSION_KEY, "true");
      } catch {}
      setHasVisitedDetails(true);
      setState("gone");
      return;
    }

    if (getConsent()) {
      setState("gone");
      return;
    }
    setState("blocking");
    const t = setTimeout(() => setState("visible"), 50);
    return () => clearTimeout(t);
  }, [pathname]);

  function accept() {
    try {
      localStorage.setItem(STORAGE_KEY, "accepted");
      sessionStorage.removeItem(SESSION_KEY);
    } catch {}
    setState("leaving");
    setTimeout(() => setState("gone"), 500);
  }

  function saveCustomSettings() {
    try {
      const customConsent = {
        essential: true,
        analytics: analyticsAllowed,
        marketing: marketingAllowed
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customConsent));
      sessionStorage.removeItem(SESSION_KEY);
    } catch {}
    setIsModalOpen(false);
    setState("leaving");
    setTimeout(() => setState("gone"), 500);
  }

  if (state === "idle" || state === "gone") return null;

  const isLeaving = state === "leaving";
  const isBlocking = state === "blocking";

  return (
    <>
      {/* Dynamic Overlay pozadí */}
      <div
        aria-hidden="true"
        onClick={(e) => e.stopPropagation()}
        className={`fixed inset-0 z-[199] transition-all duration-500 ${
          isLeaving
            ? "opacity-0 pointer-events-none"
            : isBlocking
            ? "opacity-0 pointer-events-auto"
            : "opacity-100"
        } ${
          hasVisitedDetails 
            ? "pointer-events-none" 
            : "pointer-events-auto"
        }`}
        style={{ 
          background: hasVisitedDetails ? "rgba(0,0,0,0)" : "rgba(0,0,0,0.6)", 
          backdropFilter: hasVisitedDetails ? "none" : "blur(4px)" 
        }}
      />

      {/* DYNAMICKÝ VNĚJŠÍ KONTEJNER */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Souhlas s cookies"
        className={`fixed z-[200] transition-all duration-500 ease-out ${
          hasVisitedDetails
            ? "bottom-0 left-0 w-full"
            : "bottom-6 left-1/2 -translate-x-1/2 w-full max-w-6xl px-4"
        } ${
          isLeaving || isBlocking
            ? hasVisitedDetails ? "translate-y-full opacity-0" : "translate-y-12 opacity-0"
            : "translate-y-0 opacity-100"
        }`}
      >
        {/* DYNAMICKÉ TĚLO BANNERU */}
        <div 
          className={`bg-[#121212] shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between transition-all duration-300 ${
            hasVisitedDetails
              ? "border-t border-white/10 w-full p-4 md:py-4 md:px-8 gap-4 md:gap-8 rounded-none" 
              : "border border-white/5 rounded-2xl p-6 md:p-8 gap-6 md:gap-12" 
          }`}
        >
          
          {/* Levá textová část */}
          <div className={`flex-1 min-w-0 flex flex-col justify-between h-full ${hasVisitedDetails ? "md:flex-row md:items-center gap-2 md:gap-6" : ""}`}>
            <div>
              <h2 className={`text-white font-bold tracking-wide ${hasVisitedDetails ? "text-sm mb-0.5" : "text-base md:text-lg mb-1.5"}`}>
                Tato webová stránka používá cookies
              </h2>
              <p className={`text-[#a3a3a3] leading-relaxed ${hasVisitedDetails ? "text-[11px] md:text-xs max-w-5xl" : "text-xs md:text-sm max-w-4xl"}`}>
                K personalizaci obsahu a reklam, poskytování funkcí sociálních médií a analýze naší návštěvnosti využíváme soubory cookie. 
                Informace o tom, jak náš web používáte, sdílíme se svými partnery pro sociální média, inzerci a analýzy.
                {!hasVisitedDetails && " Partneři tyto údaje mohou zkombinovat s dalšími informacemi, které jste jim poskytli nebo které získali v důsledku toho, že používáte jejich služby."}
              </p>
            </div>
            
            {/* Odkaz Zobrazit detaily */}
            <div className={`shrink-0 ${hasVisitedDetails ? "mt-1 md:mt-0" : "mt-4 md:mt-6"}`}>
              <button 
                onClick={() => router.push('/cookies')}
                className={`text-[#dc143c] hover:text-[#ff2e5b] font-medium inline-flex items-center transition-colors duration-200 bg-transparent border-none p-0 cursor-pointer whitespace-nowrap ${
                  hasVisitedDetails ? "text-xs gap-1" : "text-xs md:text-sm gap-1.5"
                }`}
              >
                Zobrazit detaily
                <ChevronRight size={hasVisitedDetails ? 12 : 14} className="stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Pravá tlačítková část — správné pořadí tlačítek */}
          <div className={`shrink-0 flex items-center ${
            hasVisitedDetails 
              ? "flex-row gap-3 w-full md:w-auto justify-end" 
              : "flex-col gap-3 w-full md:w-auto min-w-[200px]" 
          }`}>
            
            {/* Tlačítko Povolit vše — nyní je na prvním místě */}
            <button
              onClick={accept}
              className={`bg-[#dc143c] hover:bg-[#b00f2e] text-black font-bold tracking-wide transition-colors duration-200 cursor-pointer text-center whitespace-nowrap ${
                hasVisitedDetails
                  ? "flex-1 md:flex-none py-2 px-5 rounded-lg text-xs" 
                  : "w-full md:w-48 py-3 px-6 rounded-xl text-sm" 
              }`}
            >
              Povolit vše
            </button>

            {/* Tlačítko Upravit */}
            <button 
              onClick={() => setIsModalOpen(true)}
              className={`font-bold tracking-wide transition-colors duration-200 cursor-pointer whitespace-nowrap border-[#dc143c] hover:bg-[#dc143c]/10 text-white flex items-center justify-center ${
                hasVisitedDetails
                  ? "flex-1 md:flex-none py-2 px-4 rounded-lg border text-xs" 
                  : "w-full md:w-48 py-3 px-6 rounded-xl border-2 text-sm gap-1" 
              }`}
            >
              <span>Upravit</span>
              {!hasVisitedDetails && <ChevronRight size={14} className="stroke-[2.5]" />}
            </button>
          </div>

        </div>
      </div>

      {/* MODÁLNÍ OKNO UPRAVIT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[300] backdrop-blur-md">
          <div className="bg-[#121212] border border-white/5 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-[#a3a3a3] hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <h3 className="text-white font-bold text-base mb-1 tracking-wide">
              Nastavení cookies
            </h3>
            <p className="text-[#a3a3a3] text-xs mb-4 leading-relaxed">
              Zde si můžete vybrat, jaké typy cookies chcete povolit. Technické jsou nezbytné pro pohyb v košíku.
            </p>

            <div className="space-y-3 mb-5">
              <div className="flex items-start justify-between p-3 bg-white/5 border border-white/5 rounded-xl">
                <div className="pr-4">
                  <span className="font-bold text-xs block text-white">Technické (Nezbytné)</span>
                  <span className="text-[#a3a3a3] text-[11px] block mt-0.5">Nutné pro fungování košíku a přihlášení.</span>
                </div>
                <input
                  type="checkbox"
                  checked
                  disabled
                  className="mt-0.5 h-3.5 w-3.5 rounded border-white/10 bg-transparent text-[#dc143c] focus:ring-[#dc143c] disabled:opacity-50 cursor-not-allowed accent-[#dc143c]"
                />
              </div>

              <div className="flex items-start justify-between p-3 bg-white/5 border border-white/5 rounded-xl">
                <div className="pr-4">
                  <label htmlFor="modal-analytics" className="font-bold text-xs block text-white cursor-pointer">Analytické cookies</label>
                  <span className="text-[#a3a3a3] text-[11px] block mt-0.5">Pomáhají nám analyzovat návštěvnost e-shopu.</span>
                </div>
                <input
                  id="modal-analytics"
                  type="checkbox"
                  checked={analyticsAllowed}
                  onChange={(e) => setAnalyticsAllowed(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-white/10 bg-transparent text-[#dc143c] focus:ring-[#dc143c] cursor-pointer accent-[#dc143c]"
                />
              </div>

              <div className="flex items-start justify-between p-3 bg-white/5 border border-white/5 rounded-xl">
                <div className="pr-4">
                  <label htmlFor="modal-marketing" className="font-bold text-xs block text-white cursor-pointer">Marketingové cookies</label>
                  <span className="text-[#a3a3a3] text-[11px] block mt-0.5">Umožňují nám zobrazovat vám relevantní reklamu.</span>
                </div>
                <input
                  id="modal-marketing"
                  type="checkbox"
                  checked={marketingAllowed}
                  onChange={(e) => setMarketingAllowed(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-white/10 bg-transparent text-[#dc143c] focus:ring-[#dc143c] cursor-pointer accent-[#dc143c]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={saveCustomSettings}
                className="w-full sm:w-auto py-2 px-5 rounded-lg bg-[#dc143c] hover:bg-[#b00f2e] text-black font-bold text-xs tracking-wide transition-colors duration-200 cursor-pointer text-center"
              >
                Uložit výběr
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}