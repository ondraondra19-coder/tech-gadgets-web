// app/api/webhooks/stripe/route.ts
// Stripe webhook — zachytává checkout.session.completed a:
//   1) povýší "pending" objednávku (uloženou při zahájení checkoutu)
//      na potvrzenou — teprve TEĎ se objeví v admin panelu
//   2) zapíše ji do PostHogu (tržby, počet objednávek, top produkty)
//
// Toto je nezávislé na cookie souhlasu — jde o transakční data nutná
// ke zpracování/vyhodnocení objednávky, ne o sledování chování návštěvníka.
//
// Nastavení ve Stripe dashboardu:
//   Developers → Webhooks → Add endpoint
//   URL: https://tvoje-domena.cz/api/webhooks/stripe
//   Událost k odběru: checkout.session.completed
//   Signing secret zkopíruj do Vercel env proměnné STRIPE_WEBHOOK_SECRET
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { products } from "@/lib/products";
import { createPostHogServerClient, captureServerEvent } from "@/lib/posthog-server";
import { confirmPendingOrder, markStockIssue } from "@/lib/orders";
import { deductStockForItems } from "@/lib/stock";
import { sendOrderConfirmationEmail } from "@/lib/email";

export async function POST(req: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!key || !webhookSecret) {
    console.error("CHYBA: STRIPE_SECRET_KEY nebo STRIPE_WEBHOOK_SECRET chybí!");
    return NextResponse.json({ error: "Webhook není nakonfigurován." }, { status: 500 });
  }

  const stripe = new Stripe(key);
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Chybí Stripe podpis." }, { status: 400 });
  }

  // Stripe vyžaduje SUROVÉ (nezparsované) tělo požadavku pro ověření podpisu.
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error("Neplatný Stripe webhook podpis:", err.message);
    return NextResponse.json({ error: "Neplatný podpis." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      const currency = (session.currency ?? "czk").toUpperCase();
      const amountTotal = (session.amount_total ?? 0) / 100;

      let items: { slug: string; qty: number }[] = [];
      try {
        items = JSON.parse(session.metadata?.order_items ?? "[]");
      } catch {
        items = [];
      }

      const resolvedItems = items.map((i) => {
        const product = products.find((p) => p.slug === i.slug);
        return {
          slug: i.slug,
          name: product?.name ?? i.slug,
          quantity: i.qty,
        };
      });

      const posthogClient = createPostHogServerClient();
      if (posthogClient) {
        const distinctId = session.id;
        captureServerEvent(posthogClient, distinctId, "order_completed", {
          order_id: session.id,
          currency,
          revenue: amountTotal,
          item_count: resolvedItems.reduce((s, i) => s + i.quantity, 0),
        });
        for (const item of resolvedItems) {
          captureServerEvent(posthogClient, distinctId, "product_purchased", {
            order_id: session.id,
            slug: item.slug,
            name: item.name,
            quantity: item.quantity,
            currency,
          });
        }
        await posthogClient.shutdown();
      }

      // Povýšíme pending objednávku na potvrzenou — pokud ID chybí (starší
      // session bez pending záznamu), objednávka se v admin přehledu prostě
      // neobjeví, ale platba i analytika proběhnou v pořádku.
      const pendingOrderId = session.metadata?.pending_order_id;
      if (pendingOrderId) {
        const confirmed = await confirmPendingOrder(pendingOrderId, session.id);
        if (!confirmed) {
          console.error(`Pending objednávka ${pendingOrderId} nenalezena (asi vypršela).`);
        } else {
          // Odečteme sklad AŽ TEĎ — po skutečném potvrzení platby, ne při
          // pouhém zahájení checkoutu (kdyby zákazník platbu nedokončil).
          // Zákazník už zaplatil, takže objednávku odmítnout nelze — když
          // sklad nestačí, jen ji označíme, ať to admin ručně vyřeší.
          const deduction = await deductStockForItems(confirmed.items);
          if (!deduction.ok) {
            await markStockIssue(confirmed.id, deduction.insufficientFields);
            console.error(
              `Objednávka ${confirmed.id}: nedostatek skladu u ${deduction.insufficientFields.join(", ")} — zaplaceno, nutná ruční kontrola.`,
            );
          }
          await sendOrderConfirmationEmail(confirmed);
        }
      }
    } catch (err) {
      // I kdyby se zápis do analytiky/objednávek nepovedl, Stripe eventu
      // vracíme 200 — platba samotná je v pořádku, jen o ni nebudeme mít záznam.
      console.error("Chyba při zpracování objednávky z webhooku:", err);
    }
  }

  return NextResponse.json({ received: true });
}