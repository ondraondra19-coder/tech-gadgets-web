// lib/email.ts
// Transakční e-maily přes Resend. Odesílání NIKDY nesmí shodit akci, která ho
// spouští (vytvoření objednávky, změna stavu, recenze…) — proto každá veřejná
// send* funkce chyby jen zaloguje a tiše vrátí false, nikdy nevyhodí výjimku.
import { Resend, type Attachment } from "resend";
import QRCode from "qrcode";
import type { Order, OrderItem } from "./orders";
import { CURRENCIES, formatPrice, type Currency, type CurrencyCode } from "./currency";
import { approxConvert } from "./discounts";
import { buildSpdString, orderIdToVariableSymbol } from "./qrPlatba";

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL ?? "HackPack <info@hackpack.cz>";
const SUPPORT_EMAIL = "info@hackpack.cz";
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://hackpack-web.vercel.app").replace(/\/$/, "");
const BRAND_COLOR = "#ff8ad0";
const DARK = "#1c1c1c";

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

async function send(to: string, subject: string, html: string, attachments?: Attachment[]): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) return false;

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      replyTo: SUPPORT_EMAIL,
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
          <span style="font-size:18px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">Hack<span style="color:${BRAND_COLOR};">Pack</span></span>
        </td></tr>
        <tr><td style="padding:32px;color:#0f0f10;">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:20px 32px;background:#f7f6f4;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.6;">
            Potřebujete pomoct? Napište nám na <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND_COLOR};text-decoration:none;">${SUPPORT_EMAIL}</a>.<br />
            HackPack · <a href="${SITE_URL}" style="color:#9ca3af;">${SITE_URL.replace(/^https?:\/\//, "")}</a>
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
          <strong>${item.name}</strong>${variants ? `<br /><span style="color:#9ca3af;font-size:12px;">${variants}</span>` : ""}
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
      summaryRow(`Sleva (${order.discountLabel ?? order.discountCode})`, `−${formatPrice(discountInCurrency, currency)}`, {
        color: "#16a34a",
      }),
    );
  }

  rows.push(summaryRow(`Doprava${order.shippingName ? ` (${order.shippingName})` : ""}`, order.shippingPrice > 0 ? formatPrice(order.shippingPrice, currency) : "Zdarma"));

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
    <strong style="color:#0f0f10;">${order.customer.jmeno}</strong><br />
    ${addr.uliceCp}<br />
    ${[addr.psc, addr.mesto].filter(Boolean).join(" ")}${addr.zeme && addr.zeme !== "Česká republika" ? `<br />${addr.zeme}` : ""}
  </p>`;
}

function orderNumber(order: Order): string {
  return orderIdToVariableSymbol(order.id);
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
        ${summaryRow("Částka", formatPrice(order.total, currency), { bold: true, color: BRAND_COLOR })}
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
    ${p(`Ahoj ${order.customer.jmeno}, potvrzujeme, že jsme objednávku <strong>#${vs}</strong> přijali a začínáme ji připravovat.`)}
    ${paymentBlock}
    <p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;">Položky objednávky</p>
    ${itemsTable(order.items, currency)}
    ${priceSummary(order)}
    <p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;">Doručovací adresa</p>
    ${addressBlock(order)}
    `,
  );

  return { subject: `Objednávka #${vs} přijata — HackPack`, html, attachments };
}

export async function sendOrderConfirmationEmail(order: Order): Promise<boolean> {
  if (!order.customer.email) return false;
  const { subject, html, attachments } = await renderOrderConfirmationEmail(order);
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
        ${summaryRow("Sledovací číslo", order.shipment.trackingNumber, { bold: true })}
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
    ${p(`Ahoj ${order.customer.jmeno}, objednávku <strong>#${vs}</strong> jsme právě předali dopravci.`)}
    ${trackingBlock(order)}
    <p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;">Doručovací adresa</p>
    ${addressBlock(order)}
    `,
  );
  return { subject: `Objednávka #${vs} je na cestě — HackPack`, html };
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
    ${p(`Ahoj ${order.customer.jmeno}, objednávka <strong>#${vs}</strong> byla doručena. Doufáme, že máš z nákupu radost!`)}
    ${p("Budeme moc rádi, když nám necháš pár slov zpětné vazby — pomáhá nám to i dalším zákazníkům.")}
    <p style="margin:0 0 8px;">
      <a href="${SITE_URL}/napsat-recenzi" style="display:inline-block;background:${BRAND_COLOR};color:${DARK};font-weight:800;font-size:13px;padding:12px 20px;border-radius:10px;text-decoration:none;">Napsat recenzi</a>
    </p>
    `,
  );
  return { subject: `Objednávka #${vs} doručena — HackPack`, html };
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
    ${p(`Ahoj ${name}, díky, že sis udělal/a čas napsat recenzi. Vážíme si toho a moc nám to pomáhá.`)}
    `,
  );
  return { subject: "Díky za recenzi — HackPack", html };
}

export async function sendReviewThankYouEmail(to: string, name: string): Promise<boolean> {
  const { subject, html } = renderReviewThankYouEmail(name);
  return send(to, subject, html);
}

// ── 5) Odpověď adminu na zprávu ze chat widgetu ─────────────────────────────

export function renderMessageReplyEmail(params: { name: string; originalText: string; replyText: string }): {
  subject: string;
  html: string;
} {
  const { name, originalText, replyText } = params;
  const html = layout(
    "Odpověď na vaši zprávu",
    `
    ${h1("Odpověď na vaši zprávu")}
    ${p(`Ahoj ${name}, reagujeme na tvou zprávu z webu HackPack:`)}
    <div style="background:#f7f6f4;border-radius:12px;padding:14px 18px;margin:0 0 20px;font-size:13px;line-height:1.6;color:#3f3f46;white-space:pre-wrap;">${replyText}</div>
    <p style="margin:0 0 6px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;">Tvá původní zpráva</p>
    <div style="border-left:2px solid #e5e7eb;padding-left:14px;margin:0 0 8px;font-size:12px;line-height:1.6;color:#9ca3af;white-space:pre-wrap;">${originalText}</div>
    `,
  );
  return { subject: "Odpověď na vaši zprávu — HackPack", html };
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
