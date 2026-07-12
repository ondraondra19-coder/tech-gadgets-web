import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getProductsWithPriceOverrides, resolveItemUnitPrice } from '@/lib/priceOverrides';
import { createPendingOrder, type OrderInput } from '@/lib/orders';
import { getPostHogClient } from '@/lib/posthog-server';

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
    let shippingPrice = 0;
    if (orderData?.dopravaPrice) {
      shippingPrice = typeof orderData.dopravaPrice === 'number'
        ? orderData.dopravaPrice
        : (orderData.dopravaPrice as any)?.[currencyCode] || 0;

      if (shippingPrice > 0) {
        line_items.push({
          price_data: {
            currency: currencyCode.toLowerCase(),
            product_data: { name: `Doprava: ${orderData.dopravaName}` },
            unit_amount: Math.round(shippingPrice * 100),
          },
          quantity: 1,
        });
      }
    }

    // ── 3. Dobírka ───────────────────────────────────────────────────────────
    let dobirkaFee = 0;
    if (orderData?.isDobirka) {
      const dobirkaFees: Record<string, number> = { CZK: 39, EUR: 1.59, USD: 1.79 };
      dobirkaFee = dobirkaFees[currencyCode] ?? 39;
      line_items.push({
        price_data: {
          currency: currencyCode.toLowerCase(),
          product_data: { name: 'Příplatek za dobírku' },
          unit_amount: Math.round(dobirkaFee * 100),
        },
        quantity: 1,
      });
    }

    // ── 4. Sleva — Stripe coupon ─────────────────────────────────────────────
    // Vytvoříme jednorázový coupon přímo v Stripe a použijeme ho na session.
    // Stripe coupons podporují jak procenta tak pevnou částku.
    let stripeCouponId: string | undefined;
    let discountInCurrency = 0;

    if (orderData?.discountAmountCZK && orderData.discountAmountCZK > 0) {
      // Přepočítáme slevu z CZK do aktuální měny poměrem košíku
      const subtotalCZK: number = items.reduce((sum: number, cartItem: any) => {
        const realProduct = products.find(p => p.slug === cartItem.slug);
        if (!realProduct) return sum;
        const priceCZK = resolveItemUnitPrice(realProduct, cartItem.variants, 'CZK');
        return sum + priceCZK * cartItem.quantity;
      }, 0);

      if (currencyCode === 'CZK' || subtotalCZK === 0) {
        discountInCurrency = orderData.discountAmountCZK;
      } else {
        const ratio = subtotal / subtotalCZK;
        discountInCurrency = orderData.discountAmountCZK * ratio;
      }

      const discountCents = Math.round(discountInCurrency * 100);

      if (discountCents > 0) {
        // Vytvoříme jednorázový coupon (amount_off = pevná sleva v centech)
        const coupon = await stripe.coupons.create({
          amount_off: discountCents,
          currency: currencyCode.toLowerCase(),
          name: orderData.discountCode
            ? `${orderData.discountCode} – ${orderData.discountLabel ?? 'Sleva'}`
            : 'Slevový kód',
          max_redemptions: 1, // jednorázový
        });
        stripeCouponId = coupon.id;
      } else {
        discountInCurrency = 0;
      }
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
      shippingPrice,
      isDobirka: false,
      discountCode: orderData?.discountCode ?? null,
      discountLabel: orderData?.discountLabel ?? null,
      discountAmountCZK: orderData?.discountAmountCZK ?? 0,
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
        discount_code: orderData?.discountCode ?? '',
        pending_order_id: pendingOrderId,
      },
    });

    // Track checkout session creation in PostHog
    const posthog = getPostHogClient();
    const distinctId = orderData?.email ?? `anon_${pendingOrderId}`;
    posthog.capture({
      distinctId,
      event: "checkout_session_created",
      properties: {
        currency: currencyCode,
        subtotal,
        total: subtotal + shippingPrice + dobirkaFee - discountInCurrency,
        item_count: (items as { quantity: number }[]).reduce((sum, i) => sum + i.quantity, 0),
        product_slugs: (items as { slug: string }[]).map((i) => i.slug),
        shipping_method: orderData?.dopravaName ?? null,
        has_discount: !!orderData?.discountCode,
        pending_order_id: pendingOrderId,
      },
    });
    await posthog.flush();

    return NextResponse.json({ url: session.url });

  } catch (err: any) {
    console.error('STRIPE ERROR:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}