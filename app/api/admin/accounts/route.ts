// app/api/admin/accounts/route.ts
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/session";
import {
  getAllAccounts,
  addAccount,
  updateAccountPermissions,
  deleteAccount,
  findAccountByName,
  toPublicAccount,
} from "@/lib/accounts";
import { isValidPermission, type Permission } from "@/lib/permissions";
import { MAIN_ACCOUNT_NAME } from "@/lib/adminAuth";

const MAX_NAME_LENGTH = 80;
const MIN_PASSWORD_LENGTH = 6;

// Správa účtů je vyhrazená jen hlavnímu účtu — není to grantovatelné oprávnění.
async function requireMainAccount() {
  const session = await getCurrentSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Neautorizováno." }, { status: 401 }) };
  }
  if (!session.isMain) {
    return {
      error: NextResponse.json(
        { error: "Správu účtů má k dispozici jen hlavní účet." },
        { status: 403 }
      ),
    };
  }
  return { session };
}

// GET — seznam všech dílčích účtů
export async function GET() {
  const { error } = await requireMainAccount();
  if (error) return error;

  const accounts = await getAllAccounts();
  return NextResponse.json({ accounts: accounts.map(toPublicAccount) });
}

// POST — vytvoří nový dílčí účet
export async function POST(req: Request) {
  const { error } = await requireMainAccount();
  if (error) return error;

  try {
    const body = await req.json().catch(() => null);
    const name = body?.name;
    const password = body?.password;
    const permissionsInput = body?.permissions;

    if (typeof name !== "string" || !name.trim() || name.trim().length > MAX_NAME_LENGTH) {
      return NextResponse.json({ error: "Neplatné jméno." }, { status: 400 });
    }
    if (name.trim().toLowerCase() === MAIN_ACCOUNT_NAME.toLowerCase()) {
      return NextResponse.json(
        { error: "Toto jméno je vyhrazené pro hlavní účet." },
        { status: 400 }
      );
    }
    if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Heslo musí mít alespoň ${MIN_PASSWORD_LENGTH} znaků.` },
        { status: 400 }
      );
    }
    if (!Array.isArray(permissionsInput) || !permissionsInput.every(isValidPermission)) {
      return NextResponse.json({ error: "Neplatná oprávnění." }, { status: 400 });
    }

    const existing = await findAccountByName(name);
    if (existing) {
      return NextResponse.json({ error: "Účet s tímto jménem už existuje." }, { status: 409 });
    }

    const account = await addAccount({
      name,
      password,
      permissions: permissionsInput as Permission[],
    });

    return NextResponse.json({ account: toPublicAccount(account) });
  } catch (err) {
    console.error("Accounts POST error:", err);
    return NextResponse.json({ error: "Nepodařilo se vytvořit účet." }, { status: 500 });
  }
}

// PATCH ?id=... — upraví oprávnění existujícího účtu
export async function PATCH(req: Request) {
  const { error } = await requireMainAccount();
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Chybí id účtu." }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const permissionsInput = body?.permissions;
    if (!Array.isArray(permissionsInput) || !permissionsInput.every(isValidPermission)) {
      return NextResponse.json({ error: "Neplatná oprávnění." }, { status: 400 });
    }

    const updated = await updateAccountPermissions(id, permissionsInput as Permission[]);
    if (!updated) {
      return NextResponse.json({ error: "Účet nenalezen." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Accounts PATCH error:", err);
    return NextResponse.json({ error: "Nepodařilo se upravit oprávnění." }, { status: 500 });
  }
}

// DELETE ?id=... — smaže dílčí účet
export async function DELETE(req: Request) {
  const { error } = await requireMainAccount();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Chybí id účtu." }, { status: 400 });
  }

  try {
    const deleted = await deleteAccount(id);
    if (!deleted) {
      return NextResponse.json({ error: "Účet nenalezen." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Accounts DELETE error:", err);
    return NextResponse.json({ error: "Nepodařilo se smazat účet." }, { status: 500 });
  }
}