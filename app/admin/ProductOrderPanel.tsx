"use client";

// Přetahovací seznam pro doporučené pořadí produktů. Pořadí se ukládá do Redisu
// (viz lib/productOrder.ts) a promítne se na homepage i na stránkách kategorií.
// Drag & drop je postavené na nativních HTML5 událostech — žádná knihovna navíc.
import { useEffect, useState } from "react";
import Image from "next/image";
import { GripVertical } from "lucide-react";
import type { Product } from "@/lib/products";
import { sortProductsByOrder } from "@/lib/productOrder";

export default function ProductOrderPanel({ products }: { products: Product[] }) {
  const [ordered, setOrdered] = useState<Product[]>(products);
  const [savedSlugs, setSavedSlugs] = useState<string[]>(products.map((p) => p.slug));
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Načti uložené pořadí a seřaď podle něj (produkty bez pořadí jdou na konec).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/product-order", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error())))
      .then((json) => {
        if (cancelled) return;
        const sorted = sortProductsByOrder(products, json.order ?? {});
        setOrdered(sorted);
        setSavedSlugs(sorted.map((p) => p.slug));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [products]);

  const currentSlugs = ordered.map((p) => p.slug);
  const changed = currentSlugs.join("|") !== savedSlugs.join("|");

  // Živé přeskládání během tažení — jakmile kurzor vjede na jiný řádek, posuneme
  // tažený produkt na jeho místo.
  function handleDragEnter(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return;
    setOrdered((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    setDragIndex(targetIndex);
  }

  async function save() {
    if (!changed || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/product-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: currentSlugs }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Uložení se nezdařilo.");
      }
      setSavedSlugs(currentSlugs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Uložení se nezdařilo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-zinc-500 leading-relaxed">
        Přetáhni produkty do pořadí, v jakém je chceš zákazníkům ukazovat. Toto
        pořadí platí na homepage i na stránkách kategorií. Produkty nahoře se
        prodávají první.
      </p>

      <div className="rounded-xl border border-[#e5e7eb] overflow-hidden divide-y divide-[#e5e7eb]/70">
        {ordered.map((product, i) => (
          <div
            key={product.slug}
            draggable
            onDragStart={() => setDragIndex(i)}
            onDragEnter={() => handleDragEnter(i)}
            onDragOver={(e) => e.preventDefault()}
            onDragEnd={() => setDragIndex(null)}
            className={`flex items-center gap-3 px-3 py-2 bg-white cursor-grab active:cursor-grabbing transition-colors ${
              dragIndex === i ? "bg-zinc-100 opacity-60" : "hover:bg-[#fcfbf9]"
            }`}
          >
            <GripVertical size={15} className="text-zinc-300 shrink-0" />
            <span className="text-[10px] font-mono font-bold text-zinc-400 w-6 tabular-nums shrink-0">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="w-8 h-8 rounded-md bg-[#f1f1f3] border border-[#e5e7eb] overflow-hidden relative shrink-0">
              <Image src={product.img} alt="" fill className="object-cover" unoptimized />
            </div>
            <span className="text-xs font-semibold text-[#0f0f10] truncate">{product.name}</span>
            <span className="ml-auto text-[10px] font-mono text-zinc-400 truncate hidden sm:block">
              {product.slug}
            </span>
          </div>
        ))}
      </div>

      {changed && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="px-4 py-2 rounded-full text-[11px] font-bold bg-[#1c1c1c] text-white hover:bg-black disabled:opacity-60 transition-all"
          >
            {saving ? "Ukládám…" : "Uložit pořadí"}
          </button>
          {error && <span className="text-[11px] text-rose-600">{error}</span>}
        </div>
      )}
    </div>
  );
}
