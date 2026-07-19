// lib/pdf.ts
// Generuje PDF "Přehled objednávky" přiložené k e-mailu o přijaté platbě
// (lib/email.ts, sendPaymentReceivedEmail) — NENÍ to formální daňový doklad,
// viz stejná poznámka u sellerBlock() v lib/email.ts.
//
// Font: vestavěné PDF fonty (Helvetica apod.) neumí českou diakritiku
// (ř/č/ě/š/ž/ů nejsou v jejich WinAnsi kódování), proto se vkládá vlastní
// TrueType font — Noto Sans (SIL Open Font License, viz assets/fonts/OFL.txt).
import PDFDocument from "pdfkit";
import path from "path";
import type { Order } from "./orders";
import { CURRENCIES, formatPrice, type Currency, type CurrencyCode } from "./currency";
import { approxConvert } from "./discounts";
import { orderIdToVariableSymbol } from "./qrPlatba";

const FONT_PATH = path.join(process.cwd(), "assets/fonts/NotoSans-Regular.ttf");
// Tmavý tyrkys — používá se jako barva textu (řádek "Celkem") na bílém papíře,
// takže musí být čitelný: 5.35:1 na bílé (jasný značkový tyrkys #28bfa6 by měl 2.32:1).
const BRAND_COLOR = "#0f766e";
const DARK = "#0f0f10";
const MUTED = "#3f3f46";
const SUBTLE = "#9ca3af";
const PAGE_WIDTH = 595.28; // A4 v bodech (72 dpi)
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function currencyOf(code: string): Currency {
  return CURRENCIES[code as CurrencyCode] ?? CURRENCIES.CZK;
}

// Řádek se dvěma sloupci (popisek vlevo, hodnota zarovnaná vpravo) — pro
// souhrn cen. Kreslí přímo na aktuální pozici kurzoru dokumentu.
function summaryLine(doc: PDFKit.PDFDocument, label: string, value: string, opts?: { bold?: boolean; color?: string }) {
  const y = doc.y;
  const color = opts?.color ?? (opts?.bold ? DARK : MUTED);
  doc.fontSize(opts?.bold ? 11 : 10).fillColor(color);
  doc.text(label, MARGIN, y, { continued: false });
  doc.text(value, MARGIN, y, { width: CONTENT_WIDTH, align: "right" });
  doc.moveDown(0.3);
}

function sectionLabel(doc: PDFKit.PDFDocument, text: string) {
  doc.moveDown(0.6);
  doc.fontSize(9).fillColor(SUBTLE).text(text.toUpperCase(), MARGIN, doc.y);
  doc.moveDown(0.3);
}

export async function generatePaymentReceiptPdf(order: Order): Promise<Buffer> {
  const currency = currencyOf(order.currency);
  const vs = orderIdToVariableSymbol(order.id);
  const sellerName = process.env.NEXT_PUBLIC_SELLER_NAME;
  const sellerIco = process.env.NEXT_PUBLIC_SELLER_ICO;
  const sellerAddress = process.env.NEXT_PUBLIC_SELLER_ADDRESS;

  const doc = new PDFDocument({ size: "A4", margin: MARGIN });
  doc.registerFont("NotoSans", FONT_PATH);
  doc.font("NotoSans");

  const chunks: Buffer[] = [];
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  // ── Hlavička ──────────────────────────────────────────────────────────
  doc.fontSize(20).fillColor(DARK).text("SLINGR", MARGIN, MARGIN);
  doc.fontSize(10).fillColor(SUBTLE).text(`Objednávka #${vs}`, MARGIN, MARGIN + 26);
  doc
    .fontSize(10)
    .fillColor(SUBTLE)
    .text(new Date(order.createdAt).toLocaleDateString("cs-CZ"), MARGIN, MARGIN + 26, { width: CONTENT_WIDTH, align: "right" });

  doc.moveTo(MARGIN, MARGIN + 50).lineTo(PAGE_WIDTH - MARGIN, MARGIN + 50).strokeColor("#e5e7eb").stroke();

  doc.y = MARGIN + 66;
  doc.fontSize(15).fillColor(DARK).text("Přehled objednávky", MARGIN, doc.y);
  doc.moveDown(0.6);

  // ── Prodejce (jen pokud je vyplněné jméno — žádné vymyšlené IČO) ────────
  if (sellerName) {
    sectionLabel(doc, "Prodejce");
    doc.fontSize(10).fillColor(MUTED);
    doc.text(sellerName, MARGIN, doc.y);
    if (sellerAddress) doc.text(sellerAddress, MARGIN, doc.y);
    doc.text(`IČO: ${sellerIco ?? "v procesu registrace"}`, MARGIN, doc.y);
    doc.text("Neplátce DPH", MARGIN, doc.y);
  }

  // ── Zákazník / doručovací adresa ────────────────────────────────────────
  const addr = order.deliveryAddress ?? order.address;
  sectionLabel(doc, "Doručovací adresa");
  doc.fontSize(10).fillColor(MUTED);
  doc.text(order.customer.jmeno, MARGIN, doc.y);
  if (addr) {
    doc.text(addr.uliceCp, MARGIN, doc.y);
    doc.text([addr.psc, addr.mesto].filter(Boolean).join(" "), MARGIN, doc.y);
  }

  // ── Položky ──────────────────────────────────────────────────────────
  sectionLabel(doc, "Položky");
  const colQty = MARGIN + 300;
  const colPrice = MARGIN + 370;
  doc.fontSize(9).fillColor(SUBTLE);
  doc.text("Název", MARGIN, doc.y, { continued: false });
  doc.text("Ks", colQty, doc.y - doc.currentLineHeight(), { width: 40, align: "right" });
  doc.text("Cena", colPrice, doc.y - doc.currentLineHeight(), { width: CONTENT_WIDTH - (colPrice - MARGIN), align: "right" });
  doc.moveDown(0.4);
  doc.moveTo(MARGIN, doc.y).lineTo(PAGE_WIDTH - MARGIN, doc.y).strokeColor("#f1f1f3").stroke();
  doc.moveDown(0.4);

  for (const item of order.items) {
    const rowY = doc.y;
    const variants = item.variants ? Object.values(item.variants).join(" · ") : "";

    // Levý sloupec (název + volitelně varianta) určuje výšku celého řádku —
    // dopočítá se AŽ PO něm, protože qty/cena kreslené na pevné rowY by jinak
    // (tím, že taky posouvají kurzor doc.y) tenhle spodní okraj přepsaly zpátky
    // nahoru a další řádek by se pak kreslil moc brzo (přes variantu).
    doc.fontSize(10).fillColor(DARK).text(item.name, MARGIN, rowY, { width: colQty - MARGIN - 10 });
    if (variants) doc.fontSize(8).fillColor(SUBTLE).text(variants, MARGIN, doc.y);
    const bottomY = doc.y;

    doc.fontSize(10).fillColor(MUTED).text(String(item.quantity), colQty, rowY, { width: 40, align: "right" });
    doc.fontSize(10).fillColor(DARK).text(
      formatPrice(item.unitPrice * item.quantity, currency),
      colPrice,
      rowY,
      { width: CONTENT_WIDTH - (colPrice - MARGIN), align: "right" },
    );

    doc.y = bottomY + 6;
  }

  doc.moveDown(0.2);
  doc.moveTo(MARGIN, doc.y).lineTo(PAGE_WIDTH - MARGIN, doc.y).strokeColor("#f1f1f3").stroke();
  doc.moveDown(0.5);

  // ── Souhrn ───────────────────────────────────────────────────────────
  summaryLine(doc, "Mezisoučet", formatPrice(order.subtotal, currency));

  if (order.discountCode && order.discountAmountCZK) {
    const discountInCurrency =
      currency.code === "CZK" ? order.discountAmountCZK : approxConvert(order.discountAmountCZK, currency.code);
    summaryLine(doc, `Sleva (${order.discountLabel ?? order.discountCode})`, `−${formatPrice(discountInCurrency, currency)}`, { color: "#16a34a" });
  }

  summaryLine(
    doc,
    `Doprava${order.shippingName ? ` (${order.shippingName})` : ""}`,
    order.shippingPrice > 0 ? formatPrice(order.shippingPrice, currency) : "Zdarma",
  );

  if (order.dobirkaFee) {
    summaryLine(doc, "Dobírka", formatPrice(order.dobirkaFee, currency));
  }

  doc.moveDown(0.2);
  doc.moveTo(MARGIN, doc.y).lineTo(PAGE_WIDTH - MARGIN, doc.y).strokeColor("#f1f1f3").stroke();
  doc.moveDown(0.4);
  summaryLine(doc, "Celkem", formatPrice(order.total, currency), { bold: true, color: BRAND_COLOR });

  // ── Patička ──────────────────────────────────────────────────────────
  doc
    .fontSize(8)
    .fillColor(SUBTLE)
    .text("Potřebujete pomoct? Napište nám na info@slingr.cz.", MARGIN, 780, { width: CONTENT_WIDTH, align: "center" });

  doc.end();
  return done;
}
