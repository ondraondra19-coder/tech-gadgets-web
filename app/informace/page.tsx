"use client";

import { useState, useEffect, useRef, useId } from "react";
import { useCart } from "@/lib/cart";
import Header from "@/components/Header";
import Image from "next/image";
import {
  ChevronRight, MapPin, AlertCircle, AlertTriangle, Check,
  ChevronDown, Loader2, Tag, CheckCircle2, X,
} from "lucide-react";
import { useCurrency } from "@/lib/CurrencyContext";
import { formatPrice, getPrice } from "@/lib/currency";
import DiscountWidget from "@/components/DiscountWidget";
import { approxConvert } from "@/lib/discounts";
import { CURRENCIES } from "@/lib/currency";
import { DOBIRKA_FEE } from "@/lib/fees";
import { trackEvent } from "@/lib/analytics";
import { COUNTRY_CZECHIA, COUNTRY_SLOVAKIA } from "@/lib/shipping/pricing";
import { useT } from "@/lib/useT";
import { shippingLabel } from "@/lib/shippingLabels";
import CheckoutStepper from "@/components/CheckoutStepper";

const ORDER_KEY = "hackpack-order";
const INFO_KEY = "hackpack-info";

// ── Typy ──────────────────────────────────────────────────────────────────────

type MestoResult = {
  label: string;
  mesto: string;
  vesnice: string;
  psc: string;
  multiPsc: boolean;
};

type AdresaResult = {
  uliceCp: string;
  mesto: string;
  psc: string;
  label: string;
};

type AddressBlock = {
  mesto: string;
  mestoRaw: string;
  vesnice: string;
  uliceCp: string;
  psc: string;
  zeme: string;
};

// "confirmed" je záměrně vynechán — RÚIAN ověření není povinné
type AddressErrors = Partial<Record<keyof AddressBlock, string>>;

type FormState = {
  jmeno: string;
  email: string;
  telefon: string;
  firma: string;
  ic: string;
  dic: string;
  adresa: AddressBlock;
  dorAdresa: AddressBlock;
  poznamka: string;
};

const emptyAddress = (): AddressBlock => ({
  mesto: "", mestoRaw: "", vesnice: "", uliceCp: "", psc: "", zeme: COUNTRY_CZECHIA,
});

const defaultForm = (): FormState => ({
  jmeno: "", email: "", telefon: "", firma: "", ic: "", dic: "",
  adresa: emptyAddress(), dorAdresa: emptyAddress(), poznamka: "",
});

// ── Fetch helpers ─────────────────────────────────────────────────────────────

const cacheMesto = new Map<string, MestoResult[]>();
const cacheAdresa = new Map<string, AdresaResult[]>();

async function fetchMesta(query: string): Promise<MestoResult[]> {
  const key = query.trim().toLowerCase();
  if (cacheMesto.has(key)) return cacheMesto.get(key)!;
  try {
    const res = await fetch(`/api/adresa?type=mesto&q=${encodeURIComponent(query.trim())}`);
    const data = await res.json();
    const results: MestoResult[] = data.results ?? [];
    cacheMesto.set(key, results);
    return results;
  } catch { return []; }
}

async function fetchAdresy(query: string): Promise<AdresaResult[]> {
  const key = query.trim().toLowerCase();
  if (cacheAdresa.has(key)) return cacheAdresa.get(key)!;
  try {
    const res = await fetch(`/api/adresa?type=adresa&q=${encodeURIComponent(query.trim())}`);
    const data = await res.json();
    const results: AdresaResult[] = data.results ?? [];
    cacheAdresa.set(key, results);
    return results;
  } catch { return []; }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function stripDia(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = stripDia(text).indexOf(stripDia(query));
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary/20 text-primary-ink rounded-sm px-0.5 not-italic font-semibold">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ── SmartAddressBlock ─────────────────────────────────────────────────────────

function SmartAddressBlock({
  value, onChange, onConfirm, confirmed, errors = {},
}: {
  value: AddressBlock;
  onChange: (v: AddressBlock) => void;
  onConfirm: (c: boolean) => void;
  confirmed: boolean;
  errors?: AddressErrors;
}) {
  const t = useT("info");
  const [mestoSuggestions, setMestoSuggestions] = useState<MestoResult[]>([]);
  const [adresaSuggestions, setAdresaSuggestions] = useState<AdresaResult[]>([]);
  const [activeField, setActiveField] = useState<"mesto" | "uliceCp" | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loadingMesto, setLoadingMesto] = useState(false);
  const [loadingAdresa, setLoadingAdresa] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mestoReqRef = useRef(0);
  const adresaReqRef = useRef(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const uid = useId();
  const mestoListId = `${uid}-mesto`;
  const adresaListId = `${uid}-adresa`;
  // Blok je na stránce dvakrát (fakturační + doručovací adresa), takže id musí
  // být unikátní — jinak by <label> mířil na pole z druhé adresy.
  const mestoInputId = `${uid}-mesto-input`;
  const uliceInputId = `${uid}-ulice-input`;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setActiveField(null);
        setActiveIndex(-1);
        setMestoSuggestions([]);
        setAdresaSuggestions([]);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function searchMesto(query: string) {
    if (query.trim().length < 2) { setMestoSuggestions([]); return; }
    const reqId = ++mestoReqRef.current;
    setLoadingMesto(true);
    const results = await fetchMesta(query);
    if (reqId !== mestoReqRef.current) return;
    setLoadingMesto(false);
    setActiveIndex(-1);
    setMestoSuggestions(results);
  }

  async function searchAdresa(query: string) {
    if (query.trim().length < 2) { setAdresaSuggestions([]); return; }
    const reqId = ++adresaReqRef.current;
    const context = value.mestoRaw || value.mesto.split(" - ")[0].trim();
    const q = context ? `${query.trim()}, ${context}` : query.trim();
    setLoadingAdresa(true);
    let results = await fetchAdresy(q);
    if (results.length === 0 && context) {
      results = await fetchAdresy(query.trim());
    }
    if (reqId !== adresaReqRef.current) return;
    setLoadingAdresa(false);
    const filtered = results.filter(r => {
      if (!context) return true;
      return stripDia(r.mesto) === stripDia(context);
    });
    setActiveIndex(-1);
    setAdresaSuggestions((filtered.length > 0 ? filtered : results).slice(0, 7));
  }

  function handleListKeyDown<T>(
    e: React.KeyboardEvent<HTMLInputElement>,
    suggestions: T[],
    onSelect: (r: T) => void,
  ) {
    if (e.key === "Escape") {
      setActiveIndex(-1);
      setMestoSuggestions([]);
      setAdresaSuggestions([]);
      return;
    }
    if (suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(i => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(i => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      onSelect(suggestions[activeIndex >= 0 ? activeIndex : 0]);
    }
  }

  function handleMestoInput(raw: string) {
    onChange({ ...emptyAddress(), mesto: raw, zeme: value.zeme });
    onConfirm(false);
    setActiveField("mesto");
    setActiveIndex(-1);
    setAdresaSuggestions([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (raw.trim().length >= 2) {
      debounceRef.current = setTimeout(() => searchMesto(raw), 300);
    } else {
      setMestoSuggestions([]);
    }
  }

  function handleMestoSelect(r: MestoResult) {
    const vesnice = r.multiPsc ? "" : r.vesnice;
    onChange({
      ...value,
      mesto: r.label,
      mestoRaw: r.mesto,
      vesnice: vesnice,
      psc: r.psc,
      uliceCp: vesnice ? `${vesnice} ` : "",
    });
    onConfirm(false);
    setMestoSuggestions([]);
    setActiveIndex(-1);
    setActiveField("uliceCp");
    if (vesnice) {
      setTimeout(() => searchAdresa(vesnice), 100);
    }
  }

  function handleUliceInput(raw: string) {
    onChange({ ...value, uliceCp: raw });
    onConfirm(false);
    setActiveField("uliceCp");
    setActiveIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (raw.trim().length >= 2) {
      debounceRef.current = setTimeout(() => searchAdresa(raw), 300);
    } else {
      setAdresaSuggestions([]);
    }
  }

  function handleAdresaSelect(r: AdresaResult) {
    onChange({
      ...value,
      uliceCp: r.uliceCp,
      psc: r.psc,
      mesto: value.mesto || r.mesto,
      mestoRaw: value.mestoRaw || r.mesto,
    });
    onConfirm(true);
    setActiveField(null);
    setActiveIndex(-1);
    setAdresaSuggestions([]);
  }

  return (
    <div ref={wrapperRef} className="flex flex-col gap-4">

      {/* Badge ověřeno — zobrazí se pouze pokud uživatel vybral z RÚIAN (bonus, ne nutnost) */}
      {confirmed && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 border border-green-200">
          <CheckCircle2 size={14} className="text-green-600 shrink-0" />
          <p className="text-green-700 text-xs font-medium">Adresa ověřena z databáze RÚIAN</p>
        </div>
      )}
      {/* ODSTRANĚNO: varování "Prosím vyberte adresu ze seznamu" — RÚIAN ověření není povinné */}

      {/* Město */}
      <div className="relative" data-field="mesto">
        <label htmlFor={mestoInputId} className="block text-text-muted text-xs font-medium mb-1.5">
          {t("city")} <span className="text-red-400" aria-hidden="true">*</span>
        </label>
        <div className={`flex items-center border rounded-xl overflow-hidden transition-colors ${
          errors?.mesto ? "border-red-400"
          : activeField === "mesto" ? "border-primary/60 ring-2 ring-primary/10"
          : "border-border"
        }`}>
          <MapPin size={13} className="ml-3 text-text-subtle shrink-0" />
          <input
            id={mestoInputId}
            type="text"
            value={value.mesto ?? ""}
            onChange={e => handleMestoInput(e.target.value)}
            onFocus={() => {
              setActiveField("mesto");
              if (value.mesto.trim().length >= 2) searchMesto(value.mesto);
            }}
            onKeyDown={e => handleListKeyDown(e, mestoSuggestions, handleMestoSelect)}
            placeholder={t("cityPlaceholder")}
            autoComplete="off"
            spellCheck={false}
            role="combobox"
            aria-autocomplete="list"
            aria-controls={mestoListId}
            aria-expanded={activeField === "mesto" && mestoSuggestions.length > 0}
            aria-activedescendant={activeField === "mesto" && activeIndex >= 0 ? `${mestoListId}-opt-${activeIndex}` : undefined}
            className="flex-1 bg-surface px-3 py-2.5 text-sm text-text-base placeholder-text-subtle focus:outline-none"
          />
          {loadingMesto && <Loader2 size={13} className="mr-3 text-text-subtle animate-spin shrink-0" />}
          {value.mesto && !loadingMesto && (
            <button type="button"
              onMouseDown={e => { e.preventDefault(); onChange({ ...emptyAddress(), zeme: value.zeme }); onConfirm(false); setMestoSuggestions([]); setAdresaSuggestions([]); }}
              className="mr-2 text-text-subtle hover:text-text-base transition-colors">
              <X size={13} />
            </button>
          )}
        </div>
        {errors?.mesto && <p className="flex items-center gap-1 text-red-500 text-xs mt-1"><AlertCircle size={11} /> {errors.mesto}</p>}

        {/* Dropdown měst */}
        {activeField === "mesto" && mestoSuggestions.length > 0 && (
          <ul id={mestoListId} role="listbox" className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-xl z-50 overflow-y-auto max-h-56">
            {mestoSuggestions.map((r, i) => (
              <li key={i}>
                <button type="button"
                  id={`${mestoListId}-opt-${i}`}
                  role="option"
                  aria-selected={activeIndex === i}
                  onMouseDown={e => { e.preventDefault(); handleMestoSelect(r); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-3 ${activeIndex === i ? "bg-primary/10" : "hover:bg-primary/5"}`}>
                  <MapPin size={12} className="text-primary-ink shrink-0" />
                  <span className="flex-1 min-w-0">
                    <span className="text-text-base font-medium">
                      <Highlight text={r.label} query={value.mesto} />
                    </span>
                    {!r.multiPsc && r.psc && (
                      <span className="text-text-subtle text-xs ml-2">{r.psc}</span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Ulice a č.p. */}
      <div className="relative" data-field="uliceCp">
        <label htmlFor={uliceInputId} className="block text-xs font-medium mb-1.5 text-text-muted">
          {t("street")} <span className="text-red-400" aria-hidden="true">*</span>
        </label>
        <div className={`flex items-center border rounded-xl overflow-hidden transition-all ${
          errors?.uliceCp ? "border-red-400"
          : activeField === "uliceCp" ? "border-primary/60 ring-2 ring-primary/10"
          : "border-border"
        }`}>
          <input
            type="text"
            id={uliceInputId}
            value={value.uliceCp ?? ""}
            onChange={e => handleUliceInput(e.target.value)}
            onFocus={() => {
              setActiveField("uliceCp");
              if (value.uliceCp.trim().length >= 2) searchAdresa(value.uliceCp);
            }}
            onKeyDown={e => handleListKeyDown(e, adresaSuggestions, handleAdresaSelect)}
            placeholder={t("streetPlaceholder")}
            autoComplete="off"
            spellCheck={false}
            role="combobox"
            aria-autocomplete="list"
            aria-controls={adresaListId}
            aria-expanded={activeField === "uliceCp" && adresaSuggestions.length > 0}
            aria-activedescendant={activeField === "uliceCp" && activeIndex >= 0 ? `${adresaListId}-opt-${activeIndex}` : undefined}
            className="flex-1 bg-surface px-4 py-2.5 text-sm text-text-base placeholder-text-subtle focus:outline-none"
          />
          {loadingAdresa && <Loader2 size={13} className="mr-3 text-text-subtle animate-spin shrink-0" />}
        </div>
        {errors?.uliceCp && <p className="flex items-center gap-1 text-red-500 text-xs mt-1"><AlertCircle size={11} /> {errors.uliceCp}</p>}

        {/* Dropdown adres */}
        {activeField === "uliceCp" && adresaSuggestions.length > 0 && (
          <ul id={adresaListId} role="listbox" className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-xl z-50 overflow-y-auto max-h-56">
            {adresaSuggestions.map((r, i) => (
              <li key={i}>
                <button type="button"
                  id={`${adresaListId}-opt-${i}`}
                  role="option"
                  aria-selected={activeIndex === i}
                  onMouseDown={e => { e.preventDefault(); handleAdresaSelect(r); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-3 ${activeIndex === i ? "bg-primary/10" : "hover:bg-primary/5"}`}>
                  <MapPin size={12} className="text-primary-ink shrink-0" />
                  <span className="flex-1 min-w-0">
                    <span className="text-text-base font-medium">
                      <Highlight text={r.uliceCp} query={value.uliceCp} />
                    </span>
                    <span className="text-text-subtle text-xs ml-2">{r.psc} {r.mesto}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* PSČ — readonly, doplní se pokud uživatel vybere z RÚIAN; jinak ho může vyplnit ručně */}
      <div style={{ maxWidth: 180 }} data-field="psc">
        <label htmlFor="psc" className="block text-text-muted text-xs font-medium mb-1.5">{t("zip")}</label>
        <div className="flex items-center border border-border rounded-xl overflow-hidden bg-surface">
          <input
            type="text"
            id="psc"
            name="psc"
            value={value.psc ?? ""}
            onChange={e => onChange({ ...value, psc: e.target.value })}
            placeholder={t("zipPlaceholder")}
            className="flex-1 bg-surface px-4 py-2.5 text-sm text-text-base placeholder-text-subtle focus:outline-none"
          />
          {value.psc && <Check size={13} className="mr-3 text-green-500 shrink-0" />}
        </div>
      </div>
    </div>
  );
}

// ── Pomocné komponenty ────────────────────────────────────────────────────────

function toTitleCase(str: string) {
  return str.split(" ").map(w => w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : "").join(" ");
}
function isCorrectNameFormat(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return false;
  return parts.every(p => p.length > 0 && p[0] === p[0].toUpperCase() && p[0] !== p[0].toLowerCase());
}
function formatPhone(digits: string) {
  const d = digits.replace(/\D/g, "").slice(0, 9);
  if (d.length <= 3) return d;
  if (d.length <= 6) return d.slice(0, 3) + " " + d.slice(3);
  return d.slice(0, 3) + " " + d.slice(3, 6) + " " + d.slice(6);
}


function Field({ label, name, value, onChange, placeholder, error, type = "text", autoComplete, required }: {
  label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; error?: string; type?: string; autoComplete?: string; required?: boolean;
}) {
  return (
    <div data-field={name}>
      <label className="block text-text-muted text-xs font-medium mb-1.5">{label}{required && <span className="text-red-400 ml-0.5"> *</span>}</label>
      <div className={`flex items-center border rounded-xl overflow-hidden transition-colors ${error ? "border-red-400" : "border-border focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10"}`}>
        <input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete}
          className="flex-1 bg-surface px-4 py-2.5 text-sm text-text-base placeholder-text-subtle focus:outline-none" />
      </div>
      {error && <p className="flex items-center gap-1 text-red-500 text-xs mt-1"><AlertCircle size={11} /> {error}</p>}
    </div>
  );
}

function NameField({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  const t = useT("info");
  const [suggestion, setSuggestion] = useState<string | null>(null);
  return (
    <div data-field="jmeno">
      <label htmlFor="jmeno" className="block text-text-muted text-xs font-medium mb-1.5">{t("fullName")} <span className="text-red-400" aria-hidden="true">*</span></label>
      <div className={`flex items-center border rounded-xl overflow-hidden transition-colors ${error ? "border-red-400" : "border-border focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10"}`}>
        <input id="jmeno" name="jmeno" type="text" value={value}
          onChange={e => { const raw = e.target.value; onChange(raw); const c = toTitleCase(raw); setSuggestion(raw.trim() && raw !== c && !isCorrectNameFormat(raw) ? c : null); }}
          placeholder={t("namePlaceholder")} autoComplete="name"
          className="flex-1 bg-surface px-4 py-2.5 text-sm text-text-base placeholder-text-subtle focus:outline-none" />
      </div>
      {suggestion && <button type="button" onClick={() => { onChange(suggestion); setSuggestion(null); }} className="mt-1.5 flex items-center gap-1.5 text-xs text-primary-ink hover:underline"><AlertCircle size={11} aria-hidden="true" /> {t("didYouMean")} <span className="font-semibold">{suggestion}</span>?</button>}
      {!suggestion && error && <p className="flex items-center gap-1 text-red-500 text-xs mt-1"><AlertCircle size={11} /> {error}</p>}
    </div>
  );
}

function TelefonField({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  const t = useT("info");
  return (
    <div data-field="telefon">
      <label htmlFor="telefon" className="block text-text-muted text-xs font-medium mb-1.5">{t("phone")} <span className="text-red-400" aria-hidden="true">*</span></label>
      <div className={`flex items-center border rounded-xl overflow-hidden transition-colors ${error ? "border-red-400" : "border-border focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10"}`}>
        <div className="relative shrink-0">
          <select defaultValue="+420" className="appearance-none bg-secondary border-r border-border px-3 py-2.5 text-sm text-text-muted focus:outline-none pr-7 cursor-pointer">
            <option value="+420">🇨🇿 +420</option>
            <option value="+421">🇸🇰 +421</option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-subtle pointer-events-none" />
        </div>
        <input id="telefon" name="telefon" type="tel" value={formatPhone(value)} onChange={e => onChange(e.target.value.replace(/\D/g, "").slice(0, 9))}
          placeholder="777 123 456" maxLength={11} autoComplete="tel-national"
          className="flex-1 bg-surface px-4 py-2.5 text-sm text-text-base placeholder-text-subtle focus:outline-none" />
      </div>
      {error && <p className="flex items-center gap-1 text-red-500 text-xs mt-1"><AlertCircle size={11} /> {error}</p>}
    </div>
  );
}

// Volby mají oddělenou hodnotu a popisek. Dřív se `<option key={o}>{o}</option>`
// vykreslovalo bez value, takže se do formuláře ukládal přímo zobrazený text —
// u země by pak anglický zákazník uložil "Czechia" a podmínky
// `zeme !== "Česká republika"` (e-mail, potvrzení objednávky) by přestaly platit.
// Hodnota je česká a kanonická, popisek přeložený.
function SelectField({ label, name, value, onChange, options }: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-text-muted text-xs font-medium mb-1.5">{label}</label>
      <div className="relative">
        <select id={name} name={name} value={value} onChange={onChange} className="w-full appearance-none bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text-base focus:outline-none focus:border-primary/50 transition-colors pr-9">
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={14} aria-hidden="true" className="absolute right-3 top-1/2 -translate-y-1/2 text-text-subtle pointer-events-none" />
      </div>
    </div>
  );
}

function CheckRow({ checked, onChange, children }: { checked: boolean; onChange: () => void; children: React.ReactNode }) {
  return (
    /* Zaškrtávátko samo je 18px — dotykový cíl by byl pod 24×24. Obalové
       tlačítko je proto 44×44 a průhledné, kroužek kreslí vnitřní <span>.
       Fajfka je tmavá: bílá na růžové #ff8ad0 má jen 2.14:1. */
    <label className="flex items-start gap-3 cursor-pointer group">
      <button type="button" onClick={onChange} role="checkbox" aria-checked={checked}
        className="-ml-3 -mt-3 w-11 h-11 flex items-center justify-center shrink-0">
        <span aria-hidden="true"
          className={`rounded border-2 flex items-center justify-center transition-all ${checked ? "bg-primary border-primary" : "border-border-strong group-hover:border-primary/50"}`}
          style={{ width: 18, height: 18 }}>
          {checked && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="#0f0f10" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </span>
      </button>
      <span className="text-sm text-text-muted leading-snug pt-0.5">{children}</span>
    </label>
  );
}

// ── Hlavní stránka ────────────────────────────────────────────────────────────

export default function InformacePage() {
  const { items, getItemPrice, getTotalPrice, appliedDiscount, totalPriceCZK, isDiscountActive, getDiscountAmount, getFinalPrice, clearCart, removeDiscount } = useCart();
  const { currency } = useCurrency();
  const t = useT("info");
  const tc = useT("checkout");

  // Hodnota je česká a kanonická (ukládá se do objednávky), popisek přeložený.
  const countryOptions = [
    { value: COUNTRY_CZECHIA,  label: t("countryCzechia")  },
    { value: COUNTRY_SLOVAKIA, label: t("countrySlovakia") },
  ];

  const [form, setForm] = useState<FormState>(defaultForm());
  // confirmed se stále sleduje pro zobrazení zelené badge, ale validace ho nevyžaduje
  const [adresaConfirmed, setAdresaConfirmed] = useState(false);
  const [dorAdresaConfirmed, setDorAdresaConfirmed] = useState(false);
  const [errors, setErrors] = useState<{ jmeno?: string; email?: string; telefon?: string; adresa?: AddressErrors; dorAdresa?: AddressErrors; }>({});
  const [loading, setLoading] = useState(false);
  const [nakupNaFirmu, setNakupNaFirmu] = useState(false);
  const [jineDorucenoAdresa, setJineDorucenoAdresa] = useState(false);
  const [zadatPoznamku, setZadatPoznamku] = useState(false);
  const [noNewsletter, setNoNewsletter] = useState(false);
  const [registrace, setRegistrace] = useState(false);
  const [orderData, setOrderData] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(INFO_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setForm(prev => ({
          ...prev, ...parsed,
          adresa: { ...emptyAddress(), ...(parsed.adresa ?? {}) },
          dorAdresa: { ...emptyAddress(), ...(parsed.dorAdresa ?? {}) },
        }));
      }
      const order = localStorage.getItem(ORDER_KEY);
      if (order) setOrderData(JSON.parse(order));
    } catch {}
  }, []);

  useEffect(() => {
    try { sessionStorage.setItem(INFO_KEY, JSON.stringify(form)); } catch {}
  }, [form]);

  function setSimpleField(name: keyof Omit<FormState, "adresa" | "dorAdresa">, value: string) {
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  }

  function validate() {
    const e: typeof errors = {};

    // Osobní údaje
    if (!form.jmeno.trim()) e.jmeno = t("errName");
    else if (!isCorrectNameFormat(form.jmeno)) e.jmeno = t("errNameFormat");
    if (!form.email.trim()) e.email = t("errEmail");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t("errEmailFormat");
    if (form.telefon.replace(/\D/g, "").length !== 9) e.telefon = t("errPhone");

    // Fakturační adresa — RÚIAN confirmed NENÍ povinné, stačí vyplnit pole
    const addrErr: AddressErrors = {};
    if (!form.adresa.mesto.trim()) addrErr.mesto = t("errCity");
    if (!form.adresa.uliceCp.trim()) addrErr.uliceCp = t("errStreet");
    if (Object.keys(addrErr).length > 0) e.adresa = addrErr;

    // Doručovací adresa (pokud je zaškrtnuta)
    if (jineDorucenoAdresa) {
      const dorErr: AddressErrors = {};
      if (!form.dorAdresa.mesto.trim()) dorErr.mesto = t("errCity");
      if (!form.dorAdresa.uliceCp.trim()) dorErr.uliceCp = t("errStreet");
      if (Object.keys(dorErr).length > 0) e.dorAdresa = dorErr;
    }

    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      const firstKey = Object.keys(e)[0];
      setTimeout(() => {
        const el = document.querySelector(`[data-field="${firstKey}"]`);
        if (el) window.scrollTo({ top: (el as HTMLElement).getBoundingClientRect().top + window.scrollY - 120, behavior: "smooth" });
      }, 50);
      return;
    }
    trackEvent("checkout_step_completed", { step: 3 });
    setLoading(true);
    const rawOrder = localStorage.getItem(ORDER_KEY);
    const parsedOrder = rawOrder ? JSON.parse(rawOrder) : null;
    const metoda = (parsedOrder?.paymentMethod || parsedOrder?.platba || "").toLowerCase();

    // Měnu jde přepnout i tady na poslední straně (přepínač je v hlavičce),
    // takže bankovní převod + USD musíme odchytit znovu, ne jen na /objednavka.
    if (metoda.includes("prevod") && currency.code === "USD") {
      alert(t("errTransferUsd"));
      setLoading(false);
      return;
    }

    try {
      const dataToSave = { ...form, nakupNaFirmu, jineDorucenoAdresa };
      sessionStorage.setItem(INFO_KEY, JSON.stringify(dataToSave));
      if (metoda.includes("karta") || metoda.includes("online") || metoda.includes("stripe")) {
        const discountAmountCZK = getDiscountAmount({ code: "CZK", symbol: "Kč", decimals: 0, symbolBefore: false });
        const res = await fetch("/api/checkout", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items, currency: currency.code,
            orderData: { ...dataToSave, doprava: parsedOrder?.doprava ?? null, dopravaName: parsedOrder?.dopravaName || "Doprava", dopravaPrice: parsedOrder?.dopravaPrices || 0, isDobirka: parsedOrder?.isDobirka || false, discountCode: appliedDiscount?.code ?? null, discountLabel: appliedDiscount?.label ?? null, discountAmountCZK: discountAmountCZK > 0 ? discountAmountCZK : 0, zbox: parsedOrder?.zbox ?? null },
          }),
        });
        const d = await res.json();
        if (d.url) { clearCart(); removeDiscount(); window.location.href = d.url; return; }
        else alert("Stripe chyba: " + d.error);
      }

      // Dobírka / bankovní převod — žádný Stripe krok, objednávku uložíme
      // rovnou přes /api/orders, ať o ní admin ví (dřív se neukládala nikam).
      let createdOrderId: string | null = null;
      if (metoda.includes("dobirka") || metoda.includes("prevod")) {
        const discountAmountCZK = getDiscountAmount({ code: "CZK", symbol: "Kč", decimals: 0, symbolBefore: false });
        const res = await fetch("/api/orders", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items, currency: currency.code,
            paymentMethod: metoda.includes("dobirka") ? "dobirka" : "prevod",
            orderData: { ...dataToSave, doprava: parsedOrder?.doprava ?? null, dopravaName: parsedOrder?.dopravaName || "Doprava", dopravaPrice: parsedOrder?.dopravaPrices || 0, discountCode: appliedDiscount?.code ?? null, discountLabel: appliedDiscount?.label ?? null, discountAmountCZK: discountAmountCZK > 0 ? discountAmountCZK : 0, zbox: parsedOrder?.zbox ?? null },
          }),
        });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) {
          console.error("Nepodařilo se uložit objednávku:", d.error);
          // Necháme zákazníka pokračovat na success stránku i tak — nechceme
          // mu zablokovat dokončení kvůli chybě na naší straně, jen to zalogujeme.
        } else {
          createdOrderId = d.orderId ?? null;
        }
      }

      // Snapshot košíku a info uložíme PŘED clearCart — success page ho přečte
      try {
        localStorage.setItem("hackpack-order-snapshot", JSON.stringify({
          items,
          info: dataToSave,
          orderData: parsedOrder,
          savedAt: Date.now(),
        }));
      } catch {}
      sessionStorage.removeItem(INFO_KEY);
      clearCart(); removeDiscount();
      const successParams: Record<string, string> = { method: metoda || "dobirka" };
      if (createdOrderId) successParams.order_id = createdOrderId;
      window.location.href = `/objednavka/uspech?${new URLSearchParams(successParams)}`;
    } catch (err: any) {
      alert(t("errGeneric", { message: err.message }));
    } finally {
      setLoading(false);
    }
  }

  const currentTotalPrice = getTotalPrice(currency);
  const discountAmount = getDiscountAmount(currency);
  const currentDopravaPrice = orderData?.dopravaPrices ? getPrice(orderData.dopravaPrices, currency) : 0;
  const currentDobirkaExtra = orderData?.isDobirka ? getPrice(DOBIRKA_FEE, currency) : 0;
  const celkem = getFinalPrice(currency) + currentDopravaPrice + currentDobirkaExtra;
  const isZasilkovna = orderData?.doprava === "zasilkovna_box";

  return (
    <>
      <Header />
      <main className="min-h-screen bg-dark">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 py-10">
          <nav className="flex items-center gap-2 text-xs text-text-subtle mb-8">
            <a href="/" className="hover:text-text-muted transition-colors">{t("home")}</a>
            <ChevronRight size={12} className="text-border" aria-hidden="true" />
            <a href="/kosik" className="hover:text-text-muted transition-colors">{t("cart")}</a>
            <ChevronRight size={12} className="text-border" aria-hidden="true" />
            <a href="/objednavka" className="hover:text-text-muted transition-colors">{t("shippingStep")}</a>
            <ChevronRight size={12} className="text-border" aria-hidden="true" />
            <span className="text-text-muted">{t("title")}</span>
          </nav>

          <CheckoutStepper step={3} />

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1 flex flex-col gap-6">

              {/* Osobní údaje */}
              <div className="bg-secondary border border-border rounded-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-border">
                  <h2 className="text-text-base font-semibold text-lg">{t("personalHeading")}</h2>
                </div>
                <div className="p-6 flex flex-col gap-4">
                  <NameField value={form.jmeno} onChange={v => setSimpleField("jmeno", v)} error={errors.jmeno} />
                  <Field label={t("email")} name="email" type="email" value={form.email} onChange={e => setSimpleField("email", e.target.value)} placeholder="jan@email.cz" error={errors.email} autoComplete="email" required />
                  <TelefonField value={form.telefon} onChange={v => setSimpleField("telefon", v)} error={errors.telefon} />
                </div>
              </div>

              {/* Fakturační adresa */}
              <div className="bg-secondary border border-border rounded-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-border flex items-center justify-between">
                  <h2 className="text-text-base font-semibold text-lg">{t("billingHeading")}</h2>
                  <CheckRow checked={nakupNaFirmu} onChange={() => setNakupNaFirmu(v => !v)}>{t("buyingAsCompany")}</CheckRow>
                </div>
                {nakupNaFirmu && (
                  <div className="px-6 pt-5 pb-2 grid grid-cols-2 gap-4 border-b border-border">
                    <div className="col-span-2"><Field label={t("companyName")} name="firma" value={form.firma} onChange={e => setSimpleField("firma", e.target.value)} placeholder="Firma s.r.o." autoComplete="organization" /></div>
                    <Field label={t("companyId")} name="ic" value={form.ic} onChange={e => setSimpleField("ic", e.target.value)} placeholder="12345678" />
                    <Field label={t("vatId")} name="dic" value={form.dic} onChange={e => setSimpleField("dic", e.target.value)} placeholder="CZ12345678" />
                  </div>
                )}
                <div className="p-6 flex flex-col gap-5">
                  <SmartAddressBlock
                    value={form.adresa}
                    onChange={updated => { setForm(prev => ({ ...prev, adresa: updated })); setErrors(prev => ({ ...prev, adresa: undefined })); }}
                    onConfirm={setAdresaConfirmed}
                    confirmed={adresaConfirmed}
                    errors={errors.adresa}
                  />
                  <SelectField label={t("country")} name="adresaZeme" value={form.adresa.zeme}
                    onChange={e => setForm(prev => ({ ...prev, adresa: { ...prev.adresa, zeme: e.target.value } }))}
                    options={countryOptions} />
                </div>
              </div>

              {/* Doručovací adresa */}
              <div className="bg-secondary border border-border rounded-2xl p-6 flex flex-col gap-4">
                {isZasilkovna && orderData?.zbox && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                    <MapPin size={16} className="text-primary-ink mt-0.5" />
                    <div>
                      <p className="text-text-base text-xs font-semibold">Vyzvednutí na výdejním místě</p>
                      <p className="text-text-muted text-xs mt-0.5">{orderData.zbox.nameStreet}, {orderData.zbox.city}</p>
                    </div>
                  </div>
                )}
                {!isZasilkovna && (
                  <>
                    <CheckRow checked={jineDorucenoAdresa} onChange={() => {
                      const next = !jineDorucenoAdresa;
                      setJineDorucenoAdresa(next);
                      if (!next) { setForm(prev => ({ ...prev, dorAdresa: emptyAddress() })); setDorAdresaConfirmed(false); }
                    }}>{t("differentAddress")}</CheckRow>
                    {jineDorucenoAdresa && (
                      <div className="flex flex-col gap-5 pt-2 pl-7 border-l-2 border-primary/20 ml-2">
                        <SmartAddressBlock
                          value={form.dorAdresa}
                          onChange={updated => { setForm(prev => ({ ...prev, dorAdresa: updated })); setErrors(prev => ({ ...prev, dorAdresa: undefined })); }}
                          onConfirm={setDorAdresaConfirmed}
                          confirmed={dorAdresaConfirmed}
                          errors={errors.dorAdresa}
                        />
                        <SelectField label={t("country")} name="dorZeme" value={form.dorAdresa.zeme}
                          onChange={e => setForm(prev => ({ ...prev, dorAdresa: { ...prev.dorAdresa, zeme: e.target.value } }))}
                          options={countryOptions} />
                      </div>
                    )}
                  </>
                )}
                <div className="h-px bg-border" />
                <CheckRow checked={zadatPoznamku} onChange={() => setZadatPoznamku(v => !v)}>{t("addNote")}</CheckRow>
                {zadatPoznamku && (
                  <div className="pt-1 pl-7 ml-2 border-l-2 border-primary/20">
                    <textarea value={form.poznamka} onChange={e => setForm(prev => ({ ...prev, poznamka: e.target.value }))}
                      placeholder={t("notePlaceholder")} rows={3}
                      className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text-base focus:outline-none focus:border-primary/50 transition-colors resize-none" />
                  </div>
                )}
                <div className="h-px bg-border" />
                <CheckRow checked={noNewsletter} onChange={() => setNoNewsletter(v => !v)}>{t("noNewsletter")}</CheckRow>
                <CheckRow checked={registrace} onChange={() => setRegistrace(v => !v)}>{t("register")}</CheckRow>
              </div>
            </div>

            {/* Sumář */}
            <div className="w-full lg:w-80 shrink-0 sticky top-24 flex flex-col gap-4">
              <div className="bg-secondary border border-border rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <h2 className="text-text-base font-semibold text-sm">{t("itemsHeading")}</h2>
                  <a href="/kosik" className="text-primary-ink text-xs hover:underline">Upravit</a>
                </div>
                <div className="px-5 py-3 flex flex-col gap-3 max-h-48 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.slug + JSON.stringify(item.variants)} className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-lg bg-dark/5 border border-border shrink-0 overflow-hidden">
                        <Image src={item.img} alt={item.name} fill className="object-contain p-1" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-text-base text-xs font-medium line-clamp-1">{item.name}</p>
                        <p className="text-text-subtle text-xs">× {item.quantity}</p>
                      </div>
                      <p className="text-text-base text-xs font-semibold shrink-0">{formatPrice(getItemPrice(item, currency) * item.quantity, currency)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-secondary border border-border rounded-2xl overflow-hidden">
                <div className="px-5 py-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted">{tc("subtotal")}</span>
                    <span className={`font-medium ${appliedDiscount && discountAmount > 0 ? "text-text-subtle line-through" : "text-text-base"}`}>{formatPrice(currentTotalPrice, currency)}</span>
                  </div>
                  {appliedDiscount && discountAmount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-600 flex items-center gap-1.5"><Tag size={12} aria-hidden="true" /><span>{appliedDiscount.code}</span></span>
                      <span className="text-green-600 font-semibold">− {formatPrice(discountAmount, currency)}</span>
                    </div>
                  )}
                  {appliedDiscount && !isDiscountActive() && (() => {
                    const missingCZK = Math.max(0, (appliedDiscount.minOrderCZK ?? 0) - totalPriceCZK);
                    const showApprox = currency.code !== "CZK" && missingCZK > 0;
                    return (
                      <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200">
                        <AlertTriangle size={13} className="text-red-500 shrink-0 mt-0.5" />
                        <p className="text-red-700 text-xs leading-relaxed">
                          {(() => {
                            const [before, after] = t("discountNotApplied", { code: appliedDiscount.code }).split("{amount}");
                            return (
                              <>
                                {before}
                                <span className="font-bold">{formatPrice(missingCZK, CURRENCIES.CZK)}</span>
                                {showApprox && <span className="text-red-500"> (≈ {formatPrice(approxConvert(missingCZK, currency.code), currency)}*)</span>}
                                {after}
                              </>
                            );
                          })()}
                        </p>
                      </div>
                    );
                  })()}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted">{tc("shipping")} ({shippingLabel(tc, orderData?.doprava, orderData?.dopravaName)})</span>
                    <span className="text-text-base font-medium">{currentDopravaPrice > 0 ? formatPrice(currentDopravaPrice, currency) : t("free")}</span>
                  </div>
                  {orderData?.isDobirka && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-muted">{tc("cod")}</span>
                      <span className="text-text-base font-medium">{formatPrice(currentDobirkaExtra, currency)}</span>
                    </div>
                  )}
                  <div className="h-px bg-border my-1" />
                  <div className="flex items-center justify-between">
                    <span className="text-text-base font-bold">{tc("total")}</span>
                    <span className="text-primary-ink font-extrabold text-xl">{formatPrice(celkem, currency)}</span>
                  </div>
                </div>
                <div className="px-5 pb-4"><DiscountWidget /></div>
                <div className="px-5 pb-5 flex flex-col gap-3">
                  <button onClick={handleSubmit} disabled={loading || items.length === 0}
                    className="w-full py-4 rounded-2xl bg-primary text-on-primary font-bold text-sm hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <><Check size={16} aria-hidden="true" /> {t("submit")}</>}
                  </button>
                  <p className="text-text-subtle text-xs text-center">{tc("securePayment")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}