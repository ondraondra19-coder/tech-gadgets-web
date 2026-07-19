// lib/email.ts
// Transakční e-maily přes Resend. Odesílání NIKDY nesmí shodit akci, která ho
// spouští (vytvoření objednávky, změna stavu, recenze…) — proto každá veřejná
// send* funkce chyby jen zaloguje a tiše vrátí false, nikdy nevyhodí výjimku.
import { Resend, type Attachment } from "resend";
import QRCode from "qrcode";
import type { Order, OrderItem } from "./orders";
import type { Claim } from "./claims";
import { CURRENCIES, formatPrice, type Currency, type CurrencyCode } from "./currency";
import { approxConvert } from "./discounts";
import { buildSpdString, orderIdToVariableSymbol } from "./qrPlatba";
import { generatePaymentReceiptPdf } from "./pdf";

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL ?? "SLINGR <info@slingr.cz>";
const SUPPORT_EMAIL = "info@slingr.cz";
// Kam chodí interní upozornění (nová zpráva, nová reklamace). Zatím shodné se
// SUPPORT_EMAIL — až bude potřeba jiná adresa, stačí sáhnout sem.
const ADMIN_EMAIL = SUPPORT_EMAIL;
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://hackpack-web.vercel.app").replace(/\/$/, "");
// Jasný tyrkys — pozadí tlačítek (s tmavým textem) a akcenty na tmavém pozadí.
const BRAND_COLOR = "#28bfa6";
// Tmavý tyrkys — text na SVĚTLÉM pozadí (odkazy, částky). Jasný tyrkys má na
// bílé jen 2.32:1, tenhle 5.35:1.
const BRAND_INK = "#0f766e";
const DARK = "#1c1c1c";

// Escapuje hodnoty vkládané do HTML e-mailů. VŠECHNO, co pochází od zákazníka
// (jméno, adresa, text zprávy/recenze, varianty) nebo z externí služby (tracking
// číslo dopravce), musí projít přes tohle — jinak by šlo vložit do těla mailu
// vlastní HTML (rozbití layoutu, phishingový odkaz). Statické šablonové řetězce
// v kódu se neescapují, jen dosazované hodnoty.
function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

let client: Resend | null = null;

function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("❌ RESEND_API_KEY chybí — e-mail se neodešle.");
    return null;
  }
  if (!client) client = new Resend(key);
  return client;
}

// `replyTo` má výchozí hodnotu SUPPORT_EMAIL (zákazník odpovídá nám). Interní
// upozornění si ho ale přepisují na adresu zákazníka, aby šlo na zprávu nebo
// reklamaci odpovědět prostým Reply, bez kopírování adresy z těla mailu.
async function send(
  to: string,
  subject: string,
  html: string,
  attachments?: Attachment[],
  replyTo: string = SUPPORT_EMAIL,
): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) return false;

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      replyTo,
      subject,
      html,
      attachments,
    });
    if (error) {
      console.error("Resend odmítl e-mail:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Odeslání e-mailu selhalo:", err);
    return false;
  }
}

function currencyOf(code: string): Currency {
  return CURRENCIES[code as CurrencyCode] ?? CURRENCIES.CZK;
}

// ── Společná HTML kostra — inline styly, ať to dojde v pořádku i do Outlooku ──

function layout(previewText: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="cs">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f7f6f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${previewText}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f6f4;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
        <tr><td style="background:${DARK};padding:24px 32px;">
          <span style="font-size:18px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">SLIN<span style="color:${BRAND_COLOR};">GR</span></span>
        </td></tr>
        <tr><td style="padding:32px;color:#0f0f10;">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:20px 32px;background:#f7f6f4;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.6;">
            Potřebujete pomoct? Napište nám na <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND_INK};text-decoration:none;">${SUPPORT_EMAIL}</a>.<br />
            SLINGR · <a href="${SITE_URL}" style="color:#9ca3af;">${SITE_URL.replace(/^https?:\/\//, "")}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function h1(text: string): string {
  return `<h1 style="margin:0 0 12px;font-size:22px;font-weight:800;letter-spacing:-0.01em;color:#0f0f10;">${text}</h1>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#3f3f46;">${text}</p>`;
}

function itemsTable(items: OrderItem[], currency: Currency): string {
  const rows = items
    .map((item) => {
      const variants = item.variants ? Object.values(item.variants).join(" · ") : "";
      return `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #f1f1f3;font-size:13px;color:#0f0f10;">
          <strong>${esc(item.name)}</strong>${variants ? `<br /><span style="color:#9ca3af;font-size:12px;">${esc(variants)}</span>` : ""}
          <br /><span style="color:#9ca3af;font-size:12px;">${item.quantity}&nbsp;ks</span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f1f1f3;font-size:13px;color:#0f0f10;text-align:right;white-space:nowrap;">
          ${formatPrice(item.unitPrice * item.quantity, currency)}
        </td>
      </tr>`;
    })
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">${rows}</table>`;
}

function summaryRow(label: string, value: string, opts?: { bold?: boolean; color?: string }): string {
  const weight = opts?.bold ? "800" : "400";
  const color = opts?.color ?? (opts?.bold ? "#0f0f10" : "#71717a");
  return `<tr>
    <td style="padding:4px 0;font-size:${opts?.bold ? "14" : "13"}px;font-weight:${weight};color:${color};">${label}</td>
    <td style="padding:4px 0;font-size:${opts?.bold ? "14" : "13"}px;font-weight:${weight};color:${color};text-align:right;">${value}</td>
  </tr>`;
}

function priceSummary(order: Order): string {
  const currency = currencyOf(order.currency);
  const rows: string[] = [summaryRow("Mezisoučet", formatPrice(order.subtotal, currency))];

  if (order.discountCode && order.discountAmountCZK) {
    const discountInCurrency =
      currency.code === "CZK" ? order.discountAmountCZK : approxConvert(order.discountAmountCZK, currency.code);
    rows.push(
      summaryRow(`Sleva (${esc(order.discountLabel ?? order.discountCode)})`, `−${formatPrice(discountInCurrency, currency)}`, {
        color: "#16a34a",
      }),
    );
  }

  rows.push(summaryRow(`Doprava${order.shippingName ? ` (${esc(order.shippingName)})` : ""}`, order.shippingPrice > 0 ? formatPrice(order.shippingPrice, currency) : "Zdarma"));

  if (order.dobirkaFee) {
    rows.push(summaryRow("Dobírka", formatPrice(order.dobirkaFee, currency)));
  }

  rows.push(summaryRow("Celkem", formatPrice(order.total, currency), { bold: true }));

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-top:1px solid #f1f1f3;padding-top:10px;">${rows.join("")}</table>`;
}

function addressBlock(order: Order): string {
  const addr = order.deliveryAddress ?? order.address;
  if (!addr) return "";
  return `<p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#3f3f46;">
    <strong style="color:#0f0f10;">${esc(order.customer.jmeno)}</strong><br />
    ${esc(addr.uliceCp)}<br />
    ${[addr.psc, addr.mesto].filter(Boolean).map(esc).join(" ")}${addr.zeme && addr.zeme !== "Česká republika" ? `<br />${esc(addr.zeme)}` : ""}
  </p>`;
}

function orderNumber(order: Order): string {
  return orderIdToVariableSymbol(order.id);
}

// Identifikace prodejce (jméno/firma, IČO, sídlo) — dokud není vyplněné
// aspoň jméno (NEXT_PUBLIC_SELLER_NAME), blok se vůbec nezobrazí. Chybějící
// IČO NEVYMÝŠLÍME — místo čísla se ukáže poctivě označený placeholder
// "v procesu registrace", ne fiktivní (ale reálně vypadající) číslo, které
// by zákazník mohl brát jako skutečný firemní údaj. Neplátce DPH je teď
// natvrdo — až bude prodejce plátcem DPH, bude potřeba i DIČ a rozpis DPH
// u položek/souhrnu, to je oprava kódu, ne jen doplnění proměnné.
function sellerBlock(): string {
  const name = process.env.NEXT_PUBLIC_SELLER_NAME;
  if (!name) return "";
  const ico = process.env.NEXT_PUBLIC_SELLER_ICO;
  const address = process.env.NEXT_PUBLIC_SELLER_ADDRESS;
  return `
    <div style="background:#f7f6f4;border-radius:12px;padding:16px 20px;margin:0 0 20px;">
      <p style="margin:0 0 10px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;">Prodejce</p>
      <p style="margin:0;font-size:13px;line-height:1.6;color:#3f3f46;">
        <strong style="color:#0f0f10;">${esc(name)}</strong><br />
        ${address ? `${address}<br />` : ""}
        IČO: ${ico ?? "v procesu registrace"}<br />
        Neplátce DPH
      </p>
    </div>`;
}

// ── Marketingová kampaň (newsletter) ────────────────────────────────────────
// Tělo píše admin jako prostý text (viz CampaignsPanel). Převedeme ho na HTML
// odstavce a VŠECHNO escapujeme přes esc() — do těla se nesmí dostat žádné
// vlastní HTML, i když ho admin do textu napíše. Prázdný řádek = nový odstavec,
// jednoduchý zlom řádku = <br />.
function campaignBodyToHtml(body: string): string {
  return body
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para) => p(esc(para).replace(/\n/g, "<br />")))
    .join("");
}

export function renderCampaignEmail(params: {
  subject: string;
  previewText?: string;
  body: string;
}): { subject: string; html: string } {
  const { subject, previewText, body } = params;
  const html = layout(
    previewText?.trim() || subject,
    `
    ${h1(esc(subject))}
    ${campaignBodyToHtml(body)}
    `,
  );
  return { subject, html };
}

// ── 1) Potvrzení objednávky ─────────────────────────────────────────────────

async function bankTransferBlock(order: Order): Promise<{ html: string; attachment?: Attachment }> {
  const account = process.env.NEXT_PUBLIC_BANK_ACCOUNT_DISPLAY;
  const bankName = process.env.NEXT_PUBLIC_BANK_NAME;
  if (!account) {
    return { html: p(`Ozvěte se nám prosím na ${SUPPORT_EMAIL}, domluvíme platbu individuálně.`) };
  }
  const vs = orderNumber(order);
  const currency = currencyOf(order.currency);

  // QR Platba jen pro CZK/EUR (stejná podmínka jako na /objednavka/uspech —
  // bankovní převod se pro USD vůbec nenabízí, viz /objednavka).
  //
  // Obrázek jde jako BĚŽNÁ (ne-inline) příloha, ne vložený <img> v těle
  // e-mailu — vyzkoušeny byly obě obvyklé cesty (hostovaná URL i CID inline
  // příloha přes attachments[].contentId) a obě v Resendu (aspoň v sandbox
  // režimu s onboarding@resend.dev) reálně nedorazily: u CID přílohy dorazí
  // e-mail se správnou Content-ID hlavičkou, ale s PRÁZDNÝM tělem přílohy
  // (ověřeno přes "Zobrazit originál" ve třech nezávislých pokusech, různé
  // cesty odeslání — SDK i syrové REST API). Obyčejná (stažitelná) příloha
  // stejná data ale doručí v pořádku — proto ji používáme, i když to
  // znamená jeden klik navíc pro zákazníka místo QR přímo v textu mailu.
  const iban = process.env.NEXT_PUBLIC_BANK_ACCOUNT_IBAN;
  const showQr = Boolean(iban) && (order.currency === "CZK" || order.currency === "EUR");

  let attachment: Attachment | undefined;
  let qrBlock = "";
  if (showQr && iban) {
    const spd = buildSpdString({ iban, amount: order.total, currency: order.currency, variableSymbol: vs, message: "Dekujeme za objednavku" });
    const png = await QRCode.toBuffer(spd, { width: 320, margin: 1 });
    attachment = { content: png.toString("base64"), filename: "qr-platba.png", contentType: "image/png" };
    qrBlock = `
      <div style="text-align:center;margin-top:16px;padding-top:16px;border-top:1px solid #e5e7eb;">
        <p style="margin:0;font-size:12px;color:#71717a;">📎 QR kód pro rychlou platbu najdete v příloze tohoto e-mailu (<span style="white-space:nowrap;">qr-platba.png</span>).</p>
      </div>`;
  }

  const html = `
    <div style="background:#f7f6f4;border-radius:12px;padding:16px 20px;margin:0 0 20px;">
      <p style="margin:0 0 10px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;">Platební instrukce</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${summaryRow("Číslo účtu", `${account}${bankName ? ` (${bankName})` : ""}`, { bold: true })}
        ${summaryRow("Variabilní symbol", vs, { bold: true })}
        ${summaryRow("Částka", formatPrice(order.total, currency), { bold: true, color: BRAND_INK })}
      </table>
      ${qrBlock}
    </div>
    ${p("Zásilku odešleme ihned po připsání platby na účet — obvykle do 1 pracovního dne.")}
  `;

  return { html, attachment };
}

export async function renderOrderConfirmationEmail(
  order: Order,
): Promise<{ subject: string; html: string; attachments?: Attachment[] }> {
  const currency = currencyOf(order.currency);
  const vs = orderNumber(order);

  let paymentBlock: string;
  let attachments: Attachment[] | undefined;

  if (order.paymentMethod === "prevod") {
    const bankBlock = await bankTransferBlock(order);
    paymentBlock = bankBlock.html;
    if (bankBlock.attachment) attachments = [bankBlock.attachment];
  } else if (order.paymentMethod === "dobirka") {
    paymentBlock = p(`Zaplatíte při doručení: <strong>${formatPrice(order.total, currency)}</strong>.`);
  } else {
    paymentBlock = p("Platba kartou proběhla v pořádku, děkujeme.");
  }

  const html = layout(
    `Objednávka ${vs} přijata`,
    `
    ${h1("Děkujeme za objednávku!")}
    ${p(`Ahoj ${esc(order.customer.jmeno)}, potvrzujeme, že jsme objednávku <strong>#${vs}</strong> přijali a začínáme ji připravovat.`)}
    ${paymentBlock}
    <p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;">Položky objednávky</p>
    ${itemsTable(order.items, currency)}
    ${priceSummary(order)}
    <p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;">Doručovací adresa</p>
    ${addressBlock(order)}
    `,
  );

  return { subject: `Objednávka #${vs} přijata — SLINGR`, html, attachments };
}

export async function sendOrderConfirmationEmail(order: Order): Promise<boolean> {
  if (!order.customer.email) return false;
  const { subject, html, attachments } = await renderOrderConfirmationEmail(order);
  return send(order.customer.email, subject, html, attachments);
}

// ── 1b) Přijetí platby (admin ručně označí bankovní převod jako zaplacený) ──
// Na rozdíl od potvrzovací objednávky (ta jde vždy, hned) tenhle e-mail se
// posílá jen při přechodu paymentStatus → "zaplaceno" — viz
// app/api/admin/orders/[id]/route.ts, kde se to hlídá stejně jako u
// odeslané/doručené objednávky (jen na SKUTEČNÝ přechod stavu).

export function renderPaymentReceivedEmail(order: Order): { subject: string; html: string } {
  const currency = currencyOf(order.currency);
  const vs = orderNumber(order);

  const html = layout(
    `Platba za objednávku ${vs} přijata`,
    `
    ${h1("Platbu jsme přijali")}
    ${p(`Ahoj ${esc(order.customer.jmeno)}, potvrzujeme, že platba za objednávku <strong>#${vs}</strong> ve výši <strong>${formatPrice(order.total, currency)}</strong> nám přišla na účet. Teď ji zabalíme a pošleme.`)}
    ${p(`Přehled objednávky v příloze najdeš i jako PDF ke stažení.`)}
    ${sellerBlock()}
    <p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;">Přehled objednávky</p>
    ${itemsTable(order.items, currency)}
    ${priceSummary(order)}
    <p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;">Doručovací adresa</p>
    ${addressBlock(order)}
    `,
  );
  return { subject: `Platba za objednávku #${vs} přijata — SLINGR`, html };
}

export async function sendPaymentReceivedEmail(order: Order): Promise<boolean> {
  if (!order.customer.email) return false;
  const { subject, html } = renderPaymentReceivedEmail(order);

  // PDF se generuje jako běžná (ne-inline) příloha — stejně jako QR platba,
  // CID inline přílohy Resend v sandboxu spolehlivě nedoručí (viz git historie).
  let attachments: Attachment[] | undefined;
  try {
    const pdf = await generatePaymentReceiptPdf(order);
    attachments = [{ content: pdf.toString("base64"), filename: `objednavka-${orderNumber(order)}.pdf`, contentType: "application/pdf" }];
  } catch (err) {
    console.error("Generování PDF přehledu objednávky selhalo:", err);
  }

  return send(order.customer.email, subject, html, attachments);
}

// ── 2) Odeslání zásilky ──────────────────────────────────────────────────────

function trackingBlock(order: Order): string {
  if (!order.shipment) {
    return p("Zásilka je na cestě k vám. Jakmile bude k dispozici sledovací číslo, ozveme se znovu.");
  }
  const trackingUrl = `https://tracking.packeta.com/cs_CZ/?id=${encodeURIComponent(order.shipment.trackingNumber)}`;
  return `
    <div style="background:#f7f6f4;border-radius:12px;padding:16px 20px;margin:0 0 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${summaryRow("Sledovací číslo", esc(order.shipment.trackingNumber), { bold: true })}
      </table>
    </div>
    <p style="margin:0 0 20px;">
      <a href="${trackingUrl}" style="display:inline-block;background:${BRAND_COLOR};color:${DARK};font-weight:800;font-size:13px;padding:12px 20px;border-radius:10px;text-decoration:none;">Sledovat zásilku</a>
    </p>
  `;
}

export function renderOrderShippedEmail(order: Order): { subject: string; html: string } {
  const vs = orderNumber(order);
  const html = layout(
    `Objednávka ${vs} je na cestě`,
    `
    ${h1("Vaše objednávka je na cestě! 📦")}
    ${p(`Ahoj ${esc(order.customer.jmeno)}, objednávku <strong>#${vs}</strong> jsme právě předali dopravci.`)}
    ${trackingBlock(order)}
    <p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;">Doručovací adresa</p>
    ${addressBlock(order)}
    `,
  );
  return { subject: `Objednávka #${vs} je na cestě — SLINGR`, html };
}

export async function sendOrderShippedEmail(order: Order): Promise<boolean> {
  if (!order.customer.email) return false;
  const { subject, html } = renderOrderShippedEmail(order);
  return send(order.customer.email, subject, html);
}

// ── 3) Doručení objednávky ───────────────────────────────────────────────────

export function renderOrderDeliveredEmail(order: Order): { subject: string; html: string } {
  const vs = orderNumber(order);
  const html = layout(
    `Objednávka ${vs} doručena`,
    `
    ${h1("Objednávka doručena ✅")}
    ${p(`Ahoj ${esc(order.customer.jmeno)}, objednávka <strong>#${vs}</strong> byla doručena. Doufáme, že máš z nákupu radost!`)}
    ${p("Budeme moc rádi, když nám necháš pár slov zpětné vazby — pomáhá nám to i dalším zákazníkům.")}
    <p style="margin:0 0 8px;">
      <a href="${SITE_URL}/napsat-recenzi" style="display:inline-block;background:${BRAND_COLOR};color:${DARK};font-weight:800;font-size:13px;padding:12px 20px;border-radius:10px;text-decoration:none;">Napsat recenzi</a>
    </p>
    `,
  );
  return { subject: `Objednávka #${vs} doručena — SLINGR`, html };
}

export async function sendOrderDeliveredEmail(order: Order): Promise<boolean> {
  if (!order.customer.email) return false;
  const { subject, html } = renderOrderDeliveredEmail(order);
  return send(order.customer.email, subject, html);
}

// ── 4) Poděkování za recenzi ─────────────────────────────────────────────────

export function renderReviewThankYouEmail(name: string): { subject: string; html: string } {
  const html = layout(
    "Díky za recenzi",
    `
    ${h1("Díky za tvůj čas! 🙏")}
    ${p(`Ahoj ${esc(name)}, díky, že sis udělal/a čas napsat recenzi. Vážíme si toho a moc nám to pomáhá.`)}
    `,
  );
  return { subject: "Díky za recenzi — SLINGR", html };
}

export async function sendReviewThankYouEmail(to: string, name: string): Promise<boolean> {
  const { subject, html } = renderReviewThankYouEmail(name);
  return send(to, subject, html);
}

// ── 5) Zboží je zase skladem ────────────────────────────────────────────────
// Posílá se automaticky z lib/stock.ts při přechodu skladu 0 → N, adresátem je
// ten, kdo vyplnil "Připomenout, až bude skladem" (viz lib/stockWatch.ts).

export function renderBackInStockEmail(params: { productName: string; slug: string }): {
  subject: string;
  html: string;
} {
  const { productName, slug } = params;
  const url = `${SITE_URL}/produkt/${encodeURIComponent(slug)}`;

  const html = layout(
    `${productName} je zpátky skladem`,
    `
    ${h1("Zboží je zase skladem! 🎉")}
    ${p(`Ahoj, <strong>${esc(productName)}</strong> je zpátky skladem — přesně jak sis přál/a, dáváme vědět.`)}
    ${p("Kusů bývá po naskladnění omezeně, tak si ho radši zajisti hned.")}
    <p style="margin:0 0 20px;">
      <a href="${url}" style="display:inline-block;background:${BRAND_COLOR};color:${DARK};font-weight:800;font-size:13px;padding:12px 20px;border-radius:10px;text-decoration:none;">Zobrazit produkt</a>
    </p>
    <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.6;">
      Tenhle e-mail ti přišel jednorázově, protože sis u tohohle produktu vyžádal/a hlídání skladu. Nikam tě nepřihlašujeme a víc už ti kvůli němu nenapíšeme.
    </p>
    `,
  );
  return { subject: `${productName} je zpátky skladem — SLINGR`, html };
}

export async function sendBackInStockEmail(params: {
  to: string;
  productName: string;
  slug: string;
}): Promise<boolean> {
  const { to, ...rest } = params;
  const { subject, html } = renderBackInStockEmail(rest);
  return send(to, subject, html);
}

// ── 5b) Reklamace / vrácení / výměna ────────────────────────────────────────
// Potvrzení zákazníkovi slouží i jako doklad, že žádost dorazila — proto v něm
// musí být číslo případu a shrnutí toho, co vyplnil.

const CLAIM_TYPE_LABELS: Record<string, string> = {
  reklamace: "Reklamace (vada zboží)",
  vraceni: "Vrácení do 14 dnů",
  vymena: "Výměna",
};

const CLAIM_RESOLUTION_LABELS: Record<string, string> = {
  oprava: "Oprava",
  penize: "Vrácení peněz",
  sleva: "Sleva z ceny",
};

function claimLabel(map: Record<string, string>, value: string): string {
  return map[value] ?? value;
}

function claimDetailsTable(claim: Claim): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
    ${summaryRow("Číslo případu", esc(claim.ticket), { bold: true, color: BRAND_INK })}
    ${summaryRow("Číslo objednávky", esc(claim.cisloObjednavky))}
    ${summaryRow("Typ žádosti", esc(claimLabel(CLAIM_TYPE_LABELS, claim.typZadosti)))}
    ${summaryRow("Způsob vyřízení", esc(claimLabel(CLAIM_RESOLUTION_LABELS, claim.zpusobVyrizeni)))}
  </table>`;
}

export function renderClaimConfirmationEmail(claim: Claim): { subject: string; html: string } {
  const html = layout(
    `Žádost ${claim.ticket} přijata`,
    `
    ${h1("Žádost jsme přijali")}
    ${p(`Ahoj ${esc(claim.jmeno)}, potvrzujeme, že tvoje žádost dorazila. Číslo případu si prosím uschovej — budeme se na něj odkazovat.`)}
    ${claimDetailsTable(claim)}
    <p style="margin:0 0 6px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;">Popis</p>
    <div style="background:#f7f6f4;border-radius:12px;padding:14px 18px;margin:0 0 20px;font-size:13px;line-height:1.6;color:#3f3f46;white-space:pre-wrap;">${esc(claim.popis)}</div>
    ${p("Ozveme se ti nejpozději do 30 dnů, obvykle ale mnohem dřív. Pokud budeme potřebovat doplnit informace, napíšeme na tenhle e-mail.")}
    ${sellerBlock()}
    `,
  );
  return { subject: `Žádost ${claim.ticket} přijata — SLINGR`, html };
}

export async function sendClaimConfirmationEmail(claim: Claim): Promise<boolean> {
  const { subject, html } = renderClaimConfirmationEmail(claim);
  return send(claim.email, subject, html);
}

export function renderClaimAdminEmail(claim: Claim): { subject: string; html: string } {
  const html = layout(
    `Nová žádost ${claim.ticket}`,
    `
    ${h1("Nová reklamace / vrácení")}
    ${claimDetailsTable(claim)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
      ${summaryRow("Jméno", esc(claim.jmeno), { bold: true })}
      ${summaryRow("E-mail", esc(claim.email))}
      ${summaryRow("Telefon", esc(claim.telefon))}
    </table>
    <p style="margin:0 0 6px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;">Popis</p>
    <div style="background:#f7f6f4;border-radius:12px;padding:14px 18px;margin:0 0 20px;font-size:13px;line-height:1.6;color:#3f3f46;white-space:pre-wrap;">${esc(claim.popis)}</div>
    ${p("Odpovědět jde přímo odpovědí na tenhle e-mail.")}
    `,
  );
  return { subject: `Nová žádost ${claim.ticket} od ${claim.jmeno} — SLINGR`, html };
}

export async function sendClaimAdminEmail(claim: Claim): Promise<boolean> {
  const { subject, html } = renderClaimAdminEmail(claim);
  return send(ADMIN_EMAIL, subject, html, undefined, claim.email);
}

// ── 6) Interní upozornění: přišla nová zpráva ───────────────────────────────
// Nejde zákazníkovi, ale nám na ADMIN_EMAIL. replyTo = adresa zákazníka, takže
// se dá odpovědět rovnou z mailu.

export function renderNewMessageAdminEmail(params: {
  name: string;
  email: string;
  text: string;
  source?: string;
}): { subject: string; html: string } {
  const { name, email, text, source } = params;
  const origin = source === "kontakt" ? "formulář /kontakt" : "chat widget";

  const html = layout(
    `Nová zpráva od ${name}`,
    `
    ${h1("Nová zpráva")}
    ${p(`Přišla přes <strong>${esc(origin)}</strong>.`)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
      ${summaryRow("Jméno", esc(name), { bold: true })}
      ${summaryRow("E-mail", esc(email), { bold: true })}
    </table>
    <p style="margin:0 0 6px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;">Text zprávy</p>
    <div style="background:#f7f6f4;border-radius:12px;padding:14px 18px;margin:0 0 20px;font-size:13px;line-height:1.6;color:#3f3f46;white-space:pre-wrap;">${esc(text)}</div>
    ${p(`Odpovědět jde přímo odpovědí na tenhle e-mail, nebo v <a href="${SITE_URL}/admin" style="color:${BRAND_INK};text-decoration:none;">adminu</a>.`)}
    `,
  );
  return { subject: `Nová zpráva od ${name} — SLINGR`, html };
}

export async function sendNewMessageAdminEmail(params: {
  name: string;
  email: string;
  text: string;
  source?: string;
}): Promise<boolean> {
  const { subject, html } = renderNewMessageAdminEmail(params);
  return send(ADMIN_EMAIL, subject, html, undefined, params.email);
}

// ── 7) Odpověď adminu na zprávu ze chat widgetu ─────────────────────────────

export function renderMessageReplyEmail(params: { name: string; originalText: string; replyText: string }): {
  subject: string;
  html: string;
} {
  const { name, originalText, replyText } = params;
  const html = layout(
    "Odpověď na vaši zprávu",
    `
    ${h1("Odpověď na vaši zprávu")}
    ${p(`Ahoj ${esc(name)}, reagujeme na tvou zprávu z webu SLINGR:`)}
    <div style="background:#f7f6f4;border-radius:12px;padding:14px 18px;margin:0 0 20px;font-size:13px;line-height:1.6;color:#3f3f46;white-space:pre-wrap;">${esc(replyText)}</div>
    <p style="margin:0 0 6px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;">Tvá původní zpráva</p>
    <div style="border-left:2px solid #e5e7eb;padding-left:14px;margin:0 0 8px;font-size:12px;line-height:1.6;color:#9ca3af;white-space:pre-wrap;">${esc(originalText)}</div>
    `,
  );
  return { subject: "Odpověď na vaši zprávu — SLINGR", html };
}

export async function sendMessageReplyEmail(params: {
  to: string;
  name: string;
  originalText: string;
  replyText: string;
}): Promise<boolean> {
  const { to, ...rest } = params;
  const { subject, html } = renderMessageReplyEmail(rest);
  return send(to, subject, html);
}
