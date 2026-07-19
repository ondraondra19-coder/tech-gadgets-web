"use client";

// content/legal/terms.tsx
// Obchodní podmínky ve všech třech jazycích.
//
// ZÁVAZNÁ JE ČESKÁ VERZE — anglická a slovenská jsou překlad pro pohodlí
// zákazníka. Doložku o tom vykresluje LegalLayout. Když měníš text, měň ho
// primárně v `cs` a ostatní srovnej podle něj.
//
// PROČ JSOU VŠECHNY TŘI JAZYKY V JEDNOM SOUBORU: aby šlo vidět na jeden pohled,
// že sekce sedí. Rozházené po samostatných souborech se rozejdou.
//
// Dopravci a ceny se berou z lib/shipping/pricing.ts, ne z ručně psaného textu.
// Dřív tu byly vypsané PPL a DPD, které checkout vůbec nenabízí — obchodní
// podmínky slibovaly něco, co si zákazník nemohl koupit.

import Link from "next/link";
import { Section } from "@/components/legal/LegalLayout";
import type { Locale } from "@/lib/locale";
import { COMPANY, companyField } from "@/lib/companyInfo";
import { SHIPPING_PRICES } from "@/lib/shipping/pricing";
import { formatPrice, CURRENCIES } from "@/lib/currency";

export const TERMS_EFFECTIVE_FROM = "1. 1. 2024";

const czk = (n: number) => formatPrice(n, CURRENCIES.CZK);
const boxPrice = () => czk(SHIPPING_PRICES.zasilkovna_box.CZK);
const addrPrice = () => czk(SHIPPING_PRICES.zasilkovna_adresa.CZK);

// ── Čeština — závazné znění ───────────────────────────────────────────────────

function TermsCs() {
  return (
    <>
      <Section title="1. Základní ustanovení">
        <p>Tyto obchodní podmínky (dále jen „podmínky“) upravují vzájemná práva a povinnosti mezi prodávajícím a kupujícím při prodeji zboží prostřednictvím internetového obchodu <strong>SLINGR</strong> provozovaného na adrese <strong>slingr.cz</strong>.</p>
        <p>Prodávající: <strong>{companyField(COMPANY.name, "NÁZEV FIRMY")}</strong>, IČO: <strong>{companyField(COMPANY.companyId, "IČO")}</strong>, se sídlem <strong>{companyField(COMPANY.address, "ADRESA SÍDLA")}</strong>, zapsaná v obchodním rejstříku vedeném <strong>{companyField(COMPANY.registration, "SOUD A ODDÍL")}</strong>.</p>
        <p>Kontaktní e-mail: <strong>{COMPANY.email}</strong><br />Telefon: <strong>{COMPANY.phone}</strong></p>
      </Section>

      <Section title="2. Objednávka a uzavření smlouvy">
        <p>Webové rozhraní obchodu obsahuje seznam zboží nabízeného prodávajícím k prodeji. Ceny zboží jsou uvedeny včetně DPH. Nabídka prodeje zboží a ceny tohoto zboží zůstávají v platnosti po dobu, kdy jsou zobrazovány ve webovém rozhraní.</p>
        <p>Objednávku provedete vyplněním objednávkového formuláře. Před odesláním objednávky je vám umožněno zkontrolovat a měnit zadané údaje. Objednávku odešlete kliknutím na tlačítko „Dokončit objednávku“.</p>
        <p>Smlouva je uzavřena okamžikem doručení potvrzení objednávky na váš e-mail. Prodávající si vyhrazuje právo objednávku nepotvrdit v případě vyprodání zásob nebo zjevné chyby v ceně zboží.</p>
      </Section>

      <Section title="3. Ceny a platební podmínky">
        <p>Aktuální ceny jsou vždy uvedeny u jednotlivých produktů včetně DPH. Prodávající si vyhrazuje právo ceny měnit bez předchozího upozornění.</p>
        <p>Akceptované způsoby platby:</p>
        <ul>
          <li><strong>Online kartou</strong> — Visa, Mastercard, Apple Pay (platba proběhne okamžitě)</li>
          <li><strong>Bankovním převodem</strong> — zboží expedujeme po připsání platby na náš účet</li>
          <li><strong>Dobírkou</strong> — platba při převzetí zásilky (příplatek 39 Kč)</li>
        </ul>
      </Section>

      <Section title="4. Doprava a dodací podmínky">
        <p>Zboží expedujeme v pracovní dny. Objednávky přijaté do 14:00 odesíláme tentýž den.</p>
        <p>Dostupné způsoby dopravy:</p>
        <ul>
          <li><strong>Zásilkovna — výdejní místo</strong> — vyzvednutí na Z-BOXu nebo výdejním místě dle výběru, {boxPrice()}</li>
          <li><strong>Zásilkovna — na adresu</strong> — doručení kurýrem do 1–2 pracovních dní, {addrPrice()}</li>
        </ul>
        {COMPANY.freeShippingOverCZK > 0 && (
          <p>Doprava zdarma při objednávce nad <strong>{czk(COMPANY.freeShippingOverCZK)}</strong>.</p>
        )}
        <p>Při převzetí zásilky zkontrolujte neporušenost obalu. Viditelně poškozené zásilky reklamujte přímo u dopravce a neprodleně nás informujte na <strong>{COMPANY.email}</strong>.</p>
      </Section>

      <Section title="5. Odstoupení od smlouvy">
        <p>Jako spotřebitel máte právo odstoupit od smlouvy bez udání důvodu do <strong>14 dnů</strong> od převzetí zboží. My vám nad rámec zákona nabízíme rozšířenou lhůtu <strong>30 dní</strong>.</p>
        <p>Pro odstoupení nás kontaktujte e-mailem na <strong>{COMPANY.email}</strong>. Zboží zašlete zpět na adresu <strong>{companyField(COMPANY.warehouseAddress, "ADRESA SKLADU")}</strong> nejpozději do 14 dnů od oznámení odstoupení. Náklady na vrácení zboží nese kupující.</p>
        <p>Kupní cenu vrátíme do 14 dnů od obdržení vráceného zboží stejnou platební metodou, jakou jste použili při nákupu, pokud se nedohodneme jinak.</p>
        <p>Právo na odstoupení se nevztahuje na zboží upravené dle přání kupujícího nebo na zboží podléhající rychlé zkáze.</p>
      </Section>

      <Section title="6. Reklamace a práva z vadného plnění (Záruka)">
        <p>Prodávající odpovídá kupujícímu, že zboží při převzetí nemá vady. Na nové zboží se vztahuje zákonná lhůta pro uplatnění práv z vadného plnění v délce <strong>24 měsíců</strong>. U použitého nebo repasovaného zboží je tato lhůta <strong>12 měsíců</strong>.</p>
        <p>Projeví-li se vada v průběhu jednoho roku od převzetí, má se za to, že zboží bylo vadné již při převzetí, ledaže to povaha věci nebo vady vylučuje.</p>
        <p>V případě vady má kupující právo na odstranění vady opravou nebo dodáním nové věci. Není-li to možné, může kupující požadovat přiměřenou slevu nebo od smlouvy odstoupit.</p>
        <p>Reklamaci uplatněte e-mailem na <strong>{COMPANY.email}</strong> nebo písemně na adrese sídla. V reklamaci uveďte číslo objednávky, popis závady a zvolený způsob vyřízení. Podrobný technický postup a formuláře naleznete na naší stránce <Link href="/reklamace" className="text-primary-ink hover:underline font-bold">Reklamace a vrácení zboží</Link>.</p>
        <p>Reklamaci včetně odstranění vady vyřídíme bez zbytečného odkladu, nejpozději do <strong>30 dnů</strong>. Záruka se nevztahuje na poškození způsobené nesprávným používáním, mechanickým poškozením nebo přirozeným opotřebením.</p>
      </Section>

      <Section title="7. Mimosoudní řešení sporů">
        <p>K mimosoudnímu řešení spotřebitelských sporů je příslušná Česká obchodní inspekce, Štěpánská 567/15, 120 00 Praha 2, web: <a href="https://www.coi.cz" target="_blank" rel="noopener noreferrer">www.coi.cz</a>.</p>
        <p>Spotřebitel může rovněž využít platformu pro online řešení sporů dostupnou na <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">ec.europa.eu/consumers/odr</a>.</p>
      </Section>

      <Section title="8. Závěrečná ustanovení">
        <p>Tyto podmínky jsou platné a účinné od <strong>{TERMS_EFFECTIVE_FROM}</strong>. Prodávající si vyhrazuje právo podmínky měnit; aktuální verze bude vždy zveřejněna na těchto stránkách.</p>
        <p>Vztahy těmito podmínkami neupravené se řídí právním řádem České republiky, zejména zákonem č. 89/2012 Sb., občanský zákoník, a zákonem č. 634/1992 Sb., o ochraně spotřebitele.</p>
        <p>Tyto podmínky jsou vyhotoveny v českém jazyce. Případné cizojazyčné verze jsou pouze informativním překladem; v případě rozporu je rozhodující české znění.</p>
      </Section>
    </>
  );
}

// ── Slovenština ───────────────────────────────────────────────────────────────

function TermsSk() {
  return (
    <>
      <Section title="1. Základné ustanovenia">
        <p>Tieto obchodné podmienky (ďalej len „podmienky“) upravujú vzájomné práva a povinnosti medzi predávajúcim a kupujúcim pri predaji tovaru prostredníctvom internetového obchodu <strong>SLINGR</strong> prevádzkovaného na adrese <strong>slingr.cz</strong>.</p>
        <p>Predávajúci: <strong>{companyField(COMPANY.name, "NÁZOV FIRMY")}</strong>, IČO: <strong>{companyField(COMPANY.companyId, "IČO")}</strong>, so sídlom <strong>{companyField(COMPANY.address, "ADRESA SÍDLA")}</strong>, zapísaná v obchodnom registri vedenom <strong>{companyField(COMPANY.registration, "SÚD A ODDIEL")}</strong>.</p>
        <p>Kontaktný e-mail: <strong>{COMPANY.email}</strong><br />Telefón: <strong>{COMPANY.phone}</strong></p>
      </Section>

      <Section title="2. Objednávka a uzavretie zmluvy">
        <p>Webové rozhranie obchodu obsahuje zoznam tovaru ponúkaného predávajúcim na predaj. Ceny tovaru sú uvedené vrátane DPH. Ponuka predaja tovaru a ceny tohto tovaru zostávajú v platnosti po dobu, kedy sú zobrazované vo webovom rozhraní.</p>
        <p>Objednávku vykonáte vyplnením objednávkového formulára. Pred odoslaním objednávky je vám umožnené skontrolovať a meniť zadané údaje. Objednávku odošlete kliknutím na tlačidlo „Dokončiť objednávku“.</p>
        <p>Zmluva je uzavretá okamihom doručenia potvrdenia objednávky na váš e-mail. Predávajúci si vyhradzuje právo objednávku nepotvrdiť v prípade vypredania zásob alebo zjavnej chyby v cene tovaru.</p>
      </Section>

      <Section title="3. Ceny a platobné podmienky">
        <p>Aktuálne ceny sú vždy uvedené pri jednotlivých produktoch vrátane DPH. Predávajúci si vyhradzuje právo ceny meniť bez predchádzajúceho upozornenia.</p>
        <p>Akceptované spôsoby platby:</p>
        <ul>
          <li><strong>Online kartou</strong> — Visa, Mastercard, Apple Pay (platba prebehne okamžite)</li>
          <li><strong>Bankovým prevodom</strong> — tovar expedujeme po pripísaní platby na náš účet</li>
          <li><strong>Dobierkou</strong> — platba pri prevzatí zásielky (príplatok 39 Kč)</li>
        </ul>
      </Section>

      <Section title="4. Doprava a dodacie podmienky">
        <p>Tovar expedujeme v pracovné dni. Objednávky prijaté do 14:00 odosielame v ten istý deň.</p>
        <p>Dostupné spôsoby dopravy:</p>
        <ul>
          <li><strong>Zásielkovňa — výdajné miesto</strong> — vyzdvihnutie na Z-BOXe alebo výdajnom mieste podľa výberu, {boxPrice()}</li>
          <li><strong>Zásielkovňa — na adresu</strong> — doručenie kuriérom do 1–2 pracovných dní, {addrPrice()}</li>
        </ul>
        {COMPANY.freeShippingOverCZK > 0 && (
          <p>Doprava zadarmo pri objednávke nad <strong>{czk(COMPANY.freeShippingOverCZK)}</strong>.</p>
        )}
        <p>Pri prevzatí zásielky skontrolujte neporušenosť obalu. Viditeľne poškodené zásielky reklamujte priamo u dopravcu a bezodkladne nás informujte na <strong>{COMPANY.email}</strong>.</p>
      </Section>

      <Section title="5. Odstúpenie od zmluvy">
        <p>Ako spotrebiteľ máte právo odstúpiť od zmluvy bez udania dôvodu do <strong>14 dní</strong> od prevzatia tovaru. My vám nad rámec zákona ponúkame rozšírenú lehotu <strong>30 dní</strong>.</p>
        <p>Pre odstúpenie nás kontaktujte e-mailom na <strong>{COMPANY.email}</strong>. Tovar zašlite späť na adresu <strong>{companyField(COMPANY.warehouseAddress, "ADRESA SKLADU")}</strong> najneskôr do 14 dní od oznámenia odstúpenia. Náklady na vrátenie tovaru znáša kupujúci.</p>
        <p>Kúpnu cenu vrátime do 14 dní od obdržania vráteného tovaru rovnakou platobnou metódou, akú ste použili pri nákupe, pokiaľ sa nedohodneme inak.</p>
        <p>Právo na odstúpenie sa nevzťahuje na tovar upravený podľa priania kupujúceho alebo na tovar podliehajúci rýchlej skaze.</p>
      </Section>

      <Section title="6. Reklamácie a práva z vadného plnenia (Záruka)">
        <p>Predávajúci zodpovedá kupujúcemu, že tovar pri prevzatí nemá vady. Na nový tovar sa vzťahuje zákonná lehota na uplatnenie práv z vadného plnenia v dĺžke <strong>24 mesiacov</strong>. Pri použitom alebo repasovanom tovare je táto lehota <strong>12 mesiacov</strong>.</p>
        <p>Ak sa vada prejaví v priebehu jedného roka od prevzatia, má sa za to, že tovar bol vadný už pri prevzatí, ibaže to povaha veci alebo vady vylučuje.</p>
        <p>V prípade vady má kupujúci právo na odstránenie vady opravou alebo dodaním novej veci. Ak to nie je možné, môže kupujúci požadovať primeranú zľavu alebo od zmluvy odstúpiť.</p>
        <p>Reklamáciu uplatnite e-mailom na <strong>{COMPANY.email}</strong> alebo písomne na adrese sídla. V reklamácii uveďte číslo objednávky, popis závady a zvolený spôsob vybavenia. Podrobný technický postup a formuláre nájdete na našej stránke <Link href="/reklamace" className="text-primary-ink hover:underline font-bold">Reklamácie a vrátenie tovaru</Link>.</p>
        <p>Reklamáciu vrátane odstránenia vady vybavíme bez zbytočného odkladu, najneskôr do <strong>30 dní</strong>. Záruka sa nevzťahuje na poškodenie spôsobené nesprávnym používaním, mechanickým poškodením alebo prirodzeným opotrebovaním.</p>
      </Section>

      <Section title="7. Mimosúdne riešenie sporov">
        <p>Na mimosúdne riešenie spotrebiteľských sporov je príslušná Česká obchodná inšpekcia, Štěpánská 567/15, 120 00 Praha 2, web: <a href="https://www.coi.cz" target="_blank" rel="noopener noreferrer">www.coi.cz</a>.</p>
        <p>Spotrebiteľ môže takisto využiť platformu na online riešenie sporov dostupnú na <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">ec.europa.eu/consumers/odr</a>.</p>
      </Section>

      <Section title="8. Záverečné ustanovenia">
        <p>Tieto podmienky sú platné a účinné od <strong>{TERMS_EFFECTIVE_FROM}</strong>. Predávajúci si vyhradzuje právo podmienky meniť; aktuálna verzia bude vždy zverejnená na týchto stránkach.</p>
        <p>Vzťahy týmito podmienkami neupravené sa riadia právnym poriadkom Českej republiky, najmä zákonom č. 89/2012 Zb., občiansky zákonník, a zákonom č. 634/1992 Zb., o ochrane spotrebiteľa.</p>
        <p>Tieto podmienky sú vyhotovené v českom jazyku. Prípadné cudzojazyčné verzie sú iba informatívnym prekladom; v prípade rozporu je rozhodujúce české znenie.</p>
      </Section>
    </>
  );
}

// ── Angličtina ────────────────────────────────────────────────────────────────

function TermsEn() {
  return (
    <>
      <Section title="1. Introductory provisions">
        <p>These terms and conditions (the “Terms”) govern the mutual rights and obligations between the seller and the buyer in the sale of goods through the <strong>SLINGR</strong> online store operated at <strong>slingr.cz</strong>.</p>
        <p>Seller: <strong>{companyField(COMPANY.name, "COMPANY NAME")}</strong>, Company ID: <strong>{companyField(COMPANY.companyId, "COMPANY ID")}</strong>, registered office at <strong>{companyField(COMPANY.address, "REGISTERED ADDRESS")}</strong>, entered in the Commercial Register maintained by <strong>{companyField(COMPANY.registration, "COURT AND SECTION")}</strong>.</p>
        <p>Contact e-mail: <strong>{COMPANY.email}</strong><br />Phone: <strong>{COMPANY.phone}</strong></p>
      </Section>

      <Section title="2. Orders and formation of the contract">
        <p>The store’s web interface contains a list of goods offered for sale by the seller. Prices are stated including VAT. The offer to sell the goods and their prices remain valid for as long as they are displayed in the web interface.</p>
        <p>You place an order by completing the order form. Before submitting the order, you are able to check and change the details you have entered. You submit the order by clicking the “Place order” button.</p>
        <p>The contract is formed at the moment the order confirmation is delivered to your e-mail. The seller reserves the right not to confirm an order in the event that stock has run out or the price of the goods is manifestly incorrect.</p>
      </Section>

      <Section title="3. Prices and payment terms">
        <p>Current prices are always stated with each product, including VAT. The seller reserves the right to change prices without prior notice.</p>
        <p>Accepted payment methods:</p>
        <ul>
          <li><strong>Card online</strong> — Visa, Mastercard, Apple Pay (payment is taken immediately)</li>
          <li><strong>Bank transfer</strong> — we ship the goods once the payment reaches our account</li>
          <li><strong>Cash on delivery</strong> — payment on receipt of the parcel (39 CZK surcharge)</li>
        </ul>
      </Section>

      <Section title="4. Delivery terms">
        <p>We dispatch goods on working days. Orders received before 2pm are sent the same day.</p>
        <p>Available delivery methods:</p>
        <ul>
          <li><strong>Zásilkovna — pickup point</strong> — collection from a Z-BOX or a pickup point of your choice, {boxPrice()}</li>
          <li><strong>Zásilkovna — to your address</strong> — courier delivery within 1–2 working days, {addrPrice()}</li>
        </ul>
        {COMPANY.freeShippingOverCZK > 0 && (
          <p>Free delivery on orders over <strong>{czk(COMPANY.freeShippingOverCZK)}</strong>.</p>
        )}
        <p>On receipt of the parcel, check that the packaging is intact. Report visibly damaged parcels directly to the carrier and inform us without delay at <strong>{COMPANY.email}</strong>.</p>
      </Section>

      <Section title="5. Withdrawal from the contract">
        <p>As a consumer, you have the right to withdraw from the contract without giving a reason within <strong>14 days</strong> of receiving the goods. Beyond what the law requires, we offer an extended period of <strong>30 days</strong>.</p>
        <p>To withdraw, contact us by e-mail at <strong>{COMPANY.email}</strong>. Send the goods back to <strong>{companyField(COMPANY.warehouseAddress, "WAREHOUSE ADDRESS")}</strong> no later than 14 days after notifying us of the withdrawal. The buyer bears the cost of returning the goods.</p>
        <p>We will refund the purchase price within 14 days of receiving the returned goods, using the same payment method you used for the purchase, unless we agree otherwise.</p>
        <p>The right of withdrawal does not apply to goods customised to the buyer’s wishes or to goods liable to deteriorate rapidly.</p>
      </Section>

      <Section title="6. Complaints and rights arising from defective performance (Warranty)">
        <p>The seller is liable to the buyer for the goods being free of defects on receipt. New goods carry the statutory period for exercising rights from defective performance of <strong>24 months</strong>. For used or refurbished goods this period is <strong>12 months</strong>.</p>
        <p>If a defect appears within one year of receipt, the goods are deemed to have been defective on receipt, unless the nature of the item or the defect precludes this.</p>
        <p>In the event of a defect, the buyer has the right to have it remedied by repair or by delivery of a new item. Where this is not possible, the buyer may request a reasonable discount or withdraw from the contract.</p>
        <p>Submit a complaint by e-mail to <strong>{COMPANY.email}</strong> or in writing to the registered office. In the complaint, state your order number, a description of the defect and your preferred remedy. The detailed procedure and forms are on our <Link href="/reklamace" className="text-primary-ink hover:underline font-bold">Complaints and returns</Link> page.</p>
        <p>We will settle the complaint, including remedying the defect, without undue delay and no later than <strong>30 days</strong>. The warranty does not cover damage caused by improper use, mechanical damage or natural wear and tear.</p>
      </Section>

      <Section title="7. Out-of-court dispute resolution">
        <p>The body competent for out-of-court resolution of consumer disputes is the Czech Trade Inspection Authority, Štěpánská 567/15, 120 00 Prague 2, web: <a href="https://www.coi.cz" target="_blank" rel="noopener noreferrer">www.coi.cz</a>.</p>
        <p>Consumers may also use the online dispute resolution platform available at <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">ec.europa.eu/consumers/odr</a>.</p>
      </Section>

      <Section title="8. Final provisions">
        <p>These Terms are valid and effective from <strong>1 January 2024</strong>. The seller reserves the right to amend the Terms; the current version will always be published on these pages.</p>
        <p>Matters not governed by these Terms are subject to the law of the Czech Republic, in particular Act No. 89/2012 Coll., the Civil Code, and Act No. 634/1992 Coll., on Consumer Protection.</p>
        <p>These Terms are drawn up in the Czech language. Any foreign-language versions are an informative translation only; in the event of any discrepancy, the Czech wording prevails.</p>
      </Section>
    </>
  );
}

export const TERMS_TITLE: Record<Locale, string> = {
  cs: "Obchodní podmínky",
  sk: "Obchodné podmienky",
  en: "Terms and Conditions",
};

export const TERMS_BODY: Record<Locale, () => React.ReactElement> = {
  cs: TermsCs,
  sk: TermsSk,
  en: TermsEn,
};
