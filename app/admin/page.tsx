import { redirect } from "next/navigation";
import { getAllReviews } from "@/lib/reviews";
import { getAllAccounts, toPublicAccount } from "@/lib/accounts";
import { getCurrentSession } from "@/lib/session";
import { getProductsWithPriceOverrides } from "@/lib/priceOverrides";
import { getStockMap } from "@/lib/stock";
import { getAllDiscounts } from "@/lib/discountsStore";
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

  const canSeeDiscounts = session.isMain || session.permissions.includes("discounts");
  const discounts = canSeeDiscounts ? await getAllDiscounts() : [];

  // Katalog s aplikovanými přepisy cen z admina — ProductsAdminList tak
  // rovnou vidí aktuální (ne jen katalogovou) cenu.
  const products = await getProductsWithPriceOverrides();

  // Načtení real-time skladu z Google Sheets a konverze Mapy na čistý JSON objekt
  const stockMap = await getStockMap();
  const serializedStock = Object.fromEntries(stockMap.entries());

  return (
    <AdminDashboard
      session={session}
      initialReviews={reviews}
      initialAccounts={accounts}
      initialDiscounts={discounts}
      products={products}
      initialStock={serializedStock}
    />
  );
}