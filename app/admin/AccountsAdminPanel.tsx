"use client";

import { useState } from "react";
import type { PublicAccount } from "@/lib/accounts";
import { GRANTABLE_PERMISSIONS, type Permission } from "@/lib/permissions";

const PERMISSION_LABELS: Record<Permission, string> = {
  reservations: "Objednávky",
  products: "Produkty",
  reviews: "Recenze",
  messages: "Zprávy",
  settings: "Magazín",
  analytics: "Analytika",
  discounts: "Slevové kódy",
};

type AccountsAdminPanelProps = {
  accounts: PublicAccount[];
  onChange: (accounts: PublicAccount[]) => void;
};

export default function AccountsAdminPanel({ accounts, onChange }: AccountsAdminPanelProps) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [newPermissions, setNewPermissions] = useState<Permission[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function toggleNewPermission(perm: Permission) {
    setNewPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);

    const res = await fetch("/api/admin/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password, permissions: newPermissions }),
    });

    const data = await res.json().catch(() => ({}));
    setCreating(false);

    if (!res.ok) {
      setError(data.error ?? "Nepodařilo se vytvořit účet.");
      return;
    }

    onChange([...accounts, data.account]);
    setName("");
    setPassword("");
    setNewPermissions([]);
  }

  async function togglePermission(account: PublicAccount, perm: Permission) {
    const has = account.permissions.includes(perm);
    const updatedPermissions = has
      ? account.permissions.filter((p) => p !== perm)
      : [...account.permissions, perm];

    setBusyId(account.id);
    setError(null);

    const res = await fetch(`/api/admin/accounts?id=${encodeURIComponent(account.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissions: updatedPermissions }),
    });

    setBusyId(null);

    if (!res.ok) {
      setError("Nepodařilo se upravit oprávnění.");
      return;
    }

    onChange(
      accounts.map((a) => (a.id === account.id ? { ...a, permissions: updatedPermissions } : a))
    );
  }

  async function handleDelete(id: string) {
    if (!confirm("Opravdu smazat tento účet?")) return;

    setBusyId(id);
    setError(null);

    const res = await fetch(`/api/admin/accounts?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    setBusyId(null);

    if (!res.ok) {
      setError("Smazání se nezdařilo.");
      return;
    }

    onChange(accounts.filter((a) => a.id !== id));
  }

  return (
    <div className="space-y-8">
      {error && <p className="text-sm text-primary">{error}</p>}

      {/* Vytvoření nového účtu */}
      <form onSubmit={handleCreate} className="border border-[#e5e7eb] rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-[#0f0f10]">Vytvořit nový účet</h3>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Jméno zaměstnance"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="flex-1 border border-[#e5e7eb] rounded-lg px-3 py-2 text-xs text-[#0f0f10] focus:outline-none focus:border-primary/50"
          />
          <input
            type="password"
            placeholder="Heslo (min. 6 znaků)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="flex-1 border border-[#e5e7eb] rounded-lg px-3 py-2 text-xs text-[#0f0f10] focus:outline-none focus:border-primary/50"
          />
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          {GRANTABLE_PERMISSIONS.map((perm) => (
            <label key={perm} className="flex items-center gap-1.5 text-xs text-zinc-600">
              <input
                type="checkbox"
                checked={newPermissions.includes(perm)}
                onChange={() => toggleNewPermission(perm)}
                className="accent-primary"
              />
              {PERMISSION_LABELS[perm]}
            </label>
          ))}
        </div>

        <button
          type="submit"
          disabled={creating}
          className="bg-[#1c1c1c] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-black disabled:opacity-50 transition-colors"
        >
          {creating ? "Vytvářím…" : "Vytvořit účet"}
        </button>
      </form>

      {/* Existující účty */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#0f0f10]">
          Existující účty <span className="text-zinc-400 font-normal">({accounts.length})</span>
        </h3>

        {accounts.length === 0 && (
          <p className="text-sm text-zinc-500">Zatím žádné další účty.</p>
        )}

        {accounts.map((account) => (
          <div key={account.id} className="border border-[#e5e7eb] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-sm font-semibold text-[#0f0f10]">{account.name}</span>
              <button
                onClick={() => handleDelete(account.id)}
                disabled={busyId === account.id}
                className="text-xs font-semibold text-primary hover:text-primary/80 disabled:opacity-50"
              >
                Smazat
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              {GRANTABLE_PERMISSIONS.map((perm) => (
                <label key={perm} className="flex items-center gap-1.5 text-xs text-zinc-600">
                  <input
                    type="checkbox"
                    checked={account.permissions.includes(perm)}
                    disabled={busyId === account.id}
                    onChange={() => togglePermission(account, perm)}
                    className="accent-primary"
                  />
                  {PERMISSION_LABELS[perm]}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}