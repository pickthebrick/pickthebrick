"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { assignCaptain, unassignCaptain } from "@/app/actions/quotes";

type Captain = { id: string; fullName: string | null; email: string };

export default function AssignCaptainCell({
  quoteId,
  currentCaptainId,
  captains,
}: {
  quoteId: string;
  currentCaptainId: string | null;
  captains: Captain[];
}) {
  const router = useRouter();
  const [value, setValue] = useState(currentCaptainId ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUnassigning = !value && !!currentCaptainId;

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      if (isUnassigning) {
        await unassignCaptain(quoteId);
      } else {
        if (!value) return;
        await assignCaptain(quoteId, value);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update captain assignment");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 160 }}>
      <div style={{ display: "flex", gap: 6 }}>
        <select value={value} onChange={(e) => setValue(e.target.value)} disabled={busy}>
          <option value="">Unassigned</option>
          {captains.map((c) => (
            <option key={c.id} value={c.id}>
              {c.fullName ?? c.email}
            </option>
          ))}
        </select>
        <button
          className={`action ${isUnassigning ? "danger" : ""}`}
          disabled={busy || value === (currentCaptainId ?? "")}
          onClick={handleConfirm}
        >
          {busy ? "..." : isUnassigning ? "Unassign" : "Assign"}
        </button>
      </div>
      {error && (
        <div className="sub" style={{ color: "#b91c1c", marginBottom: 0 }}>
          {error}
        </div>
      )}
    </div>
  );
}
