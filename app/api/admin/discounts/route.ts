// app/api/admin/discounts/route.ts
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/session";
import { getAllDiscounts, addDiscount, deleteDiscount } from "@/lib/discountsStore";
import type { DiscountType } from "@/lib/discounts";

const MAX_CODE_LENGTH = 40;
const MAX_LABEL_LENGTH = 120;
const CODE_PATTERN = /^[A-Z0-9_-]+$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

async function requirePermission() {
  const session = await getCurrentSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Neautorizováno." }, { status: 401 }) };
  }
  if (!session.isMain && !session.permissions.includes("discounts")) {
    return { error: NextResponse.json({ error: "Nemáte oprávnění k této akci." }, { status: 403 }) };
  }
  return { session };
}

// GET — seznam všech slevových kódů
export async function GET() {
  const { error } = await requirePermission();
  if (error) return error;

  const discounts = await getAllDiscounts();
  return NextResponse.json({ discounts });
}

// POST — vytvoří nový slevový kód
export async function POST(req: Request) {
  const { error } = await requirePermission();
  if (error) return error;

  try {
    const body = await req.json().catch(() => null);
    const code = body?.code;
    const type: DiscountType = body?.type;
    const value = body?.value;
    const label = body?.label;
    const minOrderCZK = body?.minOrderCZK;
    const active = body?.active;
    const expiresAt = body?.expiresAt;

    if (typeof code !== "string" || !code.trim() || code.trim().length > MAX_CODE_LENGTH || !CODE_PATTERN.test(code.trim())) {
      return NextResponse.json({ error: "Neplatný kód (jen písmena, čísla, - a _)." }, { status: 400 });
    }
    if (type !== "percent" && type !== "fixed") {
      return NextResponse.json({ error: "Neplatný typ slevy." }, { status: 400 });
    }
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
      return NextResponse.json({ error: "Hodnota slevy musí být kladné číslo." }, { status: 400 });
    }
    if (type === "percent" && value > 100) {
      return NextResponse.json({ error: "Procentuální sleva nemůže být vyšší než 100 %." }, { status: 400 });
    }
    if (typeof label !== "string" || !label.trim() || label.trim().length > MAX_LABEL_LENGTH) {
      return NextResponse.json({ error: "Neplatný popisek." }, { status: 400 });
    }
    if (minOrderCZK !== undefined && minOrderCZK !== null && minOrderCZK !== "") {
      if (typeof minOrderCZK !== "number" || !Number.isFinite(minOrderCZK) || minOrderCZK < 0) {
        return NextResponse.json({ error: "Minimální hodnota objednávky musí být kladné číslo." }, { status: 400 });
      }
    }
    if (active !== undefined && typeof active !== "boolean") {
      return NextResponse.json({ error: "Neplatný stav aktivace." }, { status: 400 });
    }
    if (expiresAt !== undefined && expiresAt !== null && expiresAt !== "") {
      if (typeof expiresAt !== "string" || !DATE_PATTERN.test(expiresAt)) {
        return NextResponse.json({ error: "Neplatné datum platnosti." }, { status: 400 });
      }
    }

    const existing = await getAllDiscounts();
    const normalized = code.trim().toUpperCase();
    if (existing.some((d) => d.code.toUpperCase() === normalized)) {
      return NextResponse.json({ error: "Kód s tímto názvem už existuje." }, { status: 409 });
    }

    const discount = await addDiscount({
      code: code.trim(),
      type,
      value,
      label,
      minOrderCZK: minOrderCZK ? Number(minOrderCZK) : undefined,
      active: active ?? true,
      expiresAt: expiresAt || undefined,
    });

    return NextResponse.json({ discount });
  } catch (err) {
    console.error("Admin discounts POST error:", err);
    return NextResponse.json({ error: "Nepodařilo se vytvořit slevový kód." }, { status: 500 });
  }
}

// DELETE ?id=... — smaže slevový kód
export async function DELETE(req: Request) {
  const { error } = await requirePermission();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Chybí id slevového kódu." }, { status: 400 });
  }

  try {
    const deleted = await deleteDiscount(id);
    if (!deleted) {
      return NextResponse.json({ error: "Kód nenalezen." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin discounts DELETE error:", err);
    return NextResponse.json({ error: "Nepodařilo se smazat kód." }, { status: 500 });
  }
}
