// lib/companyInfo.ts
// Identifikační údaje prodávajícího na jednom místě.
//
// PROČ: obchodní podmínky, reklamační řád a zásady ochrany údajů je uváděly
// jako zástupné texty ([NÁZEV FIRMY], [IČO], …) přímo v textu stránky. Po
// překladu do tří jazyků by každý údaj existoval třikrát a vyplnit by se
// musel na deseti místech — s jistotou, že jedno se zapomene.
//
// AŽ TO BUDEŠ VYPLŇOVAT: stačí sem. Prázdná hodnota se v textu vykreslí jako
// nápadný zástupný text (viz `placeholder()` níž), takže nevyplněný údaj je
// na stránce vidět a nepropadne tiše jako prázdné místo.
//
// Údaje jsou stejné pro všechny jazyky — název firmy, IČO ani adresa sídla
// se nepřekládají.

export type CompanyInfo = {
  /** Obchodní firma, např. "SLINGR s.r.o." */
  name: string;
  /** IČO */
  companyId: string;
  /** DIČ — nepovinné, když firma není plátce DPH */
  vatId: string;
  /** Sídlo — ulice, č.p., PSČ, město */
  address: string;
  /** Spisová značka, např. "Městským soudem v Praze, oddíl C, vložka 12345" */
  registration: string;
  /** Adresa skladu pro vrácené zboží — může být jiná než sídlo */
  warehouseAddress: string;
  email: string;
  phone: string;
  /** Hranice pro dopravu zdarma v Kč; 0 = dopravu zdarma nenabízíme */
  freeShippingOverCZK: number;
};

export const COMPANY: CompanyInfo = {
  name: "",
  companyId: "",
  vatId: "",
  address: "",
  registration: "",
  warehouseAddress: "",
  email: "info@dodelat.cz",
  phone: "+420 737 565 577",
  freeShippingOverCZK: 0,
};

/**
 * Údaj do textu. Když chybí, vrátí nápadný zástupný text místo prázdna —
 * v právním dokumentu je lepší vidět "[DOPLNIT: IČO]" než větu, ze které
 * beze stopy zmizelo číslo.
 */
export function companyField(value: string, label: string): string {
  return value.trim() || `[DOPLNIT: ${label}]`;
}
