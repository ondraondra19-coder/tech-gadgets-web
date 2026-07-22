// app/api/claims/route.ts
// Veřejný endpoint — odstoupení od smlouvy do 14 dnů (vrácení zboží bez udání
// důvodu) z formuláře na /reklamace.
//
// Chyby vrací `code`, ne hotovou větu: text se skládá až na klientovi podle
// zvoleného jazyka (messages/*.json → namespace `claims`). Stejný vzor jako
// /api/messages a /api/newsletter.
import { NextResponse } from "next/server";
import { addClaim, checkAndSetClaimCooldown } from "@/lib/claims";
import { sendClaimAdminEmail, sendClaimConfirmationEmail } from "@/lib/email";
import { getClientIp } from "@/lib/clientIp";
import { isValidEmail } from "@/lib/emailValidation";

const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 150;
const MAX_PHONE_LENGTH = 40;
const MAX_ORDER_LENGTH = 40;
const MAX_ACCOUNT_LENGTH = 50;
const MAX_REASON_LENGTH = 2000;

export type ClaimsErrorCode =
  | "invalid_name"
  | "invalid_email"
  | "invalid_phone"
  | "invalid_order"
  | "invalid_account"
  | "invalid_reason"
  | "cooldown"
  | "failed";

function fail(code: ClaimsErrorCode, error: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ code, error, ...extra }, { status });
}

function isFilled(value: unknown, max: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= max;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const { jmeno, email, telefon, cisloObjednavky, cisloUctu, duvod } = body ?? {};

    // ── Validace vstupu ────────────────────────────────────────────────────
    // Server validuje znovu všechno, co hlídá i formulář — na klienta se
    // spolehnout nedá, endpoint je veřejný.
    if (!isFilled(jmeno, MAX_NAME_LENGTH)) {
      return fail("invalid_name", "Neplatné jméno.", 400);
    }
    if (!isFilled(email, MAX_EMAIL_LENGTH) || !isValidEmail(email.trim())) {
      return fail("invalid_email", "Neplatný e-mail.", 400);
    }
    if (!isFilled(telefon, MAX_PHONE_LENGTH)) {
      return fail("invalid_phone", "Neplatné telefonní číslo.", 400);
    }
    if (!isFilled(cisloObjednavky, MAX_ORDER_LENGTH)) {
      return fail("invalid_order", "Neplatné číslo objednávky.", 400);
    }
    // Číslo účtu je povinné — bez něj nemáme kam vrátit peníze.
    if (!isFilled(cisloUctu, MAX_ACCOUNT_LENGTH)) {
      return fail("invalid_account", "Neplatné číslo účtu.", 400);
    }
    // Důvod je NEPOVINNÝ (u odstoupení do 14 dnů ho zákon zakazuje vyžadovat) —
    // validujeme jen délku, a jen když ho zákazník vyplní.
    if (typeof duvod === "string" && duvod.trim().length > MAX_REASON_LENGTH) {
      return fail("invalid_reason", "Důvod je příliš dlouhý.", 400);
    }

    // ── Anti-spam: 1 žádost / IP adresa / 5 minut ──────────────────────────
    const ip = getClientIp(req);
    const { allowed, ttlSeconds } = await checkAndSetClaimCooldown(ip);
    if (!allowed) {
      const minutes = Math.max(1, Math.ceil(ttlSeconds / 60));
      return fail("cooldown", `Další žádost můžete odeslat za ${minutes} min.`, 429, { minutes });
    }

    const claim = await addClaim({
      jmeno,
      email,
      telefon,
      cisloObjednavky,
      cisloUctu,
      duvod: typeof duvod === "string" ? duvod : "",
    });

    // Žádost je uložená a číslo případu přidělené — od téhle chvíle nesmí
    // selhání e-mailu vrátit zákazníkovi chybu, jinak by formulář odeslal
    // znovu a založil druhý případ. Obě send* funkce chyby jen logují.
    await Promise.all([sendClaimConfirmationEmail(claim), sendClaimAdminEmail(claim)]);

    // Číslo případu vrací SERVER — klient si ho nesmí vymýšlet (dřív ho
    // generoval Math.random(), takže se s ničím uloženým neshodovalo).
    return NextResponse.json({ ok: true, ticket: claim.ticket });
  } catch (err) {
    console.error("Claims POST error:", err);
    return fail("failed", "Odeslání se nezdařilo.", 500);
  }
}
