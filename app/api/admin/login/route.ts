// app/api/admin/login/route.ts
import { NextResponse } from "next/server";
import {
  checkPassword,
  createSessionToken,
  ADMIN_COOKIE_NAME,
  ADMIN_COOKIE_MAX_AGE_SECONDS,
  MAIN_ACCOUNT_ID,
  MAIN_ACCOUNT_NAME,
} from "@/lib/adminAuth";
import { verifyAccountPassword } from "@/lib/accounts";

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const username = body?.username;
    const password = body?.password;

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      !username.trim() ||
      !password
    ) {
      return NextResponse.json({ error: "Vyplňte uživatelské jméno i heslo." }, { status: 400 });
    }

    let accountId: string | null = null;

    if (normalizeName(username) === normalizeName(MAIN_ACCOUNT_NAME)) {
      // Hlavní účet — heslo je ADMIN_SECRET
      if (checkPassword(password)) {
        accountId = MAIN_ACCOUNT_ID;
      }
    } else {
      // Dílčí účet — heslo se ověřuje proti hashi v Redisu
      const account = await verifyAccountPassword(username, password);
      if (account) {
        accountId = account.id;
      }
    }

    if (!accountId) {
      // Drobné zpomalení, aby brute-force pokusy byly méně praktické
      await new Promise((r) => setTimeout(r, 400));
      return NextResponse.json(
        { error: "Nesprávné uživatelské jméno nebo heslo." },
        { status: 401 }
      );
    }

    const token = await createSessionToken(accountId);
    const res = NextResponse.json({ success: true });
    res.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ADMIN_COOKIE_MAX_AGE_SECONDS,
    });
    return res;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: "Chyba serveru." }, { status: 500 });
  }
}