"use client";

// content/legal/cookies.tsx
// Texty stránky o cookies ve všech třech jazycích + soupis ukládaných souborů.
//
// ZÁVAZNÁ JE ČESKÁ VERZE — viz doložka v LegalLayout.
//
// SOUPIS MUSÍ ODPOVÍDAT TOMU, CO WEB SKUTEČNĚ UKLÁDÁ. Když přibyde nebo zmizí
// nějaký nástroj, patří změna i sem — nepřesný soupis je porušení GDPR sám
// o sobě, i kdyby zbytek webu byl v pořádku.
//
// Účel je Record<Locale, string> a ne tři samostatné seznamy schválně: řádky
// tabulky tak nemůžou v jednom jazyce chybět nebo být navíc.

import type { Locale } from "@/lib/locale";

export const COOKIES_EFFECTIVE_FROM = "1. 1. 2026";

// Typ je klíč, ne zobrazený text. Dřív se porovnával řetězec `type === "Nezbytné"`
// kvůli barvě štítku — po překladu by všechny štítky zšedly.
export type StorageType = "necessary" | "preference" | "analytics";

export type StorageEntry = {
  name: string;
  storage: string;
  provider: string;
  purpose: Record<Locale, string>;
  expiry: Record<Locale, string>;
  type: StorageType;
};

const FOREVER = { cs: "Dokud ji nesmažete", sk: "Kým ju nezmažete", en: "Until you delete it" };
const TAB_CLOSE = { cs: "Do zavření karty", sk: "Do zatvorenia karty", en: "Until you close the tab" };
const ONE_YEAR = { cs: "1 rok", sk: "1 rok", en: "1 year" };
const TWELVE_HOURS = { cs: "12 hodin", sk: "12 hodín", en: "12 hours" };

export const STORAGE_LIST: StorageEntry[] = [
  {
    name: "slingr-cookie-consent",
    storage: "localStorage",
    provider: "SLINGR",
    purpose: {
      cs: "Uchovává vaši volbu souhlasu s cookies, aby se vás web neptal znovu.",
      sk: "Uchováva vašu voľbu súhlasu s cookies, aby sa vás web nepýtal znova.",
      en: "Stores your cookie consent choice so the site doesn't ask again.",
    },
    expiry: FOREVER,
    type: "necessary",
  },
  {
    name: "slingr-cookie-visited-details",
    storage: "sessionStorage",
    provider: "SLINGR",
    purpose: {
      cs: "Poznamená si, že jste viděli tuto stránku s detaily, a zmenší podle toho lištu se souhlasem.",
      sk: "Poznamená si, že ste videli túto stránku s detailmi, a zmenší podľa toho lištu so súhlasom.",
      en: "Notes that you've seen this details page, and shrinks the consent bar accordingly.",
    },
    expiry: TAB_CLOSE,
    type: "necessary",
  },
  {
    name: "slingr-cart",
    storage: "localStorage",
    provider: "SLINGR",
    purpose: {
      cs: "Obsah nákupního košíku, aby vám zboží nezmizelo mezi stránkami ani po zavření prohlížeče.",
      sk: "Obsah nákupného košíka, aby vám tovar nezmizol medzi stránkami ani po zatvorení prehliadača.",
      en: "The contents of your cart, so your items survive moving between pages and closing the browser.",
    },
    expiry: FOREVER,
    type: "necessary",
  },
  {
    name: "slingr-order",
    storage: "localStorage",
    provider: "SLINGR",
    purpose: {
      cs: "Zvolená doprava a platba, aby se vám nastavení neztratilo mezi kroky objednávky.",
      sk: "Zvolená doprava a platba, aby sa vám nastavenie nestratilo medzi krokmi objednávky.",
      en: "Your chosen shipping and payment, so the settings survive between checkout steps.",
    },
    expiry: FOREVER,
    type: "necessary",
  },
  {
    name: "slingr-info",
    storage: "sessionStorage",
    provider: "SLINGR",
    purpose: {
      cs: "Rozepsané údaje z objednávkového formuláře, abyste je nemuseli vyplňovat znovu při návratu.",
      sk: "Rozpísané údaje z objednávkového formulára, aby ste ich nemuseli vypĺňať znova pri návrate.",
      en: "The details you've started typing into the order form, so you don't retype them if you go back.",
    },
    expiry: TAB_CLOSE,
    type: "necessary",
  },
  {
    name: "slingr-zbox",
    storage: "localStorage",
    provider: "SLINGR",
    purpose: {
      cs: "Vybrané výdejní místo Zásilkovny.",
      sk: "Vybrané výdajné miesto Zásielkovne.",
      en: "The Zásilkovna pickup point you selected.",
    },
    expiry: FOREVER,
    type: "necessary",
  },
  {
    name: "slingr-order-snapshot",
    storage: "sessionStorage",
    provider: "SLINGR",
    purpose: {
      cs: "Kopie dokončené objednávky pro stránku s potvrzením.",
      sk: "Kópia dokončenej objednávky pre stránku s potvrdením.",
      en: "A copy of your completed order for the confirmation page.",
    },
    expiry: TAB_CLOSE,
    type: "necessary",
  },
  {
    name: "slingr-last-review",
    storage: "localStorage",
    provider: "SLINGR",
    purpose: {
      cs: "Čas vašeho posledního odeslaného hodnocení — brání opakovanému rozesílání recenzí.",
      sk: "Čas vášho posledného odoslaného hodnotenia — bráni opakovanému rozosielaniu recenzií.",
      en: "The time of your last submitted rating — stops reviews being sent repeatedly.",
    },
    expiry: FOREVER,
    type: "necessary",
  },
  {
    name: "review_device_id",
    storage: "Cookie (httpOnly)",
    provider: "SLINGR",
    purpose: {
      cs: "Rozlišuje prohlížeč, ze kterého jste psali recenzi, aby limit nesdíleli lidé na stejné síti.",
      sk: "Rozlišuje prehliadač, z ktorého ste písali recenziu, aby limit nezdieľali ľudia na rovnakej sieti.",
      en: "Identifies the browser you wrote a review from, so people on the same network don't share the limit.",
    },
    expiry: ONE_YEAR,
    type: "necessary",
  },
  {
    name: "slingr-currency",
    storage: "localStorage",
    provider: "SLINGR",
    purpose: {
      cs: "Měna, kterou jste si sami zvolili pro zobrazení cen.",
      sk: "Mena, ktorú ste si sami zvolili na zobrazenie cien.",
      en: "The currency you chose for displaying prices.",
    },
    expiry: FOREVER,
    type: "preference",
  },
  {
    name: "hp_lang",
    storage: "Cookie",
    provider: "SLINGR",
    purpose: {
      cs: "Jazyk, který jste si sami zvolili pro zobrazení webu. Vzniká až ve chvíli, kdy jazyk přepnete — do té doby se web zobrazuje česky a žádná cookie se neukládá.",
      sk: "Jazyk, ktorý ste si sami zvolili na zobrazenie webu. Vzniká až vo chvíli, keď jazyk prepnete — dovtedy sa web zobrazuje česky a žiadna cookie sa neukladá.",
      en: "The language you chose for the site. It's only created once you switch languages — until then the site is in Czech and no cookie is stored.",
    },
    expiry: ONE_YEAR,
    type: "preference",
  },
  {
    name: "admin_session",
    storage: "Cookie (httpOnly)",
    provider: "SLINGR",
    purpose: {
      cs: "Přihlášení do administrace e-shopu. Vzniká pouze správci obchodu, běžnému návštěvníkovi nikdy.",
      sk: "Prihlásenie do administrácie e-shopu. Vzniká iba správcovi obchodu, bežnému návštevníkovi nikdy.",
      en: "Signs the shop administrator into the admin. Only ever created for an administrator, never for a regular visitor.",
    },
    expiry: TWELVE_HOURS,
    type: "necessary",
  },
  {
    name: "admin_hint",
    storage: "Cookie",
    provider: "SLINGR",
    purpose: {
      cs: "Označuje přihlášeného správce, aby se jeho vlastní procházení e-shopu nezapočítávalo do statistik.",
      sk: "Označuje prihláseného správcu, aby sa jeho vlastné prehliadanie e-shopu nezapočítavalo do štatistík.",
      en: "Marks a signed-in administrator so their own browsing isn't counted in the statistics.",
    },
    expiry: TWELVE_HOURS,
    type: "necessary",
  },
  {
    name: "ph_*",
    storage: "Cookie",
    provider: "PostHog",
    purpose: {
      cs: "Anonymní měření návštěvnosti — které stránky se čtou a odkud návštěvníci přicházejí. Ukládá se výhradně po vašem souhlasu.",
      sk: "Anonymné meranie návštevnosti — ktoré stránky sa čítajú a odkiaľ návštevníci prichádzajú. Ukladá sa výhradne po vašom súhlase.",
      en: "Anonymous traffic measurement — which pages get read and where visitors come from. Stored only with your consent.",
    },
    expiry: ONE_YEAR,
    type: "analytics",
  },
  {
    name: "__ph_opt_in_out_*",
    storage: "Cookie",
    provider: "PostHog",
    purpose: {
      cs: "Pamatuje si, že jste analytiku odmítli, aby se měření nespustilo ani omylem.",
      sk: "Pamätá si, že ste analytiku odmietli, aby sa meranie nespustilo ani omylom.",
      en: "Remembers that you declined analytics, so measurement can't start even by accident.",
    },
    expiry: ONE_YEAR,
    type: "necessary",
  },
];

// Odkazy na nápovědu prohlížečů. Dřív mířily napevno na české verze
// (/cs/kb/, /cs-cz/) — anglický návštěvník dostal návod v češtině.
export const BROWSER_HELP: Record<Locale, { label: string; href: string }[]> = {
  cs: [
    { label: "Google Chrome", href: "https://support.google.com/chrome/answer/95647?hl=cs" },
    { label: "Mozilla Firefox", href: "https://support.mozilla.org/cs/kb/vymazani-cookies" },
    { label: "Safari", href: "https://support.apple.com/cs-cz/guide/safari/sfri11471/mac" },
    { label: "Microsoft Edge", href: "https://support.microsoft.com/cs-cz/microsoft-edge/odstran%C4%9Bn%C3%AD-soubor%C5%AF-cookie-v-aplikaci-microsoft-edge-63947427-b3b4-4c78-b95e-a86a7ee4094a" },
  ],
  sk: [
    { label: "Google Chrome", href: "https://support.google.com/chrome/answer/95647?hl=sk" },
    { label: "Mozilla Firefox", href: "https://support.mozilla.org/sk/kb/odstranenie-cookies" },
    { label: "Safari", href: "https://support.apple.com/sk-sk/guide/safari/sfri11471/mac" },
    { label: "Microsoft Edge", href: "https://support.microsoft.com/sk-sk/microsoft-edge/odstr%C3%A1nenie-s%C3%BAborov-cookie-v-prehliada%C4%8Di-microsoft-edge-63947427-b3b4-4c78-b95e-a86a7ee4094a" },
  ],
  en: [
    { label: "Google Chrome", href: "https://support.google.com/chrome/answer/95647?hl=en" },
    { label: "Mozilla Firefox", href: "https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox" },
    { label: "Safari", href: "https://support.apple.com/en-gb/guide/safari/sfri11471/mac" },
    { label: "Microsoft Edge", href: "https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" },
  ],
};

export const COOKIES_TITLE: Record<Locale, string> = {
  cs: "Používání souborů cookies",
  sk: "Používanie súborov cookies",
  en: "Use of cookies",
};

export const COOKIES_SUBTITLE: Record<Locale, string> = {
  cs: "V souladu s nařízením GDPR a zákonem o elektronických komunikacích",
  sk: "V súlade s nariadením GDPR a zákonom o elektronických komunikáciách",
  en: "In accordance with the GDPR and the Czech Electronic Communications Act",
};

// ── Prózové části sekcí 1, 2 a 3 (nesou <strong>, proto JSX, ne JSON) ─────────

export const COOKIES_INTRO: Record<Locale, () => React.ReactElement> = {
  cs: () => (
    <>
      <p>Cookies jsou krátké textové soubory, které navštívená webová stránka odešle do vašeho prohlížeče. Umožňují webu zaznamenat informace o vaší návštěvě, například preferovaný jazyk, obsah nákupního košíku a další nastavení. Příští návštěva stránek tak může být snazší a produktivnější. Bez cookies by prohlížení webu bylo složitější, protože by si e-shop nepamatoval vaše kroky a stav nákupu.</p>
      <p>Vedle cookies používáme i podobná úložiště prohlížeče (<strong>localStorage</strong> a <strong>sessionStorage</strong>). Fungují prakticky stejně, jen data neputují s každým požadavkem na server — v soupisu níže je proto uvádíme společně a vždy označujeme, o které úložiště jde.</p>
    </>
  ),
  sk: () => (
    <>
      <p>Cookies sú krátke textové súbory, ktoré navštívená webová stránka odošle do vášho prehliadača. Umožňujú webu zaznamenať informácie o vašej návšteve, napríklad preferovaný jazyk, obsah nákupného košíka a ďalšie nastavenia. Ďalšia návšteva stránok tak môže byť jednoduchšia a produktívnejšia. Bez cookies by prehliadanie webu bolo zložitejšie, pretože by si e-shop nepamätal vaše kroky a stav nákupu.</p>
      <p>Popri cookies používame aj podobné úložiská prehliadača (<strong>localStorage</strong> a <strong>sessionStorage</strong>). Fungujú prakticky rovnako, len dáta neputujú s každou požiadavkou na server — v súpise nižšie ich preto uvádzame spoločne a vždy označujeme, o ktoré úložisko ide.</p>
    </>
  ),
  en: () => (
    <>
      <p>Cookies are short text files that a website you visit sends to your browser. They let the site record information about your visit — your preferred language, the contents of your cart and other settings. That makes your next visit easier and more productive. Without cookies, browsing would be harder, because the shop wouldn’t remember your steps or the state of your purchase.</p>
      <p>Alongside cookies we also use similar browser storage (<strong>localStorage</strong> and <strong>sessionStorage</strong>). They work much the same way, except the data doesn’t travel with every request to the server — the list below covers them together and always says which storage is involved.</p>
    </>
  ),
};

export const COOKIES_CATEGORIES: Record<Locale, () => React.ReactElement> = {
  cs: () => (
    <>
      <p>Na našem e-shopu rozdělujeme soubory cookie do následujících kategorií:</p>
      <ul>
        <li><strong>Nezbytné (technické)</strong> — Jsou klíčové pro správný chod e-shopu. Zajišťují obsah nákupního košíku, funkčnost pokladny, přihlášení do administrace a zapamatování vaší volby souhlasu. Bez nich by nebylo možné nákup dokončit a nelze je vypnout.</li>
        <li><strong>Preferenční</strong> — Pamatují si nastavení, které jste si sami zvolili: jazyk webu (cookie <strong>hp_lang</strong>) a měnu pro zobrazení cen. Vznikají až ve chvíli, kdy volbu sami provedete, a zůstávají u nás — nikam se neodesílají.</li>
        <li><strong>Analytické</strong> — Pomáhají nám pochopit, jak web používáte (které stránky navštěvujete nejčastěji, odkud přicházíte). Zajišťuje je nástroj <strong>PostHog</strong> a ukládají se výhradně po vašem souhlasu. Dokud souhlas nedáte, na PostHog se neodešle žádný požadavek.</li>
        <li><strong>Marketingové</strong> — <strong>Žádné zatím nepoužíváme.</strong> Volbu níže si ukládáme dopředu, aby platila okamžitě, kdyby v budoucnu nějaký takový nástroj přibyl.</li>
      </ul>
      <p>Vaše údaje <strong>neprodáváme</strong> a nepředáváme je reklamním sítím ani provozovatelům sociálních sítí.</p>
    </>
  ),
  sk: () => (
    <>
      <p>Na našom e-shope rozdeľujeme súbory cookie do nasledujúcich kategórií:</p>
      <ul>
        <li><strong>Nevyhnutné (technické)</strong> — Sú kľúčové pre správny chod e-shopu. Zaisťujú obsah nákupného košíka, funkčnosť pokladne, prihlásenie do administrácie a zapamätanie vašej voľby súhlasu. Bez nich by nebolo možné nákup dokončiť a nedajú sa vypnúť.</li>
        <li><strong>Preferenčné</strong> — Pamätajú si nastavenia, ktoré ste si sami zvolili: jazyk webu (cookie <strong>hp_lang</strong>) a menu na zobrazenie cien. Vznikajú až vo chvíli, keď voľbu sami vykonáte, a zostávajú u nás — nikam sa neodosielajú.</li>
        <li><strong>Analytické</strong> — Pomáhajú nám pochopiť, ako web používate (ktoré stránky navštevujete najčastejšie, odkiaľ prichádzate). Zaisťuje ich nástroj <strong>PostHog</strong> a ukladajú sa výhradne po vašom súhlase. Kým súhlas nedáte, na PostHog sa neodošle žiadna požiadavka.</li>
        <li><strong>Marketingové</strong> — <strong>Žiadne zatiaľ nepoužívame.</strong> Voľbu nižšie si ukladáme dopredu, aby platila okamžite, keby v budúcnosti nejaký takýto nástroj pribudol.</li>
      </ul>
      <p>Vaše údaje <strong>nepredávame</strong> a neodovzdávame ich reklamným sieťam ani prevádzkovateľom sociálnych sietí.</p>
    </>
  ),
  en: () => (
    <>
      <p>We sort cookies on our shop into the following categories:</p>
      <ul>
        <li><strong>Necessary (technical)</strong> — Essential for the shop to work. They hold the contents of your cart, make the checkout function, sign administrators in and remember your consent choice. Without them a purchase couldn’t be completed, and they can’t be turned off.</li>
        <li><strong>Preference</strong> — They remember settings you chose yourself: the site language (the <strong>hp_lang</strong> cookie) and the currency for displaying prices. They’re only created once you make the choice, and they stay with us — they’re never sent anywhere.</li>
        <li><strong>Analytics</strong> — They help us understand how you use the site (which pages get visited most, where you come from). They’re provided by <strong>PostHog</strong> and stored only with your consent. Until you consent, not a single request goes to PostHog.</li>
        <li><strong>Marketing</strong> — <strong>We don’t use any yet.</strong> We store the choice below in advance so it applies immediately should such a tool ever be added.</li>
      </ul>
      <p>We <strong>do not sell</strong> your data and do not pass it to advertising networks or social network operators.</p>
    </>
  ),
};

export const COOKIES_CONSENT_INTRO: Record<Locale, () => React.ReactElement> = {
  cs: () => (
    <>
      <p>Zpracování technických cookies je nezbytné pro plnění smlouvy (uskutečnění nákupu) a je prováděno na základě oprávněného zájmu. Ostatní kategorie cookies zpracováváme pouze na základě vašeho <strong>dobrovolného souhlasu</strong>.</p>
      <p>Své preference můžete kdykoliv bezplatně změnit a uložit přímo prostřednictvím níže přiloženého formuláře. Změna se projeví okamžitě — odvoláním souhlasu se měření zastaví a analytické údaje se z tohoto prohlížeče smažou.</p>
    </>
  ),
  sk: () => (
    <>
      <p>Spracovanie technických cookies je nevyhnutné pre plnenie zmluvy (uskutočnenie nákupu) a je vykonávané na základe oprávneného záujmu. Ostatné kategórie cookies spracovávame iba na základe vášho <strong>dobrovoľného súhlasu</strong>.</p>
      <p>Svoje preferencie môžete kedykoľvek bezplatne zmeniť a uložiť priamo prostredníctvom nižšie priloženého formulára. Zmena sa prejaví okamžite — odvolaním súhlasu sa meranie zastaví a analytické údaje sa z tohto prehliadača zmažú.</p>
    </>
  ),
  en: () => (
    <>
      <p>Processing technical cookies is necessary to perform the contract (completing your purchase) and is done on the basis of legitimate interest. All other categories are processed only on the basis of your <strong>freely given consent</strong>.</p>
      <p>You can change and save your preferences at any time, free of charge, using the form below. The change takes effect immediately — withdrawing consent stops the measurement and deletes the analytics data from this browser.</p>
    </>
  ),
};
