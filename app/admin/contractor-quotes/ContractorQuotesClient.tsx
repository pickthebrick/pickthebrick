"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setContractorPlan } from "@/app/actions/contractors";
import type { ContractorPlan } from "@/app/generated/prisma/enums";

type Row = {
  id: string;
  fullName: string | null;
  company: string | null;
  email: string;
  count: number;
  lastQuoteAt: Date | null;
  plan: ContractorPlan;
  planUpdatedAt: Date | null;
  quotaLimit: number;
};

// Manual "billing" for now (see setContractorPlan in app/actions/
// contractors.ts) - the business collects payment however it already does
// (cash, for the moment) and clicks this to actually lift the free-quote
// cap. Swap for a real checkout flow later without touching this table.
export default function ContractorQuotesClient({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleTogglePlan(row: Row) {
    setBusyId(row.id);
    setError(null);
    try {
      const nextPlan: ContractorPlan = row.plan === "paid" ? "free" : "paid";
      await setContractorPlan(row.id, nextPlan);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update this contractor's plan");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      {error && <p className="quota-admin-error">{error}</p>}
      <table>
        <thead>
          <tr>
            <th>Contractor</th>
            <th>Company</th>
            <th>Email</th>
            <th>Quotes downloaded</th>
            <th>Last quote</th>
            <th>Plan</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const remaining = r.quotaLimit - r.count;
            return (
              <tr key={r.id}>
                <td>{r.fullName ?? "-"}</td>
                <td>{r.company ?? "-"}</td>
                <td>{r.email}</td>
                <td>{r.count}</td>
                <td>{r.lastQuoteAt ? new Date(r.lastQuoteAt).toLocaleDateString() : "-"}</td>
                <td>
                  {r.plan === "paid" ? (
                    <span className="quota-pill paid">
                      Paid{r.planUpdatedAt ? ` · since ${new Date(r.planUpdatedAt).toLocaleDateString()}` : ""}
                    </span>
                  ) : remaining <= 0 ? (
                    <span className="quota-pill limit">Limit reached</span>
                  ) : remaining <= 2 ? (
                    <span className="quota-pill warn">
                      {remaining} left of {r.quotaLimit}
                    </span>
                  ) : (
                    <span className="quota-pill free">
                      {r.count} / {r.quotaLimit} free
                    </span>
                  )}
                </td>
                <td>
                  <button
                    type="button"
                    className="quota-admin-link"
                    disabled={busyId === r.id}
                    onClick={() => handleTogglePlan(r)}
                  >
                    {busyId === r.id ? "Saving..." : r.plan === "paid" ? "Revert to free" : "Grant paid access"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
