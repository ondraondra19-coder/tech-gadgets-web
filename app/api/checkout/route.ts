import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getProductsWithPriceOverrides, resolveItemUnitPrice } from '@/lib/priceOverrides';
import { createPendingOrder, type OrderInput } from '@/lib/orders';
import { resolveDiscountForOrder } from '@/lib/discountsStore';
import { getShippingPrice } from '@/lib/shipping/pricing';
import { getDobirkaFee } from '@/lib/fees';
import { checkRateLimit } from '@/lib/rateLimit';

// Strop na množství jedné položky — brání zneužití (záporné/obří množství
// rozbíjí cenu i odečet skladu).
const MAX_ITEM_QUANTITY = 50;

// Vytáhne klientskou IP z hlaviček (Vercel/proxy). x-forwarded-for může být
// seznam oddělený čárkou — první je klient.
function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

export async function POST(req: Request) {
  const key = process.env.STRIPE_SECRET_KEY;

  if (!key || key.trim() === "") {
    console.error("CHYBA: STRIPE_SECRET_KEY chybí!");
    return NextResponse.json({ error: "Platby nejsou nakonfigurovány." }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { items, currency, orderData } = body;
    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const stripe = new Stripe(key);

    const currencyCode: string = typeof currency === 'object' ? currency.code : currency;

    // ── Validace vstupu ──────────────────────────────────────────────────────
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Košík je prázdný." }, { status: 400 });
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

    // Katalog SE ZAPSANÝMI přepisy cen z admina — od teď se v celé funkci
    // používá TOHLE pole, ne přímý import z lib/products.ts, aby se vždy
    // strhla aktuální cena (i těsně po úpravě v adminu, bez redeploye).
    const products = await getProductsWithPriceOverrides();

    // ── Helper: cena produktu v dané měně (jen pro produkty BEZ modelů —
    // pro modely a vrstvené barvy se používá resolveItemUnitPrice, který
    // zohlední i výběr modelu a příplatek za namíchané barvy) ──────────────
    function getUnitAmount(price: number | Record<string, number>, code: string): number {
      if (typeof price === 'number') return price;
      // Zkusíme požadovanou měnu, fallback na CZK
      return price[code] ?? price['CZK'] ?? 0;
    }

    // ── 1. Produkty ──────────────────────────────────────────────────────────
    let subtotal = 0;
    const line_items = items.map((cartItem: any) => {
      const realProduct = products.find(p => p.slug === cartItem.slug);
      if (!realProduct) throw new Error(`Produkt ${cartItem.slug} nenalezen.`);

      const unitAmount = resolveItemUnitPrice(realProduct, cartItem.variants, currencyCode);
      if (!unitAmount || unitAmount <= 0) {
        throw new Error(`Neplatná cena pro produkt ${cartItem.slug} v měně ${currencyCode}`);
      }
      subtotal += unitAmount * cartItem.quantity;

      const variantLabel = cartItem.variants
        ? ` (${Object.values(cartItem.variants).join(' | ')})`
        : '';

      const imageUrl = cartItem.img?.startsWith('http')
        ? cartItem.img
        : `${origin}${cartItem.img}`;

      return {
        price_data: {
          currency: currencyCode.toLowerCase(),
          product_data: {
            name: `${realProduct.name}${variantLabel}`,
            images: imageUrl ? [imageUrl] : [],
          },
          unit_amount: Math.round(unitAmount * 100),
        },
        quantity: cartItem.quantity,
      };
    });

    // ── 2. Doprava ───────────────────────────────────────────────────────────
    // Cenu dopravy určuje SERVER podle zvoleného způsobu (orderData.doprava),
    // ne podle částky poslané klientem.
    const shippingPrice = getShippingPrice(orderData?.doprava, currencyCode);
    if (shippingPrice > 0) {
      line_items.push({
        price_data: {
          currency: currencyCode.toLowerCase(),
          product_data: { name: `Doprava: ${orderData?.dopravaName ?? 'Doprava'}`, images: [] },
          unit_amount: Math.round(shippingPrice * 100),
        },
        quantity: 1,
      });
    }

    // ── 3. Dobírka ───────────────────────────────────────────────────────────
    let dobirkaFee = 0;
    if (orderData?.isDobirka) {
      dobirkaFee = getDobirkaFee(currencyCode);
      line_items.push({
        price_data: {
          currency: currencyCode.toLowerCase(),
          product_data: { name: 'Příplatek za dobírku', images: [] },
          unit_amount: Math.round(dobirkaFee * 100),
        },
        quantity: 1,
      });
    }

    // ── 4. Sleva — Stripe coupon ─────────────────────────────────────────────
    // Slevu spočítá SERVER z KÓDU (orderData.discountCode) — klientova
    // discountAmountCZK se pro cenu vůbec nečte, jinak by šlo poslat libovolnou
    // částku. Z výsledku vytvoříme jednorázový Stripe coupon (amount_off v centech).
    const resolvedDiscount = await resolveDiscountForOrder(
      orderData?.discountCode,
      items,
      (i) => {
        const p = products.find(pr => pr.slug === i.slug);
        return p ? resolveItemUnitPrice(p, i.variants, 'CZK') : 0;
      },
      (i) => {
        const p = products.find(pr => pr.slug === i.slug);
        return p ? resolveItemUnitPrice(p, i.variants, currencyCode) : 0;
      },
    );

    let stripeCouponId: string | undefined;
    let discountInCurrency = resolvedDiscount.discountInCurrency;
    const discountCents = Math.round(discountInCurrency * 100);

    if (discountCents > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: discountCents,
        currency: currencyCode.toLowerCase(),
        name: resolvedDiscount.discountCode
          ? `${resolvedDiscount.discountCode} – ${resolvedDiscount.discountLabel ?? 'Sleva'}`
          : 'Slevový kód',
        max_redemptions: 1, // jednorázový
      });
      stripeCouponId = coupon.id;
    } else {
      discountInCurrency = 0;
    }

    // ── 5. Pending objednávka v Redisu ───────────────────────────────────────
    // Zákazník už vyplnil kontaktní/dodací údaje na předchozím kroku (orderData).
    // Uložíme je TEĎ, aby je webhook po potvrzení platby mohl jen "povýšit" na
    // opravdovou objednávku — bez nutnosti cokoliv posílat znovu.
    const orderInput: OrderInput = {
      currency: currencyCode,
      paymentMethod: 'karta',
      customer: {
        jmeno: orderData?.jmeno ?? '',
        email: orderData?.email ?? '',
        telefon: orderData?.telefon ?? '',
        firma: orderData?.firma ?? undefined,
        ic: orderData?.ic ?? undefined,
        dic: orderData?.dic ?? undefined,
      },
      address: orderData?.adresa ?? { mesto: '', uliceCp: '', psc: '', zeme: '' },
      deliveryAddress: orderData?.jineDorucenoAdresa ? orderData?.dorAdresa ?? null : null,
      poznamka: orderData?.poznamka ?? '',
      shippingName: orderData?.dopravaName ?? 'Doprava',
      shippingProviderId: ["zasilkovna_box", "zasilkovna_adresa"].includes(orderData?.doprava) ? "zasilkovna" : null,
      shippingPrice,
      isDobirka: false,
      discountCode: resolvedDiscount.discountCode,
      discountLabel: resolvedDiscount.discountLabel,
      discountAmountCZK: resolvedDiscount.discountAmountCZK,
      items: items.map((i: any) => {
        const realProduct = products.find(p => p.slug === i.slug);
        return {
          slug: i.slug,
          name: realProduct?.name ?? i.slug,
          quantity: i.quantity,
          unitPrice: realProduct ? resolveItemUnitPrice(realProduct, i.variants, currencyCode) : 0,
          variants: i.variants,
          stockKey: i.stockKey,
        };
      }),
      subtotal,
      total: subtotal + shippingPrice + dobirkaFee - discountInCurrency,
      zboxId: orderData?.zbox?.id ?? null,
    };

    const pendingOrderId = await createPendingOrder(orderInput);

    // ── 6. Checkout Session ──────────────────────────────────────────────────
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'link'],
      line_items,
      mode: 'payment',
      // Přiložíme coupon pokud existuje
      ...(stripeCouponId ? { discounts: [{ coupon: stripeCouponId }] } : {}),
      success_url: `${origin}/objednavka/uspech?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/kosik`,
      metadata: {
        order_items: JSON.stringify(items.map((i: any) => ({ slug: i.slug, qty: i.quantity }))),
        discount_code: resolvedDiscount.discountCode ?? '',
        pending_order_id: pendingOrderId,
      },
    });

    return NextResponse.json({ url: session.url });

  } catch (err: any) {
    console.error('STRIPE ERROR:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}