"use client";

import { useState } from "react";
import type { Discount, DiscountType } from "@/lib/discounts";
import { formatMoney } from "./adminWidgets";

type DiscountsAdminPanelProps = {
  discounts: Discount[];
  onChange: (discounts: Discount[]) => void;
};

function isExpired(discount: Discount): boolean {
  if (!discount.expiresAt) return false;
  return Date.now() > new Date(`${discount.expiresAt}T23:59:59`).getTime();
}

export default function DiscountsAdminPanel({ discounts, onChange }: DiscountsAdminPanelProps) {
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [type, setType] = useState<DiscountType>("percent");
  const [value, setValue] = useState("");
  const [minOrderCZK, setMinOrderCZK] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);

    const res = await fetch("/api/admin/discounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        label,
        type,
        value: Number(value),
        minOrderCZK: minOrderCZK ? Number(minOrderCZK) : undefined,
        expiresAt: expiresAt || undefined,
      }),
    });

    const data = await res.json().catch(() => ({}));
    setCreating(false);

    if (!res.ok) {
      setError(data.error ?? "Nepodařilo se vytvořit slevový kód.");
      return;
    }

    onChange([...discounts, data.discount]);
    setCode("");
    setLabel("");
    setType("percent");
    setValue("");
    setMinOrderCZK("");
    setExpiresAt("");
  }

  async function handleDelete(id: string) {
    if (!confirm("Opravdu smazat tento slevový kód?")) return;

    setBusyId(id);
    setError(null);

    const res = await fetch(`/api/admin/discounts?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    setBusyId(null);

    if (!res.ok) {
      setError("Smazání se nezdařilo.");
      return;
    }

    onChange(discounts.filter((d) => d.id !== id));
  }

  return (
    <div className="space-y-8">
      {error && <p className="text-sm text-primary">{error}</p>}

      {/* Vytvoření nového kódu */}
      <form onSubmit={handleCreate} className="border border-[#e5e7eb] rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-[#0f0f10]">Vytvořit nový slevový kód</h3>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Kód (např. LETO2026)"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
            className="flex-1 border border-[#e5e7eb] rounded-lg px-3 py-2 text-xs text-[#0f0f10] focus:outline-none focus:border-primary/50 notranslate"
            translate="no"
          />
          <input
            type="text"
            placeholder="Popisek pro zákazníka"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
            className="flex-1 border border-[#e5e7eb] rounded-lg px-3 py-2 text-xs text-[#0f0f10] focus:outline-none focus:border-primary/50"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as DiscountType)}
            className="flex-1 border border-[#e5e7eb] rounded-lg px-3 py-2 text-xs text-[#0f0f10] focus:outline-none focus:border-primary/50 bg-white"
          >
            <option value="percent">Procentuální (%)</option>
            <option value="fixed">Pevná částka (Kč)</option>
          </select>
          <input
            type="number"
            placeholder={type === "percent" ? "Hodnota v % (např. 10)" : "Hodnota v Kč (např. 50)"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
            min={0}
            max={type === "percent" ? 100 : undefined}
            step="any"
            className="flex-1 border border-[#e5e7eb] rounded-lg px-3 py-2 text-xs text-[#0f0f10] focus:outline-none focus:border-primary/50"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-[10px] text-zinc-500 mb-1">Minimální hodnota objednávky (Kč, volitelné)</label>
            <input
              type="number"
              placeholder="např. 500"
              value={minOrderCZK}
              onChange={(e) => setMinOrderCZK(e.target.value)}
              min={0}
              className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-xs text-[#0f0f10] focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] text-zinc-500 mb-1">Platnost do (volitelné)</label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-xs text-[#0f0f10] focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={creating}
          className="bg-[#1c1c1c] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-black disabled:opacity-50 transition-colors"
        >
          {creating ? "Vytvářím…" : "Vytvořit kód"}
        </button>
      </form>

      {/* Existující kódy */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#0f0f10]">
          Existující kódy <span className="text-zinc-400 font-normal">({discounts.length})</span>
        </h3>

        {discounts.length === 0 && (
          <p className="text-sm text-zinc-500">Zatím žádné slevové kódy.</p>
        )}

        {discounts.map((discount) => {
          const expired = isExpired(discount);
          const disabled = discount.active === false;
          const scoped = Array.isArray(discount.active);

          return (
            <div key={discount.id} className="border border-[#e5e7eb] rounded-xl p-4">
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-[#0f0f10] notranslate" translate="no">{discount.code}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600">
                    {discount.type === "percent" ? `${discount.value} %` : formatMoney(discount.value, "CZK")}
                  </span>
                  {(disabled || expired) && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-primary">
                      {expired ? "Vypršel" : "Vypnutý"}
                    </span>
                  )}
                  {scoped && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
                      Jen vybrané produkty
                    </span>
                  )}
                </div>
                <button
                  onClick={() => discount.id && handleDelete(discount.id)}
                  disabled={busyId === discount.id}
                  className="text-xs font-semibold text-primary hover:text-primary/80 disabled:opacity-50 shrink-0"
                >
                  Smazat
                </button>
              </div>

              <p className="text-xs text-zinc-500">{discount.label}</p>

              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-zinc-400">
                {discount.minOrderCZK && <span>Min. objednávka: {formatMoney(discount.minOrderCZK, "CZK")}</span>}
                {discount.expiresAt && <span>Platnost do: {discount.expiresAt}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
