"use client";

import { useState } from "react";
import { ChevronDown, Mail, Phone, Package } from "lucide-react";
import type { Claim, ClaimStatus } from "@/lib/claims";

type ClaimsAdminListProps = {
  claims: Claim[];
  onChange: (claims: Claim[]) => void;
};

// Popisky musí sedět s hodnotami <option value> na /reklamace — stejné mapy
// jsou i v lib/email.ts pro potvrzovací e-mail.
const TYPE_LABELS: Record<string, string> = {
  reklamace: "Reklamace",
  vraceni: "Vrácení do 14 dnů",
  vymena: "Výměna",
};

const RESOLUTION_LABELS: Record<string, string> = {
  oprava: "Oprava",
  penize: "Vrácení peněz",
  sleva: "Sleva z ceny",
};

const STATUS_LABELS: Record<ClaimStatus, string> = {
  novy: "Nový",
  vyrizuje_se: "Vyřizuje se",
  vyrizeno: "Vyřízeno",
};

const STATUS_ORDER: ClaimStatus[] = ["novy", "vyrizuje_se", "vyrizeno"];

function statusClasses(status: ClaimStatus): string {
  if (status === "novy") return "bg-primary/10 text-primary-ink border-primary/20";
  if (status === "vyrizuje_se") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-green-50 text-green-700 border-green-200";
}

function ClaimCard({
  claim,
  busy,
  onSetStatus,
  onDelete,
}: {
  claim: Claim;
  busy: boolean;
  onSetStatus: (claim: Claim, status: ClaimStatus) => void;
  onDelete: (id: string) => void;
}) {
  const isOpen = claim.status !== "vyrizeno";

  return (
    <div
      className={`border rounded-xl p-4 transition-colors ${
        isOpen ? "border-zinc-300 bg-[#fafafa]" : "border-[#e5e7eb] bg-white"
      }`}
    >
      <div className="flex justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-mono font-bold text-primary-ink bg-primary/5 border border-primary/10 px-1.5 py-0.5 rounded">
              {claim.ticket}
            </span>
            <span className="text-sm font-semibold text-[#0f0f10]">{claim.jmeno}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${statusClasses(claim.status)}`}>
              {STATUS_LABELS[claim.status]}
            </span>
            <span className="text-[11px] text-zinc-400">
              {new Date(claim.date).toLocaleString("cs-CZ")}
            </span>
          </div>

          <div className="flex items-center gap-3 mb-2 flex-wrap text-[11px] text-zinc-500">
            <span className="inline-flex items-center gap-1">
              <Package size={11} /> {TYPE_LABELS[claim.typZadosti] ?? claim.typZadosti}
              <span className="text-zinc-300">·</span>
              {RESOLUTION_LABELS[claim.zpusobVyrizeni] ?? claim.zpusobVyrizeni}
            </span>
            <span className="inline-flex items-center gap-1">
              obj. <span className="font-mono text-zinc-600">{claim.cisloObjednavky}</span>
            </span>
          </div>

          <p className="text-xs text-zinc-600 leading-relaxed whitespace-pre-wrap mb-2">
            {claim.popis}
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            <a
              href={`mailto:${claim.email}?subject=${encodeURIComponent(`Reklamace ${claim.ticket} — SLINGR`)}`}
              className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-[#0f0f10] hover:underline"
            >
              <Mail size={11} /> {claim.email}
            </a>
            <a
              href={`tel:${claim.telefon.replace(/\s/g, "")}`}
              className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-[#0f0f10] hover:underline"
            >
              <Phone size={11} /> {claim.telefon}
            </a>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {STATUS_ORDER.filter((s) => s !== claim.status).map((s) => (
            <button
              key={s}
              onClick={() => onSetStatus(claim, s)}
              disabled={busy}
              className="text-xs font-semibold text-zinc-500 hover:text-[#0f0f10] disabled:opacity-50 whitespace-nowrap"
            >
              {s === "vyrizeno" ? "Označit vyřízeno" : `Označit „${STATUS_LABELS[s].toLowerCase()}“`}
            </button>
          ))}
          <button
            onClick={() => onDelete(claim.id)}
            disabled={busy}
            className="text-xs font-semibold text-primary-ink hover:text-primary-ink/80 disabled:opacity-50"
          >
            {busy ? "Pracuji…" : "Smazat"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClaimsAdminList({ claims, onChange }: ClaimsAdminListProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);

  async function handleSetStatus(claim: Claim, status: ClaimStatus) {
    setBusyId(claim.id);
    setError(null);
    try {
      const res = await fetch("/api/admin/claims", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: claim.id, status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Úprava se nezdařila.");
      }
      onChange(claims.map((c) => (c.id === claim.id ? { ...c, status } : c)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Úprava se nezdařila.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Opravdu smazat tuto žádost? Zákazník se na její číslo může odkazovat.")) return;

    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/claims?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Smazání se nezdařilo.");
      }
      onChange(claims.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Smazání se nezdařilo.");
    } finally {
      setBusyId(null);
    }
  }

  if (claims.length === 0) {
    return <p className="text-sm text-zinc-500">Zatím žádné reklamace.</p>;
  }

  const open = claims.filter((c) => c.status !== "vyrizeno");
  const done = claims.filter((c) => c.status === "vyrizeno");

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-primary-ink">{error}</p>}

      {open.length === 0 && <p className="text-sm text-zinc-500">Žádné otevřené žádosti.</p>}

      {open.map((claim) => (
        <ClaimCard
          key={claim.id}
          claim={claim}
          busy={busyId === claim.id}
          onSetStatus={handleSetStatus}
          onDelete={handleDelete}
        />
      ))}

      {done.length > 0 && (
        <div className="pt-2">
          <button
            onClick={() => setShowDone((v) => !v)}
            className="w-full flex items-center justify-between gap-2 px-1 py-2 text-xs font-semibold text-zinc-500 hover:text-[#0f0f10] transition-colors"
          >
            <span>
              Vyřízené žádosti <span className="text-zinc-400 font-normal">({done.length})</span>
            </span>
            <ChevronDown size={15} className={`transition-transform duration-150 ${showDone ? "rotate-180" : ""}`} />
          </button>

          {showDone && (
            <div className="space-y-3 mt-1">
              {done.map((claim) => (
                <ClaimCard
                  key={claim.id}
                  claim={claim}
                  busy={busyId === claim.id}
                  onSetStatus={handleSetStatus}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
