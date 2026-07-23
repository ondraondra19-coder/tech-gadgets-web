"use client";

// app/admin/OrdersAdminList.tsx
// Přehled objednávek (karta, dobírka, bankovní převod) roztříděný podle
// stavu zpracování — ať se doručené objednávky neztrácí v davu a jde se
// jimi proklikat zvlášť.
import { useEffect, useMemo, useState } from "react";
import type { Order, OrderStatus, PaymentStatus } from "@/lib/orders";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/orders";

const STATUS_STYLES: Record<OrderStatus, string> = {
  nova: "bg-slate-50 text-slate-700 border-slate-200",
  zabalena: "bg-amber-50 text-amber-700 border-amber-200",
  odeslana: "bg-blue-50 text-blue-700 border-blue-200",
  na_ceste: "bg-indigo-50 text-indigo-700 border-indigo-200",
  dorucena: "bg-emerald-50 text-emerald-700 border-emerald-200",
  zrusena: "bg-red-50 text-red-700 border-red-200",
};

// Barvy zvýrazněné i na tlačítku záložky, ať jde stav poznat na první pohled.
const TAB_ACTIVE_STYLES: Record<string, string> = {
  aktivni: "bg-[#0f0f10] text-white",
  nova: "bg-slate-700 text-white",
  zabalena: "bg-amber-600 text-white",
  odeslana: "bg-blue-600 text-white",
  na_ceste: "bg-indigo-600 text-white",
  dorucena: "bg-emerald-600 text-white",
  zrusena: "bg-red-600 text-white",
  vse: "bg-zinc-700 text-white",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  karta: "Kartou",
  dobirka: "Dobírka",
  prevod: "Bankovní převod",
};

const SHIPPING_PROVIDER_LABELS: Record<string, string> = {
  zasilkovna: "Zásilkovna",
};

const CURRENCY_SYMBOLS: Record<string, string> = { CZK: "Kč", EUR: "€", USD: "$" };

function formatMoney(amount: number, currency: string): string {
  const rounded = Math.round(amount * 100) / 100;
  return `${rounded.toLocaleString("cs-CZ")} ${CURRENCY_SYMBOLS[currency] ?? currency}`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

type TabId = "aktivni" | OrderStatus | "vse";

const ACTIVE_STATUSES: OrderStatus[] = ["nova", "zabalena", "odeslana", "na_ceste"];

const TABS: { id: TabId; label: string }[] = [
  { id: "aktivni", label: "Aktivní" },
  { id: "nova", label: "Nová" },
  { id: "zabalena", label: "Zabalená" },
  { id: "odeslana", label: "Odeslaná" },
  { id: "na_ceste", label: "Na cestě" },
  { id: "dorucena", label: "Doručené" },
  { id: "zrusena", label: "Zrušené" },
  { id: "vse", label: "Vše" },
];

type OrdersAdminListProps = {
  initialQuery?: string;
  initialExpandId?: string;
};

export default function OrdersAdminList({ initialQuery, initialExpandId }: OrdersAdminListProps = {}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(initialExpandId ?? null);
  const [searchQuery, setSearchQuery] = useState(initialQuery ?? "");
  // initialExpandId může mířit na objednávku mimo aktuálně vybranou záložku stavu
  // (např. doručenou), proto v tom případě startujeme rovnou na "Vše", ať je vidět.
  const [tab, setTab] = useState<TabId>(initialExpandId ? "vse" : "aktivni");
  const PAGE = 100;

  async function load(offset: number, append: boolean) {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders?limit=${PAGE}&offset=${offset}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Nepodařilo se načíst objednávky.");
      const data = await res.json();
      setOrders((prev) => (append ? [...prev, ...data.orders] : data.orders));
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba při načítání.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    load(0, false);
  }, []);

  async function handleStatusChange(order: Order, status: OrderStatus) {
    setBusyId(order.id);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Změna stavu se nezdařila.");
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Změna stavu se nezdařila.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleMarkPaid(order: Order) {
    setBusyId(order.id);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: "zaplaceno" as PaymentStatus }),
      });
      if (!res.ok) throw new Error("Změna se nezdařila.");
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, paymentStatus: "zaplaceno" } : o)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Změna se nezdařila.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleCancelOrder(order: Order) {
    if (!confirm(`Opravdu zrušit objednávku ${order.customer.jmeno || order.id}? Odečtené kusy se vrátí zpět na sklad.`)) return;
    setBusyId(order.id);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "zrusena" as OrderStatus }),
      });
      if (!res.ok) throw new Error("Zrušení se nezdařilo.");
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: "zrusena" } : o)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Zrušení se nezdařilo.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreateShipment(order: Order) {
    setBusyId(order.id);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/shipment`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Vytvoření zásilky se nezdařilo.");
      setOrders((prev) => prev.map((o) => (o.id === order.id ? data.order : o)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Vytvoření zásilky se nezdařilo.");
    } finally {
      setBusyId(null);
    }
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { aktivni: 0, vse: orders.length, nova: 0, zabalena: 0, odeslana: 0, na_ceste: 0, dorucena: 0 };
    for (const o of orders) {
      c[o.status] = (c[o.status] ?? 0) + 1;
      if (ACTIVE_STATUSES.includes(o.status)) c.aktivni += 1;
    }
    return c;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const byTab =
      tab === "vse" ? orders
      : tab === "aktivni" ? orders.filter((o) => ACTIVE_STATUSES.includes(o.status))
      : orders.filter((o) => o.status === tab);

    const q = searchQuery.trim().toLowerCase();
    if (!q) return byTab;
    return byTab.filter(
      (o) =>
        o.customer.jmeno.toLowerCase().includes(q) ||
        o.customer.email.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
    );
  }, [orders, tab, searchQuery]);

  if (loading) return <p className="text-xs text-zinc-400">Načítám objednávky…</p>;
  if (error) return <p className="text-xs text-red-500">{error}</p>;

  if (orders.length === 0) {
    return (
      <p className="text-xs text-zinc-400">
        Zatím žádné objednávky. Jakmile někdo dokončí nákup (kartou, na dobírku nebo převodem), objeví se tady.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Hledání podle jména, e-mailu nebo čísla objednávky */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Hledat podle jména, e-mailu nebo čísla objednávky…"
        className="w-full sm:w-80 text-xs border border-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary/50"
      />

      {/* Záložky podle stavu */}
      <div className="flex gap-1.5 flex-wrap">
        {TABS.map((t) => {
          const isActive = tab === t.id;
          const count = counts[t.id] ?? 0;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                isActive
                  ? `${TAB_ACTIVE_STYLES[t.id]} border-transparent`
                  : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
              }`}
            >
              {t.label} <span className={isActive ? "opacity-80" : "text-zinc-400"}>({count})</span>
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-zinc-400">
        Zobrazeno {filteredOrders.length} z {orders.length} načtených ({total} celkem), nejnovější první.
      </p>

      {filteredOrders.length === 0 ? (
        <p className="text-xs text-zinc-400 py-6 text-center">V téhle záložce zatím nic není.</p>
      ) : (
        filteredOrders.map((order) => {
          const isExpanded = expandedId === order.id;
          return (
            <div key={order.id} className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedId(isExpanded ? null : order.id)}
                className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-zinc-50 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-[#0f0f10]">{order.customer.jmeno || "Bez jména"}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${STATUS_STYLES[order.status]}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                    {order.paymentStatus === "ceka_na_platbu" && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md border bg-red-50 text-red-700 border-red-200">
                        {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    {formatDate(order.createdAt)} · {PAYMENT_METHOD_LABELS[order.paymentMethod]} · {order.items.length} položek
                  </p>
                </div>
                <div className="text-sm font-bold text-[#0f0f10] shrink-0">{formatMoney(order.total, order.currency)}</div>
              </button>

              {isExpanded && (
                <div className="border-t border-zinc-100 p-4 space-y-4 bg-zinc-50/50">
                  {order.stockIssue && (
                    <div className="text-xs rounded-lg border border-red-300 bg-red-50 text-red-800 px-3 py-2">
                      <span className="font-semibold">⚠ Při vytvoření objednávky nebyl dostatek skladu u:</span>{" "}
                      {order.stockIssue.insufficientFields.join(", ")}. Zkontrolujte prosím ručně.
                    </div>
                  )}

                  {/* Kontakt a doručení */}
                  <div className="grid sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="font-semibold text-[#0f0f10] mb-1">Kontakt</p>
                      <p className="text-zinc-600">{order.customer.email}</p>
                      <p className="text-zinc-600">{order.customer.telefon}</p>
                      {order.customer.firma && <p className="text-zinc-600">{order.customer.firma} {order.customer.ic ? `· IČO ${order.customer.ic}` : ""}</p>}
                    </div>
                    <div>
                      <p className="font-semibold text-[#0f0f10] mb-1">Doručovací adresa</p>
                      <p className="text-zinc-600">
                        {(order.deliveryAddress ?? order.address).uliceCp}, {(order.deliveryAddress ?? order.address).mesto} {(order.deliveryAddress ?? order.address).psc}
                      </p>
                      <p className="text-zinc-500">{order.shippingName}{order.zboxId ? ` — výdejní místo ${order.zboxId}` : ""}</p>
                      {order.shipment ? (
                        <p className="text-emerald-700 mt-1">
                          Zásilka vytvořena — tracking {order.shipment.trackingNumber}
                          {order.shipment.labelUrl && (
                            <> · <a href={order.shipment.labelUrl} target="_blank" rel="noreferrer" className="underline">štítek</a></>
                          )}
                        </p>
                      ) : order.shippingProviderId ? (
                        <p className="text-zinc-400 mt-1">Zásilka u {SHIPPING_PROVIDER_LABELS[order.shippingProviderId] ?? order.shippingProviderId} zatím nevytvořena</p>
                      ) : null}
                    </div>
                  </div>

                  {/* Položky */}
                  <div>
                    <p className="font-semibold text-[#0f0f10] mb-1 text-xs">Položky</p>
                    <div className="space-y-1">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-xs text-zinc-600">
                          <span>{item.quantity}× {item.name}</span>
                          <span className="tabular-nums">{formatMoney(item.unitPrice * item.quantity, order.currency)}</span>
                        </div>
                      ))}
                    </div>
                    {order.poznamka && (
                      <p className="text-[11px] text-zinc-500 mt-2 italic">Poznámka: {order.poznamka}</p>
                    )}
                  </div>

                  {/* Akce */}
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <select
                      value={order.status}
                      disabled={busyId === order.id}
                      onChange={(e) => handleStatusChange(order, e.target.value as OrderStatus)}
                      className="text-xs border border-zinc-300 rounded-lg px-2 py-1.5 bg-white disabled:opacity-50"
                    >
                      {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((s) => (
                        <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
                      ))}
                    </select>

                    {order.paymentMethod === "prevod" && order.paymentStatus === "ceka_na_platbu" && (
                      <button
                        onClick={() => handleMarkPaid(order)}
                        disabled={busyId === order.id}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                      >
                        Označit jako zaplaceno
                      </button>
                    )}

                    {(order.status === "nova" || order.status === "zabalena") && (
                      <button
                        onClick={() => handleCancelOrder(order)}
                        disabled={busyId === order.id}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white text-red-700 border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
                      >
                        Zrušit objednávku
                      </button>
                    )}

                    {order.shippingProviderId && !order.shipment && (
                      <button
                        onClick={() => handleCreateShipment(order)}
                        disabled={busyId === order.id}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-zinc-800 text-white hover:bg-zinc-900 disabled:opacity-50 transition-colors"
                      >
                        Vytvořit zásilku ({SHIPPING_PROVIDER_LABELS[order.shippingProviderId] ?? order.shippingProviderId})
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}

      {orders.length < total && (
        <button
          onClick={() => load(orders.length, true)}
          disabled={loadingMore}
          className="w-full text-xs font-semibold py-2.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
        >
          {loadingMore ? "Načítám…" : `Načíst dalších ${Math.min(PAGE, total - orders.length)}`}
        </button>
      )}
    </div>
  );
}