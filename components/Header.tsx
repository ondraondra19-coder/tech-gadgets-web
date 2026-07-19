"use client";

import { useState, useRef } from "react";
import { ShoppingCart, Phone, ChevronDown, Menu, X, Globe } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { useCurrency } from "@/lib/CurrencyContext";
import { type CurrencyCode } from "@/lib/currency";
import SearchBar from "./SearchBar";
import { products, categories } from "@/lib/products";
import { useT } from "@/lib/useT";
import { useLang } from "@/lib/LangContext";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/locale";
import { getCategoryName, getProductName } from "@/lib/products";

export default function Header() {
  const { totalItems } = useCart();
  const { currency, setCurrency, mounted: currencyMounted } = useCurrency();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const t = useT("header");
  const tn = useT("nav");
  const { locale, setLocale } = useLang();

  // Přepnutí jazyka je teď jen změna stavu — žádné stahování cizího skriptu
  // ani reload stránky. React překreslí texty z messages/*.json.
  function switchLanguage(l: Locale) {
    setLocale(l);
    setLangOpen(false);
  }

  // Blog a „O nás" žijí nově jen v patičce. V hlavičce zůstává Kontakt —
  // na desktopu v horní liště, na mobilu (kde horní lišta není) ve spodku
  // mobilního menu, proto ho držíme i tady.
  const navRight = [
    { label: tn("contact"), href: "/kontakt" },
  ];

  const navItems = categories.map(cat => ({
    label: getCategoryName(cat, locale),
    href: `/kategorie/${cat.slug}`,
    children: products
      .filter(p => p.categories.includes(cat.slug))
      .map(p => ({ label: getProductName(p, locale), href: `/produkt/${p.slug}`, img: p.img })),
  }));

  return (
    /* OPRAVA: pt-[env(safe-area-inset-top)] zajistí, že na mobilu černé pozadí proteče až pod notch */
    <header className="w-full bg-header relative z-50 pt-[env(safe-area-inset-top)]">

      {/* ── MAIN HEADER ── */}
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-12 flex items-center justify-between h-16 lg:h-20 gap-4 lg:gap-6">

        {/* Logo */}
        <Link
          href="/"
          onClick={e => {
            if (window.location.pathname === "/") {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          className="shrink-0 flex items-center"
        >
          <Image
            src="/images/main/logo-white.png"
            alt={t("logoAlt")}
            width={1000} // Nastav šířku podle potřeby
            height={300}  // Nastav výšku podle potřeby (odpovídá h-12)
            className="h-25 w-auto object-contain"
            priority // Zajistí rychlé načtení loga jako LCP elementu
          />
        </Link>

        {/* SearchBar — pouze desktop */}
        <div className="hidden lg:flex flex-1 max-w-xl relative z-[60]">
          <SearchBar />
        </div>

        {/* Pravá strana */}
        <div className="flex items-center gap-2 lg:gap-3">

          {/* Utility (měna · jazyk · kontakt) — jen desktop. Na mobilu (kde není
              horní lišta) jsou tyhle přepínače dole ve vysouvacím menu. */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Měna */}
            <div className="relative">
              <button
                onClick={() => { setCurrencyOpen(v => !v); setLangOpen(false); }}
                aria-label={t("changeCurrency", { code: currencyMounted ? currency.code : "" })}
                aria-expanded={currencyOpen}
                aria-haspopup="menu"
                className="inline-flex items-center gap-1 text-white/60 text-xs hover:text-white transition-colors"
              >
                <span>{currencyMounted ? currency.code : "···"}</span>
                <ChevronDown size={11} aria-hidden="true" className={`transition-transform duration-150 ${currencyOpen ? "rotate-180" : ""}`} />
              </button>
              {currencyOpen && (
                <div className="absolute right-0 top-full mt-2 bg-header border border-white/10 rounded-lg py-1 z-50 min-w-[72px] shadow-md">
                  {(["CZK", "EUR", "USD"] as CurrencyCode[]).map(code => (
                    <button key={code} onClick={() => { setCurrency(code); setCurrencyOpen(false); }} className={`block w-full text-left px-3 py-1.5 text-xs transition-colors ${code === currency.code ? "text-primary" : "text-white/50 hover:text-white"}`}>
                      <span>{code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span aria-hidden="true" className="text-white/20">|</span>

            {/* Jazyk */}
            <div className="relative">
              <button
                onClick={() => { setLangOpen(v => !v); setCurrencyOpen(false); }}
                aria-label={t("changeLanguage", { current: LOCALE_LABELS[locale] })}
                aria-expanded={langOpen}
                aria-haspopup="menu"
                className="inline-flex items-center gap-1 text-white/60 text-xs hover:text-white transition-colors"
              >
                <Globe size={11} aria-hidden="true" />
                <span>{LOCALE_LABELS[locale]}</span>
                <ChevronDown size={11} aria-hidden="true" className={`transition-transform duration-150 ${langOpen ? "rotate-180" : ""}`} />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-2 bg-header border border-white/10 rounded-lg py-1 z-50 min-w-[120px] shadow-md">
                  {LOCALES.map(l => (
                    <button
                      key={l}
                      lang={l}
                      onClick={() => switchLanguage(l)}
                      className={`block w-full text-left px-3 py-1.5 text-xs transition-colors ${l === locale ? "text-primary" : "text-white/50 hover:text-white"}`}
                    >
                      {LOCALE_LABELS[l]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span aria-hidden="true" className="text-white/20">|</span>

            {/* Kontakt */}
            <Link href="/kontakt" className="inline-flex items-center gap-1.5 text-white/60 text-xs hover:text-white transition-colors">
              <Phone size={12} aria-hidden="true" />
              <span>{tn("contact")}</span>
            </Link>
          </div>

          {/* Popisek "Košík" je pod sm: schovaný, takže na mobilu by z odkazu
              zbyla holá ikona bez názvu — aria-label ho drží vždy. */}
          <a
            href="/kosik"
            aria-label={totalItems > 0 ? t.plural(totalItems, "openCart") : t("openCartEmpty")}
            className="relative flex items-center gap-2 px-3 lg:px-4 py-2 min-h-11 rounded-full bg-primary text-on-primary font-semibold text-sm hover:brightness-105 transition-all"
          >
            <ShoppingCart size={15} aria-hidden="true" />
            <span className="hidden sm:inline">{t("cart")}</span>
            {totalItems > 0 && (
              <span aria-hidden="true" className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-header text-primary text-[10px] font-bold flex items-center justify-center border border-primary">
                {totalItems}
              </span>
            )}
          </a>

          <button
            className="lg:hidden w-11 h-11 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            onClick={() => setMobileOpen(v => !v)}
            aria-label={mobileOpen ? t("closeMenu") : t("openMenu")}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* ── MOBILE SEARCHBAR ── */}
      {/* OPRAVA: Změněno pb-3 na pb-5 pro opticky vyváženější odsazení od spodního okraje na mobilu */}
      <div className="lg:hidden px-4 pb-5">
        <SearchBar />
      </div>

      {/* ── DESKTOP NAV ── */}
      <nav
        className="hidden lg:block pb-1"
        onMouseLeave={() => {
          if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
          setOpenMenu(null);
        }}
      >
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 flex items-center justify-between">
          <ul className="flex items-center gap-1">
            {navItems.map(item => (
              <li
                key={item.label}
                className="relative"
                onMouseEnter={() => {
                  // Sekce bez produktů (zatím prázdné nové kategorie) nemají co
                  // rozbalit — hover dropdown pak vůbec nearmujeme.
                  if (item.children.length === 0) return;
                  if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
                  if (openMenu) {
                    setOpenMenu(item.label);
                  } else {
                    hoverTimeout.current = setTimeout(() => setOpenMenu(item.label), 500);
                  }
                }}
              >
                <a
                  href={item.href}
                  className={`inline-flex items-center gap-1 px-3 py-3.5 text-sm font-medium transition-colors ${openMenu === item.label ? "text-primary" : "text-white/70 hover:text-white"}`}
                >
                  {item.label}
                  {item.children.length > 0 && (
                    <ChevronDown size={13} className={`transition-transform duration-200 ${openMenu === item.label ? "rotate-180 text-primary" : ""}`} />
                  )}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Nav dropdown */}
        {openMenu && (() => {
          const active = navItems.find(i => i.label === openMenu);
          if (!active || active.children.length === 0) return null;
          return (
            <div className="absolute left-0 right-0 z-40 bg-header border-t border-b border-white/10 shadow-xl">
              <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 py-6">
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-white font-semibold text-sm">{active.label}</span>
                  <span className="text-white/55 text-xs">— {active.children.length} {t("products")}</span>
                </div>
                <div className="grid grid-cols-6 gap-4">
                  {active.children.map(child => (
                    <a key={child.label} href={child.href} className="group flex flex-col items-center gap-2.5">
                      <div className="w-full aspect-square rounded-xl overflow-hidden relative bg-white shadow-sm group-hover:shadow-md transition-shadow duration-150">
                        {/* Dropdown má 6 sloupců v max-w-screen-2xl (1536px) → ~240px */}
                        <Image src={child.img} alt="" fill sizes="240px" className="object-contain p-3" />
                      </div>
                      <p className="text-white/60 text-xs text-center leading-tight group-hover:text-white transition-colors line-clamp-2 w-full">{child.label}</p>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </nav>

      {/* ── MOBILE NAV ── */}
      {mobileOpen && (
        <nav className="lg:hidden bg-header border-t border-white/10 max-h-[70vh] overflow-y-auto">
          <ul className="divide-y divide-white/10">
            {navItems.map(item => (
              <li key={item.label}>
                <div className="flex items-center justify-between border-b border-white/10">
                  <a
                    href={item.href}
                    className="flex-1 px-5 py-4 text-sm font-medium text-white/70 hover:text-white transition-colors"
                  >
                    {item.label}
                  </a>
                  {item.children.length > 0 && (
                    <button
                      className="px-4 py-4 min-w-11 min-h-11 text-white/55 hover:text-white transition-colors"
                      onClick={() => setMobileExpanded(v => v === item.label ? null : item.label)}
                      aria-label={mobileExpanded === item.label ? t("collapse", { name: item.label }) : t("expand", { name: item.label })}
                      aria-expanded={mobileExpanded === item.label}
                    >
                      <ChevronDown size={14} aria-hidden="true" className={`transition-transform duration-200 ${mobileExpanded === item.label ? "rotate-180 text-primary" : ""}`} />
                    </button>
                  )}
                </div>
                {mobileExpanded === item.label && (
                  <ul className="bg-white/5 pb-2">
                    {item.children.map(child => (
                      <li key={child.label}>
                        <a href={child.href} className="flex items-center gap-3 px-5 py-2.5 text-sm text-white/50 hover:text-white transition-colors">
                          <div className="w-8 h-8 rounded-lg shrink-0 relative overflow-hidden bg-white shadow-sm">
                            {/* alt="" — název produktu je hned vedle jako text odkazu */}
                            <Image src={child.img} alt="" fill sizes="32px" className="object-contain p-1" />
                          </div>
                          {child.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
            <li className="border-t border-white/10" />
            {navRight.map(item => (
              <li key={item.label}>
                <a href={item.href} className="block px-5 py-4 text-sm font-medium text-white/60 hover:text-white transition-colors">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Přepínač měny a jazyka — na desktopu je v horní liště (hidden lg:block),
              která je na mobilu skrytá celá, takže sem patří jediná mobilní varianta. */}
          <div className="border-t border-white/10 px-5 py-4 space-y-3">
            <div>
              <p className="text-white/55 text-[11px] font-medium uppercase tracking-wide mb-2">{t("currency")}</p>
              <div className="flex gap-2">
                {(["CZK", "EUR", "USD"] as CurrencyCode[]).map(code => (
                  <button
                    key={code}
                    onClick={() => setCurrency(code)}
                    aria-pressed={code === currency.code}
                    className={`flex-1 py-2 min-h-11 rounded-lg text-xs font-semibold transition-colors ${code === currency.code ? "bg-primary text-on-primary" : "bg-white/5 text-white/50 hover:text-white"}`}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-white/55 text-[11px] font-medium uppercase tracking-wide mb-2">{t("language")}</p>
              <div className="flex gap-2">
                {LOCALES.map(l => (
                  <button
                    key={l}
                    lang={l}
                    onClick={() => switchLanguage(l)}
                    aria-pressed={l === locale}
                    className={`flex-1 py-2 min-h-11 rounded-lg text-xs font-semibold transition-colors ${l === locale ? "bg-primary text-on-primary" : "bg-white/5 text-white/50 hover:text-white"}`}
                  >
                    {LOCALE_LABELS[l]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </nav>
      )}

    </header>
  );
}