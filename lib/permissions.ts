// lib/permissions.ts
// Centrální seznam oprávnění, která hlavní účet může udělit dílčím účtům.
// "Správa účtů" mezi nimi není — ta je natvrdo vyhrazená jen hlavnímu účtu.
// "dashboard" (Přehled) tu také není — ten vidí každý přihlášený účet vždy.

export const GRANTABLE_PERMISSIONS = [
  "reservations",
  "products",
  "reviews",
  "messages",
  "settings",
  "analytics",
  "discounts",
] as const;

export type Permission = (typeof GRANTABLE_PERMISSIONS)[number];

export function isValidPermission(value: unknown): value is Permission {
  return typeof value === "string" && (GRANTABLE_PERMISSIONS as readonly string[]).includes(value);
}