// lib/udaje.ts
// ─────────────────────────────────────────────────────────────────────────────
// JEDINÉ MÍSTO pro všechny firemní a kontaktní údaje Slingr.
//
// Cokoli změníš tady, se propíše VŠUDE — do patičky, na stránku Kontakt,
// do transakčních e-mailů i do právních textů (obchodní podmínky, ochrana
// údajů). Nikde jinde už kontakt nepiš natvrdo.
//
// Až budeš vyplňovat ostrá data, uprav jen hodnoty v objektu `UDAJE` níž.
// ─────────────────────────────────────────────────────────────────────────────

export const UDAJE = {
  // ── Firma (jen pro právní texty) ──
  name: "",              // Obchodní firma, např. "Slingr s.r.o."
  companyId: "",         // IČO
  vatId: "",             // DIČ — nech prázdné, když nejsi plátce DPH
  registration: "",      // Spisová značka, např. "Městský soud v Praze, oddíl C, vložka 12345"
  warehouseAddress: "",  // Adresa skladu pro vrácení zboží (může být jiná než sídlo)

  // ── Adresa sídla / provozovny ──
  // TODO: nahraď skutečnou adresou (tohle je zástupná).
  addressStreet: "V Jahodách 887",
  addressCity: "Praha 4",
  addressCountry: "Česká republika",

  // ── Kontakt ──
  email: "info@slingr.cz",       // TODO: potvrdit ostrou adresu
  phone: "+420 605 000 887",

  // ── Sociální sítě ──
  instagram: "https://instagram.com/slingr.cz",
  facebook: "https://facebook.com/slingr.cz",
  youtube: "https://youtube.com/@slingr",
  instagramHandle: "@slingr.cz",

  // ── Otevírací doba (zákaznická podpora) ──
  // JEDINÉ místo pro otevírací dobu — patička, homepage, Kontakt i FAQ ji berou
  // odtud. TODO: nahraď skutečnými hodinami (tohle je zástupná hodnota).
  openingHours: {
    weekdays: "9–18 h",   // Po–Pá
    saturday: "10–14 h",  // So
    sundayClosed: true,   // Ne — zavřeno
    // Jednořádkově do patičky a kartiček.
    line: "Po–Pá 9–18 h · So 10–14 h",
  },

  // ── Doprava ──
  freeShippingOverCZK: 0, // 0 = dopravu zdarma nenabízíme
} as const;

// ── Odvozené hodnoty (neupravuj ručně, počítají se z `UDAJE`) ────────────────

/** Sídlo na jeden řádek — do právních textů a patičky. */
export const adresaSidla = `${UDAJE.addressStreet}, ${UDAJE.addressCity}`;

/** Telefon připravený do `href` (bez mezer). */
export const telHref = `tel:${UDAJE.phone.replace(/\s/g, "")}`;

/** E-mail připravený do `href`. */
export const mailHref = `mailto:${UDAJE.email}`;

/**
 * Údaj do textu. Když chybí, vrátí nápadný zástupný text místo prázdna —
 * v právním dokumentu je lepší vidět "[DOPLNIT: IČO]" než větu, ze které
 * beze stopy zmizelo číslo.
 */
export function companyField(value: string, label: string): string {
  return value.trim() || `[DOPLNIT: ${label}]`;
}
