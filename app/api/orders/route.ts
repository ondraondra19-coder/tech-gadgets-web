// app/api/orders/route.ts
// Zakládá objednávku PŘÍMO (bez Stripe) — pro platbu na dobírku a bankovním
// převodem. Platba kartou jde přes /api/checkout → Stripe → webhook.
import { NextResponse } from "next/server";
import { getProductsWithPriceOverrides, resolveItemUnitPrice } from "@/lib/priceOverrides";
import { createOrderDirect, type OrderInput, type PaymentMethod } from "@/lib/orders";
import { deductStockForItems } from "@/lib/stock";
import { resolveDiscountForOrder } from "@/lib/discountsStore";
import { getShippingPrice } from "@/lib/shipping/pricing";
import { getDobirkaFee } from "@/lib/fees";
import { checkRateLimit } from "@/lib/rateLimit";

// Strop na množství jedné položky — brání zneužití (záporné/obří množství
// rozbíjí cenu i odečet skladu, viz deductStockForItems).
const MAX_ITEM_QUANTITY = 50;

// Vytáhne klientskou IP z hlaviček (Vercel/proxy). x-forwarded-for může být
// seznam oddělený čárkou — první je klient.
function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, currency, orderData, paymentMethod } = body;

    if (paymentMethod !== "dobirka" && paymentMethod !== "prevod") {
      return NextResponse.json({ error: "Neplatný způsob platby pro tento endpoint." }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Košík je prázdný." }, { status: 400 });
    }

    const currencyCode: string = typeof currency === "object" ? currency.code : currency;

    // Bankovní převod v USD by znamenal mezinárodní SWIFT převod, který
    // pro tenhle e-shop nedává smysl — nabízíme ho jen v CZK/EUR (viz i
    // filtrování platebních metod na /objednavka).
    if (paymentMethod === "prevod" && currencyCode === "USD") {
      return NextResponse.json({ error: "Bankovní převod není v USD dostupný." }, { status: 400 });
    }

    // Množství musí být celé číslo 1..MAX (jinak jde manipulovat cenou i skladem).
    for (const i of items) {
      const q = i?.quantity;
      if (!Number.isInteger(q) || q < 1 || q > MAX_ITEM_QUANTITY) {
        return NextResponse.json({ error: "Neplatné množství u některé položky." }, { status: 400 });
      }
    }

    // ── Rate limit (obrana do hloubky proti skriptovanému zneužití) ──────────
    const ip = getClientIp(req);
    if (!(await checkRateLimit(`checkout:${ip}`, 8, 600))) {
      return NextResponse.json({ error: "Příliš mnoho pokusů. Zkuste to prosím za chvíli." }, { status: 429 });
    }

    // Katalog s aplikovanými přepisy cen z admina — viz stejná poznámka
    // v /api/checkout/route.ts.
    const effectiveProducts = await getProductsWithPriceOverrides();

    let subtotal = 0;
    const resolvedItems = items.map((i: any) => {
      const realProduct = effectiveProducts.find((p) => p.slug === i.slug);
      const unitPrice = realProduct ? resolveItemUnitPrice(realProduct, i.variants, currencyCode) : 0;
      subtotal += unitPrice * i.quantity;
      return {
        slug: i.slug,
        name: realProduct?.name ?? i.slug,
        quantity: i.quantity,
        unitPrice,
        variants: i.variants,
        stockKey: i.stockKey,
      };
    });

    // Cenu dopravy určuje SERVER podle zvoleného způsobu (orderData.doprava),
    // ne podle částky poslané klientem.
    const shippingPrice = getShippingPrice(orderData?.doprava, currencyCode);

    const dobirkaFee = paymentMethod === "dobirka" ? getDobirkaFee(currencyCode) : 0;

    // Sleva se u dobírky/převodu neřeší přes Stripe coupon — jen si ji
    // zaznamenáme pro přehled v adminu (odečet z celkové částky). Počítá ji
    // SERVER z KÓDU (orderData.discountCode), klientovu částku nečteme.
    const resolvedDiscount = await resolveDiscountForOrder(
      orderData?.discountCode,
      items,
      (i) => {
        const p = effectiveProducts.find((pr) => pr.slug === i.slug);
        return p ? resolveItemUnitPrice(p, i.variants, "CZK") : 0;
      },
      (i) => {
        const p = effectiveProducts.find((pr) => pr.slug === i.slug);
        return p ? resolveItemUnitPrice(p, i.variants, currencyCode) : 0;
      },
    );
    const discountInCurrency = resolvedDiscount.discountInCurrency;

    const orderInput: OrderInput = {
      currency: currencyCode,
      paymentMethod: paymentMethod as PaymentMethod,
      customer: {
        jmeno: orderData?.jmeno ?? "",
        email: orderData?.email ?? "",
        telefon: orderData?.telefon ?? "",
        firma: orderData?.firma ?? undefined,
        ic: orderData?.ic ?? undefined,
        dic: orderData?.dic ?? undefined,
      },
      address: orderData?.adresa ?? { mesto: "", uliceCp: "", psc: "", zeme: "" },
      deliveryAddress: orderData?.jineDorucenoAdresa ? orderData?.dorAdresa ?? null : null,
      poznamka: orderData?.poznamka ?? "",
      shippingName: orderData?.dopravaName ?? "Doprava",
      shippingProviderId: ["zasilkovna_box", "zasilkovna_adresa"].includes(orderData?.doprava) ? "zasilkovna" : null,
      shippingPrice,
      isDobirka: paymentMethod === "dobirka",
      dobirkaFee,
      discountCode: resolvedDiscount.discountCode,
      discountLabel: resolvedDiscount.discountLabel,
      discountAmountCZK: resolvedDiscount.discountAmountCZK,
      items: resolvedItems,
      subtotal,
      total: subtotal + shippingPrice + dobirkaFee - discountInCurrency,
      zboxId: orderData?.zbox?.id ?? null,
    };

    // Dobírka/převod nemá platební potvrzení jako karta — sklad si
    // "rezervujeme" hned. Odečet děláme PŘED založením objednávky: když
    // mezitím došlo skladem, objednávku vůbec nevytvoříme a čistě ji
    // odmítneme (žádná platba zatím neproběhla, takže je to v pořádku).
    const deduction = await deductStockForItems(resolvedItems);
    if (!deduction.ok) {
      const names = deduction.insufficientFields
        .map((field) => {
          const slug = field.split("|")[0];
          return effectiveProducts.find((p) => p.slug === slug)?.name ?? slug;
        })
        .filter((name, i, arr) => arr.indexOf(name) === i) // deduplikace názvů
        .join(", ");
      return NextResponse.json(
        { error: `Bohužel mezitím došlo skladem: ${names}. Upravte prosím množství v košíku.` },
        { status: 409 },
      );
    }

    const order = await createOrderDirect(orderInput);

    return NextResponse.json({ ok: true, orderId: order.id });
  } catch (err: any) {
    console.error("Chyba při vytváření objednávky (dobírka/převod):", err);
    return NextResponse.json({ error: "Objednávku se nepodařilo uložit." }, { status: 500 });
  }
}