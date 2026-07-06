import { redirect } from "next/navigation";
import { getAllReviews } from "@/lib/reviews";
import { getAllAccounts, toPublicAccount } from "@/lib/accounts";
import { getCurrentSession } from "@/lib/session";
import { products } from "@/lib/products";
import { getStockMap } from "@/lib/stock";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic"; // vždy čerstvá data, žádné cachování

export default async function AdminPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/admin/login");
  }

  const canSeeReviews = session.isMain || session.permissions.includes("reviews");
  const reviews = canSeeReviews ? await getAllReviews() : [];
  const accounts = session.isMain ? (await getAllAccounts()).map(toPublicAccount) : [];

  // Načtení real-time skladu z Google Sheets a konverze Mapy na čistý JSON objekt
  const stockMap = await getStockMap();
  const serializedStock = Object.fromEntries(stockMap.entries());

  return (
    <AdminDashboard 
      session={session} 
      initialReviews={reviews} 
      initialAccounts={accounts} 
      products={products}
      initialStock={serializedStock}
    />
  );
}