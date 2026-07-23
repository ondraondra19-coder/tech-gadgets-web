// lib/useStockPolling.ts
"use client";

import { useState, useEffect, useCallback } from "react";

const POLL_INTERVAL_MS = 6000;

export function useStockPolling(slug: string) {
  const [stock, setStock] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStock = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await fetch(
        `/api/stock?slug=${encodeURIComponent(slug)}`,
        { cache: "no-store" }
      );
      if (!res.ok) return;
      const json = await res.json();
      setStock(typeof json.stock === "number" ? json.stock : 0);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    // Iniciální načtení skladu; setStock běží až po fetchi (async).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStock();
    const interval = setInterval(fetchStock, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchStock]);

  return { stock, loading, refetch: fetchStock };
}