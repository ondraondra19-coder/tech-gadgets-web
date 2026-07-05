import { getAllReviews } from "@/lib/reviews";
import ReviewsAdminList from "./ReviewsAdminList";

export const dynamic = "force-dynamic"; // vždy čerstvý seznam, žádné cachování

export default async function AdminReviewsPage() {
  const reviews = await getAllReviews();

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-neutral-900">
            Recenze <span className="text-neutral-400 font-normal">({reviews.length})</span>
          </h1>
          <a href="/admin" className="text-sm text-neutral-500 hover:text-neutral-900 underline">
            ← Zpět do adminu
          </a>
        </div>
        <ReviewsAdminList initialReviews={reviews} />
      </div>
    </main>
  );
}