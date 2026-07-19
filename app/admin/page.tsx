import { redirect } from "next/navigation";
import { getAllReviews } from "@/lib/reviews";
import { getAllAccounts, toPublicAccount } from "@/lib/accounts";
import { getCurrentSession } from "@/lib/session";
import { getProductsWithPriceOverrides } from "@/lib/priceOverrides";
import { getProductDiscounts } from "@/lib/productDiscounts";
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
  // rovnou vidí aktuální (ne jen katalogovou) cenu. Slevy se posílají zvlášť
  // jako mapa (klíč → procento), ať editor ukáže původní cenu i zlevněnou.
  const products = await getProductsWithPriceOverrides();
  const productDiscounts = await getProductDiscounts();

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
      productDiscounts={productDiscounts}
      initialStock={serializedStock}
    />
  );
}