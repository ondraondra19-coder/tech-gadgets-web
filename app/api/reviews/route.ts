// app/api/reviews/route.ts
//
// Chyby vrací `code`, ne hotovou větu — text se skládá až na klientovi podle
// jazyka (messages/*.json, namespace `review`). Server jazyk návštěvníka nezná,
// drží ho cookie čtená až po hydrataci (viz lib/locale.ts). `error` zůstává
// jako čitelný fallback do logů. U cooldownu jdou s kódem i hodiny/minuty,
// protože čísla se doplňují do věty až v překladu.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAllReviews, addReview, checkAndSetCooldown, toPublicReview } from "@/lib/reviews";
import { sendReviewThankYouEmail } from "@/lib/email";

const MAX_TEXT_LENGTH = 600;
const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 150;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ReviewErrorCode =
  | "invalid_name"
  | "invalid_text"
  | "invalid_rating"
  | "invalid_email"
  | "captcha_missing"
  | "captcha_failed"
  | "cooldown"
  | "failed";

function fail(code: ReviewErrorCode, error: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ code, error, ...extra }, { status });
}

// Cookie identifikující konkrétní prohlížeč/zařízení — cooldown se váže na tohle,
// ne na IP adresu, aby lidi na stejné Wi-Fi nesdíleli limit.
const DEVICE_COOKIE_NAME = "review_device_id";
const DEVICE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 rok

// GET /api/reviews — vrátí všechny recenze (veřejné, jen bezpečná pole)
export async function GET() {
  try {
    const reviews = await getAllReviews();
    return NextResponse.json({ reviews: reviews.map(toPublicReview) });
  } catch (error) {
    console.error("Reviews GET error:", error);
    return NextResponse.json({ reviews: [], code: "failed", error: "Nepodařilo se načíst recenze." }, { status: 500 });
  }
}

// POST /api/reviews — vytvoří novou recenzi
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, rating, text, email, captchaToken } = body ?? {};

    // ── Validace vstupu ────────────────────────────────────────────────────
    if (typeof name !== "string" || !name.trim() || name.trim().length > MAX_NAME_LENGTH) {
      return fail("invalid_name", "Neplatné jméno.", 400);
    }
    if (typeof text !== "string" || !text.trim() || text.length > MAX_TEXT_LENGTH) {
      return fail("invalid_text", "Neplatný text recenze.", 400);
    }
    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return fail("invalid_rating", "Neplatné hodnocení.", 400);
    }
    // Email je nepovinný, ale pokud je vyplněný, musí vypadat jako email
    let emailValue: string | undefined;
    if (typeof email === "string" && email.trim()) {
      const trimmed = email.trim();
      if (trimmed.length > MAX_EMAIL_LENGTH || !EMAIL_REGEX.test(trimmed)) {
        return fail("invalid_email", "Neplatný email.", 400);
      }
      emailValue = trimmed;
    }
    if (typeof captchaToken !== "string" || !captchaToken) {
      return fail("captcha_missing", "Chybí ověření captcha.", 400);
    }

    // ── Server-side ověření hCaptcha ───────────────────────────────────────
    const secret = process.env.HCAPTCHA_SECRET;
    if (!secret) {
      console.error("❌ CHYBÍ HCAPTCHA_SECRET v env proměnných.");
      return fail("failed", "Captcha nelze ověřit (chybí konfigurace serveru).", 500);
    }

    const verifyRes = await fetch("https://api.hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: captchaToken }),
    });
    const verifyJson = await verifyRes.json();
    if (!verifyJson.success) {
      return fail("captcha_failed", "Ověření captcha se nezdařilo.", 400);
    }

    // ── Identifikace zařízení (cookie, ne IP) ──────────────────────────────
    const cookieStore = await cookies();
    let deviceId = cookieStore.get(DEVICE_COOKIE_NAME)?.value;
    if (!deviceId) {
      deviceId = crypto.randomUUID();
    }
    cookieStore.set(DEVICE_COOKIE_NAME, deviceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: DEVICE_COOKIE_MAX_AGE_SECONDS,
    });

    // ── Anti-spam: 1 recenze / zařízení / 24h ──────────────────────────────
    const { allowed, ttlSeconds } = await checkAndSetCooldown(deviceId);
    if (!allowed) {
      const hours = Math.floor(ttlSeconds / 3600);
      const minutes = Math.floor((ttlSeconds % 3600) / 60);
      return fail("cooldown", `Další recenzi můžete napsat za ${hours}h ${minutes}min.`, 429, { hours, minutes });
    }

    // ── Metadata pro admin ─────────────────────────────────────────────────
    const userAgent = req.headers.get("user-agent") ?? undefined;

    // ── Uložení ─────────────────────────────────────────────────────────────
    const review = await addReview({
      name,
      rating: ratingNum,
      text,
      email: emailValue,
      userAgent,
    });
    if (emailValue) await sendReviewThankYouEmail(emailValue, name.trim());
    return NextResponse.json({ review: toPublicReview(review) });
  } catch (error) {
    console.error("Reviews POST error:", error);
    return fail("failed", "Nepodařilo se uložit recenzi.", 500);
  }
}