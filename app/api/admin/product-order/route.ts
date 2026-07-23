// app/api/admin/product-order/route.ts
// GET  → aktuální doporučené pořadí produktů ({ slug: index }).
// POST → uloží nové pořadí. Tělo: { order: string[] } (slugy v cílovém pořadí).
// Vyžaduje přihlášení A oprávnění "products" (hlavní účet má vždy).
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/session";
import { getProductOrder, setProductOrder } from "@/lib/productOrder";

async function requireProductsPermission() {
  const session = await getCurrentSession();
  if (!session) return { error: "Neautorizováno.", status: 401 as const };
  if (!session.isMain && !session.permissions.includes("products")) {
    return { error: "Nemáte oprávnění k této akci.", status: 403 as const };
  }
  return null;
}

export async function GET() {
  const denied = await requireProductsPermission();
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status });

  try {
    const order = await getProductOrder();
    return NextResponse.json({ order });
  } catch (error) {
    console.error("Admin product-order GET error:", error);
    return NextResponse.json({ error: "Nepodařilo se načíst pořadí." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const denied = await requireProductsPermission();
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status });

  let body: { order?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatné tělo požadavku." }, { status: 400 });
  }

  const order = body.order;
  if (!Array.isArray(order) || order.some((s) => typeof s !== "string")) {
    return NextResponse.json({ error: "Chybí platné pořadí (pole slugů)." }, { status: 400 });
  }

  try {
    await setProductOrder(order as string[]);
    return NextResponse.json({ success: true, count: order.length });
  } catch (error) {
    console.error("Admin product-order POST error:", error);
    return NextResponse.json({ error: "Nepodařilo se uložit pořadí." }, { status: 500 });
  }
}
