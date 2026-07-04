"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ChevronRight, Shield, Eye, BarChart3, Check } from "lucide-react";

const STORAGE_KEY = "techgadgets-cookie-consent";
const SESSION_KEY = "techgadgets-cookie-visited-details";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-12">
      <h2 className="text-xl font-bold text-text-base mb-5 pb-3 border-b border-border">{title}</h2>
      <div className="flex flex-col gap-4 text-text-muted text-base leading-relaxed [&_strong]:text-text-base [&_a]:text-primary [&_a]:hover:underline [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2">
        {children}
      </div>
    </div>
  );
}

export default function CookiesPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  // Načtení uloženého stavu cookies při načtení stránky
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && saved !== "accepted") {
          const parsed = JSON.parse(saved);
          setAnalytics(!!parsed.analytics);
          setMarketing(!!parsed.marketing);
        } else if (saved === "accepted") {
          setAnalytics(true);
          setMarketing(true);
        }
      } catch {}
    }
  }, []);

  function handleAcceptAll() {
    try {
      localStorage.setItem(STORAGE_KEY, "accepted");
      sessionStorage.removeItem(SESSION_KEY);
      setAnalytics(true);
      setMarketing(true);
    } catch {}
    router.refresh();
  }

  function handleSaveCustom() {
    try {
      const customConsent = {
        essential: true,
        analytics,
        marketing
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customConsent));
      sessionStorage.removeItem(SESSION_KEY);
    } catch {}
    router.refresh();
  }

  const cookieList = [
    { name: "techgadgets-cookie-consent", provider: "E-shop", purpose: "Zvolení souhlasů s ukládáním cookies.", expiry: "2 roky", type: "Nezbytné" },
    { name: "techgadgets-cookie-visited-details", provider: "E-shop", purpose: "Nastavuje přepnutí vzhledu lišty po návštěvě detailů.", expiry: "Do zavření prohlížeče", type: "Nezbytné" },
    { name: "cat_show", provider: "E-shop", purpose: "Nastavuje styl zobrazení produktů v sekci.", expiry: "30 dnů", type: "Nezbytné" },
    { name: "filter_onpage", provider: "E-shop", purpose: "Nastavuje počet produktů na stránce.", expiry: "30 dnů", type: "Nezbytné" },
    { name: "web_version", provider: "E-shop", purpose: "Nastavuje preferenci pro desktopovou verzi na mobilu.", expiry: "Do zavření prohlížeče", type: "Nezbytné" },
    { name: "last_visited", provider: "E-shop", purpose: "Ukládá naposled prohlížené produkty.", expiry: "30 dnů", type: "Preferenční" },
    { name: "remembere", provider: "E-shop", purpose: "Zapamatování přihlášení uživatele.", expiry: "1 rok", type: "Nezbyvnétě" },
    { name: "cartID", provider: "E-shop", purpose: "Ukládání zboží vloženého do košíku.", expiry: "1 rok", type: "Nezbytné" },
    { name: "PHPSESSID", provider: "E-shop", purpose: "Dočasné úložiště dat nezbytných pro použití webu.", expiry: "Do zavření prohlížeče", type: "Nezbytné" }
  ];

  return (
    <>
      <title>Používání souborů cookies | TechGadgets</title>
      
      <Header />
      <main className="min-h-screen bg-dark">
        <div className="max-w-5xl mx-auto px-6 lg:px-12 py-12">

          {/* Drobečková navigace */}
          <nav className="flex items-center gap-2 text-xs text-text-subtle mb-8">
            <a href="/" className="hover:text-text-muted transition-colors">Domů</a>
            <ChevronRight size={12} className="text-border" />
            <span className="text-text-muted">Používání souborů cookies</span>
          </nav>

          <h1 className="text-4xl font-extrabold text-text-base mb-2">Používání souborů cookies</h1>
          <p className="text-text-subtle text-sm mb-12">Platné od 1. 1. 2026 · V souladu s nařízením GDPR a zákonem o elektronických komunikacích</p>

          <Section title="1. Co jsou soubory cookie?">
            <p>
              Cookies jsou krátké textové soubory, které navštívená webová stránka odešle do vašeho prohlížeče. Umožňují webu zaznamenat informace o vaší návštěvě, například preferovaný jazyk, obsah nákupního košíku a další nastavení. Příští návštěva stránek tak může být snazší a produktivnější. Bez cookies by prohlížení webu bylo složitější, protože by si e-shop nepamatoval vaše kroky a stav nákupu.
            </p>
          </Section>

          <Section title="2. Jaké druhy cookies využíváme">
            <p>Na našem e-shopu rozdělujeme soubory cookie do následujících kategorií:</p>
            <ul>
              <li><strong>Nezbytné (technické) cookies</strong> — Jsou klíčové pro správný chod e-shopu. Zajišťují ukládání produktů do nákupního košíku, funkčnost pokladny, přihlášení a bezpečnost. Bez nich by nebylo možné nákup dokončit a nelze je vypnout.</li>
              <li><strong>Preferenční cookies</strong> — Umožňují, aby si web zapamatoval informace, které mění vzhled nebo chování webu (např. historie naposledy prohlížených produktů).</li>
              <li><strong>Analytické cookies</strong> (pokud budou nasazeny) — Pomáhají nám pochopit, jak web používáte (které stránky navštěvujete nejčastěji). Data jsou sbírána anonymně a slouží ke zlepšování chodu e-shopu.</li>
              <li><strong>Marketingové cookies</strong> (pokud budou nasazeny) — Slouží k profilování zájmů a zobrazování relevantní reklamy na sociálních sítích a partnerských webech.</li>
            </ul>
          </Section>

          <Section title="3. Správa souhlasu a nastavení preferencí">
            <p>
              Zpracování technických cookies je nezbytné pro plnění smlouvy (uskutečnění nákupu) a je prováděno na základě oprávněného zájmu. Ostatní kategorie cookies zpracováváme pouze na základě vašeho <strong>dobrovolného souhlasu</strong>.
            </p>
            <p>
              Své preference můžete kdykoliv bezplatně změnit a uložit přímo prostřednictvím níže přiloženého formuláře:
            </p>
            
            {/* ROZTAŽENÝ PANEL SE ZAŠKRTÁVÁTKY */}
            <div className="w-full border border-border bg-dark/20 rounded-xl p-6 mt-6 max-w-none">
              <h3 className="text-text-base font-bold text-base mb-4">
                Individuální nastavení souhlasu
              </h3>

              <div className="flex flex-col gap-3 mb-6">
                {/* Technické */}
                <div className="p-4 bg-dark/40 border border-border rounded-xl flex items-start justify-between">
                  <div className="flex gap-3">
                    <Shield size={18} className="text-primary mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-sm text-text-base block">Technické cookies (Nezbytné)</span>
                      <span className="text-text-muted text-xs block mt-1">Nutné pro fungování nákupního košíku, přihlášení a bezpečnosti webu.</span>
                    </div>
                  </div>
                  <div className="h-5 w-5 rounded bg-border/40 text-primary flex items-center justify-center text-xs shrink-0">
                    <Check size={14} className="stroke-[3]" />
                  </div>
                </div>

                {/* Analytické */}
                <label 
                  htmlFor="page-analytics"
                  className="p-4 bg-dark/40 border border-border hover:border-border/80 rounded-xl flex items-start justify-between cursor-pointer transition-colors"
                >
                  <div className="flex gap-3">
                    <BarChart3 size={18} className="text-text-muted mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-sm text-text-base block">Analytické cookies</span>
                      <span className="text-text-muted text-xs block mt-1">Umožňují nám sledovat anonymní statistiky návštěvnosti a zlepšovat e-shop.</span>
                    </div>
                  </div>
                  <input
                    id="page-analytics"
                    type="checkbox"
                    checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-border bg-dark text-primary focus:ring-0 cursor-pointer accent-primary shrink-0"
                  />
                </label>

                {/* Marketingové */}
                <label 
                  htmlFor="page-marketing"
                  className="p-4 bg-dark/40 border border-border hover:border-border/80 rounded-xl flex items-start justify-between cursor-pointer transition-colors"
                >
                  <div className="flex gap-3">
                    <Eye size={18} className="text-text-muted mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-sm text-text-base block">Marketingové cookies</span>
                      <span className="text-text-muted text-xs block mt-1">Slouží k zobrazení relevantní reklamy a nabídek na sociálních sítích a partnerských webech.</span>
                    </div>
                  </div>
                  <input
                    id="page-marketing"
                    type="checkbox"
                    checked={marketing}
                    onChange={(e) => setMarketing(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-border bg-dark text-primary focus:ring-0 cursor-pointer accent-primary shrink-0"
                  />
                </label>
              </div>

              {/* Tlačítka akcí */}
              <div className="flex flex-col sm:flex-row gap-3 max-w-md">
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-xs tracking-wide transition-colors cursor-pointer text-center"
                >
                  Povolit všechny cookies
                </button>
                <button
                  onClick={handleSaveCustom}
                  className="flex-1 py-2.5 px-4 rounded-lg border border-border hover:border-text-muted text-text-base font-medium text-xs tracking-wide transition-colors cursor-pointer text-center bg-transparent"
                >
                  Uložit mé preference
                </button>
              </div>
            </div>
          </Section>

          {/* Tabulka cookies */}
          <Section title="4. Podrobný soupis ukládaných souborů">
            <p className="mb-2">Níže naleznete přesný přehled cookies, které náš e-shop v prohlížeči ukládá:</p>
            
            <div className="w-full border border-border rounded-xl overflow-hidden bg-dark/40 mt-2">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-dark/80 border-b border-border text-text-base font-bold">
                      <th className="p-4">Jméno</th>
                      <th className="p-4">Poskytovatel</th>
                      <th className="p-4">Účel</th>
                      <th className="p-4">Vypršení</th>
                      <th className="p-4">Typ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-text-muted">
                    {cookieList.map((cookie, idx) => (
                      <tr key={idx} className="hover:bg-dark/20 transition-colors">
                        <td className="p-4 font-mono text-text-base whitespace-nowrap">{cookie.name}</td>
                        <td className="p-4 whitespace-nowrap">{cookie.provider}</td>
                        <td className="p-4 min-w-[220px] leading-relaxed">{cookie.purpose}</td>
                        <td className="p-4 whitespace-nowrap">{cookie.expiry}</td>
                        <td className="p-4 whitespace-nowrap">
                          <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold ${
                            cookie.type === "Nezbytné" ? "bg-primary/10 text-primary border border-primary/20" : "bg-border/40 text-text-muted"
                          }`}>
                            {cookie.type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Section>

          <Section title="5. Deaktivace cookies prostřednictvím prohlížeče">
            <p>
              Většina webových prohlížečů soubory cookie automaticky přijímá. Správu cookies však můžete upravit přímo ve svém prohlížeči, kde je můžete zakázat, zablokovat nebo smazat celou historii. Postup nastavení naleznete v nápovědě konkrétního prohlížeče:
            </p>
            <ul>
              <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
              <li><a href="https://support.mozilla.org/cs/kb/vymazani-cookies" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
              <li><a href="https://support.apple.com/cs-cz/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
              <li><a href="https://support.microsoft.com/cs-cz/microsoft-edge/odstran%C4%9Bn%C3%AD-soubor%C5%AF-cookie-v-aplikaci-microsoft-edge-63947427-b3b4-4c78-b95e-a86a7ee4094a" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
            </ul>
          </Section>

        </div>
      </main>
      <Footer />
    </>
  );
}