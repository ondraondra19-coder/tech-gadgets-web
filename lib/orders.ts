// lib/orders.ts
// Ukládání objednávek do Upstash Redis — pro VŠECHNY způsoby platby
// (karta, dobírka, bankovní převod). Dřív se karta platba nikam neukládala
// (jen do Stripe) a dobírka/převod se neukládaly vůbec — zákazník je viděl
// jen ve svém prohlížeči. Teď má admin přehled o všem na jednom místě.
//
// ── Tok pro platbu kartou ──────────────────────────────────────────────────
// 1. /api/checkout uloží "pending" objednávku (createPendingOrder) a pošle
//    její ID do Stripe metadata.
// 2. Stripe webhook po úspěšné platbě zavolá confirmPendingOrder — teprve
//    TEHDY se objednávka objeví v adminu (= jen opravdu zaplacené).
// 3. Pending objednávky mají expiraci 24 h (kdyby zákazník platbu nedokončil).
//
// ── Tok pro dobírku / bankovní převod ───────────────────────────────────────
// Žádný Stripe krok — objednávka se vytvoří rovnou (createOrderDirect) se
// stavem "nova", protože se ke zpracování nemusí čekat na potvrzení platby.

import { randomBytes } from "crypto";
import { getRedis } from "./redis";
import { orderIdToVariableSymbol } from "./qrPlatba";

export type OrderStatus = "nova" | "zabalena" | "odeslana" | "na_ceste" | "dorucena" | "zrusena";
export type PaymentMethod = "karta" | "dobirka" | "prevod";
export type PaymentStatus = "zaplaceno" | "ceka_na_platbu" | "zaplatit_pri_prevzeti";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  nova: "Nová",
  zabalena: "Zabalená",
  odeslana: "Odeslaná",
  na_ceste: "Na cestě",
  dorucena: "Doručená",
  zrusena: "Zrušená",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  zaplaceno: "Zaplaceno",
  ceka_na_platbu: "Čeká na platbu",
  zaplatit_pri_prevzeti: "Platba při převzetí",
};

export type AddressBlock = {
  mesto: string;
  uliceCp: string;
  psc: string;
  zeme: string;
};

export type OrderItem = {
  slug: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

export type OrderInput = {
  currency: string;
  paymentMethod: PaymentMethod;
  customer: { jmeno: string; email: string; telefon: string; firma?: string; ic?: string; dic?: string };
  address: AddressBlock;
  deliveryAddress?: AddressBlock | null;
  poznamka?: string;
  shippingName: string;
  shippingProviderId?: ShippingProviderId | null;
  shippingPrice: number;
  isDobirka: boolean;
  dobirkaFee?: number;
  discountCode?: string | null;
  discountLabel?: string | null;
  discountAmountCZK?: number;
  items: OrderItem[];
  subtotal: number;
  total: number;
  zboxId?: string | null;
};

export type ShippingProviderId = "zasilkovna";

export type ShipmentInfo = {
  provider: ShippingProviderId;
  carrierShipmentId: string;
  trackingNumber: string;
  labelUrl?: string;
  createdAt: number;
};

export type Order = OrderInput & {
  id: string;
  createdAt: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  stripeSessionId?: string;
  shipment?: ShipmentInfo;
  // Nastaveno, když se při potvrzení (zaplacené) objednávky nepodařilo odečíst
  // sklad, protože nestačil — platba proběhla, takže objednávku nelze odmítnout,
  // ale admin to musí ručně vyřešit. Viz Stripe webhook.
  stockIssue?: { insufficientFields: string[]; notedAt: number };
};

const PENDING_TTL_SECONDS = 24 * 60 * 60; // 24 h — kdyby zákazník platbu nedokončil

function generateId(): string {
  return `obj_${Date.now().toString(36)}_${randomBytes(8).toString("hex")}`;
}

function initialPaymentStatus(method: PaymentMethod): PaymentStatus {
  if (method === "karta") return "zaplaceno"; // vzniká až po potvrzení Stripe webhookem
  if (method === "dobirka") return "zaplatit_pri_prevzeti";
  return "ceka_na_platbu"; // prevod
}

// ── Karta: 1) pending při zahájení checkoutu ────────────────────────────────

export async function createPendingOrder(input: OrderInput): Promise<string> {
  const redis = getRedis();
  const id = generateId();
  await redis.set(`orders:pending:${id}`, JSON.stringify(input), { ex: PENDING_TTL_SECONDS });
  return id;
}

/** Přečte pending objednávku BEZ jejího smazání/povýšení — používá to
 *  děkovná stránka, aby zákazníkovi ukázala správná data ihned po platbě,
 *  i kdyby Stripe webhook ještě nedoběhl (nebo vůbec nebyl nastavený). */
export async function getPendingOrder(id: string): Promise<OrderInput | null> {
  const redis = getRedis();
  const raw = await redis.get<string | OrderInput>(`orders:pending:${id}`);
  if (!raw) return null;
  return typeof raw === "string" ? (JSON.parse(raw) as OrderInput) : raw;
}

// ── Karta: 2) potvrzení z webhooku po úspěšné platbě ────────────────────────

export async function confirmPendingOrder(id: string, stripeSessionId: string): Promise<Order | null> {
  const redis = getRedis();
  const raw = await redis.get<string | OrderInput>(`orders:pending:${id}`);
  if (!raw) return null;

  const input = (typeof raw === "string" ? JSON.parse(raw) : raw) as OrderInput;
  const order: Order = {
    ...input,
    id,
    createdAt: Date.now(),
    status: "nova",
    paymentStatus: "zaplaceno",
    stripeSessionId,
  };

  const pipeline = redis.pipeline();
  pipeline.set(`orders:data:${id}`, JSON.stringify(order));
  pipeline.zadd("orders:index", { score: order.createdAt, member: id });
  pipeline.del(`orders:pending:${id}`);
  await pipeline.exec();

  return order;
}

// ── Dobírka / převod: vytvoření rovnou ──────────────────────────────────────

export async function createOrderDirect(input: OrderInput): Promise<Order> {
  const redis = getRedis();
  const id = generateId();
  const order: Order = {
    ...input,
    id,
    createdAt: Date.now(),
    status: "nova",
    paymentStatus: initialPaymentStatus(input.paymentMethod),
  };

  const pipeline = redis.pipeline();
  pipeline.set(`orders:data:${id}`, JSON.stringify(order));
  pipeline.zadd("orders:index", { score: order.createdAt, member: id });
  await pipeline.exec();

  return order;
}

// ── Čtení / správa pro admin ────────────────────────────────────────────────

export async function listOrders(limit: number = 50, offset: number = 0): Promise<{ orders: Order[]; total: number }> {
  const redis = getRedis();
  const total = await redis.zcard("orders:index");
  if (total === 0) return { orders: [], total: 0 };

  // Nejnovější první.
  const ids = await redis.zrange<string[]>("orders:index", offset, offset + limit - 1, { rev: true });
  if (ids.length === 0) return { orders: [], total };

  const pipeline = redis.pipeline();
  for (const id of ids) pipeline.get(`orders:data:${id}`);
  const results = (await pipeline.exec()) as (string | Order | null)[];

  const orders = results
    .map((r) => (typeof r === "string" ? (JSON.parse(r) as Order) : (r as Order | null)))
    .filter((o): o is Order => o != null);

  return { orders, total };
}

/** Ověří, že zadané číslo objednávky patří nějaké SKUTEČNÉ objednávce.
 *  Číslo, které zákazník zná z potvrzení a e-mailů, je variabilní symbol
 *  (viz orderIdToVariableSymbol) — porovnáváme proti němu, aby přes formulář
 *  na /reklamace šlo vrátit jen reálně vytvořenou objednávku, ne libovolný
 *  vymyšlený řetězec. */
export async function orderNumberExists(orderNumber: string): Promise<boolean> {
  const target = orderIdToVariableSymbol(orderNumber);
  if (target === "0") return false; // žádné číslice → nic k porovnání
  const redis = getRedis();
  const ids = await redis.zrange<string[]>("orders:index", 0, -1);
  if (!ids || ids.length === 0) return false;
  return ids.some((id) => orderIdToVariableSymbol(id) === target);
}

export async function getOrder(id: string): Promise<Order | null> {
  const redis = getRedis();
  const raw = await redis.get<string | Order>(`orders:data:${id}`);
  if (!raw) return null;
  return typeof raw === "string" ? (JSON.parse(raw) as Order) : raw;
}

/** Najde objednávku podle čísla, které zná zákazník (variabilní symbol).
 *  Používá admin vrácení, aby k reklamaci ukázal položky a částku k vrácení. */
export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  const target = orderIdToVariableSymbol(orderNumber);
  if (target === "0") return null;
  const redis = getRedis();
  const ids = await redis.zrange<string[]>("orders:index", 0, -1);
  if (!ids || ids.length === 0) return null;
  const match = ids.find((id) => orderIdToVariableSymbol(id) === target);
  return match ? getOrder(match) : null;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order | null> {
  const order = await getOrder(id);
  if (!order) return null;
  const updated: Order = { ...order, status };
  await getRedis().set(`orders:data:${id}`, JSON.stringify(updated));
  return updated;
}

export async function updatePaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<Order | null> {
  const order = await getOrder(id);
  if (!order) return null;
  const updated: Order = { ...order, paymentStatus };
  await getRedis().set(`orders:data:${id}`, JSON.stringify(updated));
  return updated;
}

export async function markStockIssue(id: string, insufficientFields: string[]): Promise<Order | null> {
  const order = await getOrder(id);
  if (!order) return null;
  const updated: Order = { ...order, stockIssue: { insufficientFields, notedAt: Date.now() } };
  await getRedis().set(`orders:data:${id}`, JSON.stringify(updated));
  return updated;
}

export async function setOrderShipment(id: string, shipment: ShipmentInfo): Promise<Order | null> {
  const order = await getOrder(id);
  if (!order) return null;
  const updated: Order = { ...order, shipment };
  await getRedis().set(`orders:data:${id}`, JSON.stringify(updated));
  return updated;
}