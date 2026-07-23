"use client";

// app/admin/DashboardHome.tsx
// Obsah tabu "Přehled" — kompaktní shrnutí toho, co admin nejčastěji chce
// vidět hned po přihlášení: tržby/objednávky za týden, poslední objednávky
// a produkty, kterým dochází sklad. Skládá se z dat, která už jinde v adminu
// existují (žádná nová backend logika, jen jejich souhrn na jednom místě).

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { type Product } from "@/lib/products";
import { ORDER_STATUS_LABELS, type Order } from "@/lib/orders";
import type { AnalyticsSummary } from "@/lib/posthog-query";
import type { Tab } from "./AdminDashboard";
import { BarChart, SectionCard, StatCard, formatMoney } from "./adminWidgets";

const LOW_STOCK_THRESHOLD = 3;
const LOW_STOCK_LIMIT = 8;
const RECENT_ORDERS_LIMIT = 5;

type DashboardHomeProps = {
  products: Product[];
  stock: Record<string, number>;
  canSeeOrders: boolean;
  canSeeAnalytics: boolean;
  canSeeProducts: boolean;
  onNavigate: (tab: Tab) => void;
};

type LowStockEntry = {
  key: string;
  productName: string;
  qty: number;
};

export default function DashboardHome({
  products,
  stock,
  canSeeOrders,
  canSeeAnalytics,
  canSeeProducts,
  onNavigate,
}: DashboardHomeProps) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    if (!canSeeOrders) return;
    let cancelled = false;
    fetch(`/api/admin/orders?limit=${RECENT_ORDERS_LIMIT}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Nepodařilo se načíst objednávky."))))
      .then((json) => {
        if (!cancelled) setOrders(json.orders ?? []);
      })
      .catch(() => {
        if (!cancelled) setOrders([]);
      });
    return () => {
      cancelled = true;
    };
  }, [canSeeOrders]);

  useEffect(() => {
    if (!canSeeAnalytics) return;
    let cancelled = false;
    fetch(`/api/admin/analytics?days=7`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Nepodařilo se načíst statistiky."))))
      .then((json) => {
        if (!cancelled) setSummary(json);
      })
      .catch((err) => {
        if (!cancelled) setSummaryError(err instanceof Error ? err.message : "Chyba při načítání.");
      });
    return () => {
      cancelled = true;
    };
  }, [canSeeAnalytics]);

  const lowStock = useMemo<LowStockEntry[]>(() => {
    if (!canSeeProducts) return [];
    const entries: LowStockEntry[] = [];
    for (const product of products) {
      const qty = stock[product.slug] ?? 0;
      if (qty <= LOW_STOCK_THRESHOLD) {
        entries.push({ key: product.slug, productName: product.name, qty });
      }
    }
    return entries.sort((a, b) => a.qty - b.qty).slice(0, LOW_STOCK_LIMIT);
  }, [products, stock, canSeeProducts]);

  const revenueEntry = summary
    ? Object.entries(summary.revenueByCurrency).filter(([, v]) => v > 0)[0]
    : undefined;

  if (!canSeeOrders && !canSeeAnalytics && !canSeeProducts) {
    return (
      <div className="space-y-2">
        <h3 className="text-base font-bold text-[#0f0f10]">Vítej na administraci Slingr</h3>
        <p className="text-zinc-500 text-xs leading-relaxed max-w-md">
          Zeptej se hlavního účtu na přidělení oprávnění, ať tu vidíš přehled objednávek, tržeb a skladu.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-[#0f0f10]">Vítej na administraci Slingr</h3>
        <p className="text-zinc-500 text-xs leading-relaxed max-w-md mt-0.5">Rychlý přehled za posledních 7 dní.</p>
      </div>

      {(canSeeAnalytics || canSeeProducts) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {canSeeAnalytics && (
            <>
              <StatCard label="Tržby" value={revenueEntry ? formatMoney(revenueEntry[1], revenueEntry[0]) : summary ? "0 Kč" : "…"} hint="za 7 dní" />
              <StatCard label="Objednávky" value={summary ? String(summary.totalOrders) : "…"} hint="za 7 dní" />
              <StatCard label="Návštěvníci" value={summary ? String(summary.totalUniqueVisitors) : "…"} hint="za 7 dní" />
            </>
          )}
          {canSeeProducts && (
            <StatCard label="Nízký sklad" value={String(lowStock.length)} hint={`${LOW_STOCK_LIMIT}+ produktů zobrazeno níže`} />
          )}
        </div>
      )}

      {summaryError && <p className="text-xs text-red-500">{summaryError}</p>}

      <div className="grid md:grid-cols-2 gap-3">
        {canSeeOrders && (
          <SectionCard
            title="Poslední objednávky"
            action={
              <button onClick={() => onNavigate("reservations")} className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-ink hover:underline shrink-0">
                Zobrazit vše <ArrowRight size={11} />
              </button>
            }
          >
            {orders === null ? (
              <p className="text-[11px] text-zinc-400">Načítám…</p>
            ) : orders.length === 0 ? (
              <p className="text-[11px] text-zinc-400">Zatím žádné objednávky.</p>
            ) : (
              <div className="space-y-2.5">
                {orders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <p className="text-[#0f0f10] font-medium truncate">{o.customer.jmeno}</p>
                      <p className="text-zinc-400 text-[10px]">{ORDER_STATUS_LABELS[o.status]}</p>
                    </div>
                    <span className="text-[#0f0f10] font-semibold shrink-0">{formatMoney(o.total, o.currency)}</span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        )}

        {canSeeProducts && (
          <SectionCard
            title="Nízký sklad"
            subtitle={`Varianty s ${LOW_STOCK_THRESHOLD} nebo méně kusy na skladě`}
            action={
              <button onClick={() => onNavigate("products")} className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-ink hover:underline shrink-0">
                Přejít na produkty <ArrowRight size={11} />
              </button>
            }
          >
            {lowStock.length === 0 ? (
              <p className="text-[11px] text-zinc-400">Vše je dostatečně skladem.</p>
            ) : (
              <div className="space-y-2.5">
                {lowStock.map((entry) => (
                  <div key={entry.key} className="flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0 flex items-center gap-1.5">
                      {entry.qty === 0 && <AlertTriangle size={12} className="text-rose-500 shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-[#0f0f10] font-medium truncate">{entry.productName}</p>
                      </div>
                    </div>
                    <span className={`font-semibold shrink-0 ${entry.qty === 0 ? "text-rose-600" : "text-amber-600"}`}>{entry.qty} ks</span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        )}
      </div>

      {canSeeAnalytics && summary && (
        <SectionCard title="Objednávky za posledních 7 dní">
          <BarChart data={summary.orders} color="#ea580c" />
        </SectionCard>
      )}
    </div>
  );
}
