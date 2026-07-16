// app/api/messages/route.ts
// Veřejný endpoint — přijímá zprávy z ChatWidgetu na e-shopu.
import { NextResponse } from "next/server";
import { addMessage, checkAndSetCooldown } from "@/lib/messages";
import { getClientIp } from "@/lib/clientIp";

const MAX_TEXT_LENGTH = 1000;
const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 150;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/messages — odeslání zprávy z chat widgetu
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, text } = body ?? {};

    // ── Validace vstupu ────────────────────────────────────────────────────
    if (typeof name !== "string" || !name.trim() || name.trim().length > MAX_NAME_LENGTH) {
      return NextResponse.json({ error: "Neplatné jméno." }, { status: 400 });
    }
    if (
      typeof email !== "string" ||
      !email.trim() ||
      email.trim().length > MAX_EMAIL_LENGTH ||
      !EMAIL_REGEX.test(email.trim())
    ) {
      return NextResponse.json({ error: "Neplatný email." }, { status: 400 });
    }
    if (typeof text !== "string" || !text.trim() || text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json({ error: "Zpráva je prázdná nebo příliš dlouhá." }, { status: 400 });
    }

    // ── Anti-spam: 1 zpráva / IP adresa / 5 minut ──────────────────────────
    const ip = getClientIp(req);
    const { allowed, ttlSeconds } = await checkAndSetCooldown(ip);
    if (!allowed) {
      const minutes = Math.max(1, Math.ceil(ttlSeconds / 60));
      return NextResponse.json(
        { error: `Další zprávu můžete odeslat za ${minutes} min.` },
        { status: 429 }
      );
    }

    await addMessage({ name: name.trim(), email: email.trim(), text: text.trim() });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Messages POST error:", error);
    return NextResponse.json({ error: "Nepodařilo se odeslat zprávu." }, { status: 500 });
  }
}