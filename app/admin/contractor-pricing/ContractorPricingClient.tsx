"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateCategoryContractorReduction } from "@/app/actions/catalog";

type Category = { id: string; label: string; contractorReductionPercent: number };

export default function ContractorPricingClient({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(categories.map((c) => [c.id, c.contractorReductionPercent])),
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(categoryId: string) {
    setBusy(categoryId);
    setError(null);
    try {
      await updateCategoryContractorReduction(categoryId, values[categoryId]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(null);
    }
  }

  if (categories.length === 0) {
    return <div className="empty">No categories in the catalog yet.</div>;
  }

  return (
    <>
      {error && <p className="sub" style={{ color: "#b23b3b" }}>{error}</p>}
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Reduction %</th>
            <th>Contractor sees</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => {
            const value = values[c.id] ?? c.contractorReductionPercent;
            const changed = value !== c.contractorReductionPercent;
            return (
              <tr key={c.id}>
                <td>{c.label}</td>
                <td>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={value}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [c.id]: Number(e.target.value) }))
                    }
                    style={{ width: 70 }}
                  />
                </td>
                <td className="sub" style={{ marginBottom: 0 }}>
                  {(100 - value).toFixed(0)}% of the sell price
                </td>
                <td>
                  <button
                    className="action"
                    disabled={!changed || busy === c.id}
                    onClick={() => handleSave(c.id)}
                  >
                    {busy === c.id ? "Saving…" : "Save"}
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
