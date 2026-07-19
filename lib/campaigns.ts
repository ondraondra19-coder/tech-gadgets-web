// lib/campaigns.ts
// Rozesílání marketingových kampaní (newsletter) přes Resend Broadcasts.
// Kampaň jde na celou Audience (segment) a Resend do ní sám vloží odhlašovací
// odkaz. Používá stejný full-access klíč jako přidávání kontaktů (viz
// lib/newsletter.ts) — Broadcasts API sending-only klíč neumí.
//
// POZOR: broadcasts.create selže (i jako koncept) s "domain is not verified",
// dokud není odesílací doména ověřená v Resendu. Do té doby sendCampaign()
// vrátí reason "domain_unverified" a panel to čitelně zobrazí.
import { getContactsClient } from "./newsletter";
import { renderCampaignEmail } from "./email";

const MAX_SUBJECT_LENGTH = 200;
const MAX_BODY_LENGTH = 20000;

// Odesílatel kampaní. Zvlášť od transakčního (RESEND_FROM_EMAIL), ať se dá
// marketing posílat z jiné (pod)domény — doporučeně news@… kvůli reputaci.
function campaignFrom(): string {
  return (
    process.env.RESEND_CAMPAIGN_FROM ??
    process.env.RESEND_FROM_EMAIL ??
    "SLINGR <info@slingr.cz>"
  );
}

// Segment ("Audience") se dohledá jednou a nacachuje. Novější Resend účty
// nemají v UI viditelné ID, ale segments.list() ho vrátí. Když má účet víc
// segmentů, dá se konkrétní vynutit přes RESEND_AUDIENCE_ID.
let cachedSegmentId: string | null = null;

async function resolveSegmentId(): Promise<string | null> {
  if (cachedSegmentId) return cachedSegmentId;

  const forced = process.env.RESEND_AUDIENCE_ID;
  if (forced) {
    cachedSegmentId = forced;
    return forced;
  }

  const resend = getContactsClient();
  if (!resend) return null;

  try {
    const { data, error } = await resend.segments.list();
    if (error || !data?.data?.length) return null;
    cachedSegmentId = data.data[0].id;
    return cachedSegmentId;
  } catch (err) {
    console.error("Nepodařilo se načíst segmenty Resend:", err);
    return null;
  }
}

export type CampaignSummary = {
  id: string;
  name: string | null;
  subject: string | null;
  status: string | null;
  sentAt: string | null;
};

export type CampaignContext = {
  subscriberCount: number | null;
  recent: CampaignSummary[];
};

export async function getCampaignContext(): Promise<CampaignContext> {
  const resend = getContactsClient();
  if (!resend) return { subscriberCount: null, recent: [] };

  let subscriberCount: number | null = null;
  try {
    const { data } = await resend.contacts.list();
    const contacts = data?.data ?? [];
    // has_more zatím neřešíme — účet je nový a kontaktů málo; kdyby jich byly
    // tisíce, došlo by tu na stránkování.
    subscriberCount = contacts.filter((c) => !c.unsubscribed).length;
  } catch {
    subscriberCount = null;
  }

  let recent: CampaignSummary[] = [];
  try {
    const { data } = await resend.broadcasts.list();
    const list = (data?.data ?? []) as Array<Record<string, unknown>>;
    recent = list.slice(0, 5).map((b) => ({
      id: String(b.id ?? ""),
      name: (b.name as string) ?? null,
      subject: (b.subject as string) ?? null,
      status: (b.status as string) ?? null,
      sentAt: (b.sent_at as string) ?? (b.scheduled_at as string) ?? null,
    }));
  } catch {
    recent = [];
  }

  return { subscriberCount, recent };
}

export type SendCampaignResult =
  | { ok: true; id: string }
  | { ok: false; reason: "invalid" | "not_configured" | "no_audience" | "domain_unverified" | "error"; message: string };

export async function sendCampaign(params: {
  subject: string;
  previewText?: string;
  body: string;
}): Promise<SendCampaignResult> {
  const subject = params.subject?.trim() ?? "";
  const body = params.body?.trim() ?? "";
  const previewText = params.previewText?.trim() || undefined;

  if (!subject || subject.length > MAX_SUBJECT_LENGTH) {
    return { ok: false, reason: "invalid", message: "Předmět je prázdný nebo příliš dlouhý." };
  }
  if (!body || body.length > MAX_BODY_LENGTH) {
    return { ok: false, reason: "invalid", message: "Text kampaně je prázdný nebo příliš dlouhý." };
  }

  const resend = getContactsClient();
  if (!resend) {
    return { ok: false, reason: "not_configured", message: "Chybí RESEND_CONTACTS_API_KEY (full-access klíč)." };
  }

  const segmentId = await resolveSegmentId();
  if (!segmentId) {
    return { ok: false, reason: "no_audience", message: "Nepodařilo se najít žádnou Audience v Resendu." };
  }

  const { html } = renderCampaignEmail({ subject, previewText, body });

  try {
    const { data, error } = await resend.broadcasts.create({
      segmentId,
      from: campaignFrom(),
      subject,
      html,
      name: subject,
      ...(previewText ? { previewText } : {}),
      send: true, // rozeslat hned; bez tohohle by vznikl jen koncept
    });

    if (error) {
      // Nejčastější stav před spuštěním je neověřená doména. Navenek ho ale
      // NEROZLIŠUJEME zvláštní hláškou (web má působit hotově) — jen to
      // zalogujeme na server pro diagnostiku a uživateli vrátíme neutrální
      // chybu. reason zůstává kvůli případnému budoucímu použití.
      if (/domain is not verified|not verified/i.test(error.message ?? "")) {
        console.error("Kampaň neodeslána — odesílací doména není v Resendu ověřená.");
        return {
          ok: false,
          reason: "domain_unverified",
          message: "Kampaň se teď nepodařilo odeslat. Zkus to prosím znovu.",
        };
      }
      return { ok: false, reason: "error", message: error.message ?? "Odeslání kampaně se nezdařilo." };
    }

    return { ok: true, id: data?.id ?? "" };
  } catch (err) {
    console.error("Odeslání kampaně selhalo:", err);
    return { ok: false, reason: "error", message: "Odeslání kampaně se nezdařilo." };
  }
}
