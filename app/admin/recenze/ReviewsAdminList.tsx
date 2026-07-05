"use client";

import { useState } from "react";
import type { Review } from "@/lib/reviews";
import { parseUserAgent } from "@/lib/parseUserAgent";

export default function ReviewsAdminList({ initialReviews }: { initialReviews: Review[] }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Opravdu smazat tuto recenzi?")) return;

    setDeletingId(id);
    setError(null);

    const res = await fetch(`/api/admin/reviews?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    setDeletingId(null);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Smazání se nezdařilo.");
      return;
    }

    setReviews((prev) => prev.filter((r) => r.id !== id));
  }

  if (reviews.length === 0) {
    return <p className="text-neutral-500">Žádné recenze.</p>;
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {reviews.map((review) => {
        const location = [review.city, review.country].filter(Boolean).join(", ");

        return (
          <div
            key={review.id}
            className="bg-white border border-neutral-200 rounded-xl p-4 flex justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-medium text-neutral-900">{review.name}</span>
                <span className="text-amber-500 text-sm">
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                </span>
                <span className="text-xs text-neutral-400">
                  {new Date(review.date).toLocaleDateString("cs-CZ")}
                </span>
              </div>

              <p className="text-neutral-700 text-sm whitespace-pre-wrap mb-2">{review.text}</p>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
                {review.email && (
                  <a href={`mailto:${review.email}`} className="hover:text-neutral-900 hover:underline">
                    ✉ {review.email}
                  </a>
                )}
                {review.ip && <span>🌐 {review.ip}</span>}
                {location && <span>📍 {location}</span>}
                <span>💻 {parseUserAgent(review.userAgent)}</span>
              </div>
            </div>

            <button
              onClick={() => handleDelete(review.id)}
              disabled={deletingId === review.id}
              className="shrink-0 text-sm text-red-600 hover:text-red-800 disabled:opacity-50 self-start"
            >
              {deletingId === review.id ? "Mažu…" : "Smazat"}
            </button>
          </div>
        );
      })}
    </div>
  );
}