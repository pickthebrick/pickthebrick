"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createPackageFeatureItem,
  updatePackageFeatureItem,
  deletePackageFeatureItem,
  movePackageFeatureItem,
  setPackageFeatureSampleImage,
  removePackageFeatureSampleImage,
} from "@/app/actions/packageFeatures";
import ImageCropper from "@/app/components/ImageCropper";

export type PackageFeatureItemRow = {
  id: string;
  label: string;
  description: string | null;
  minTier: "essential" | "advanced" | "premium";
  sortOrder: number;
  sampleImageUrl: string | null;
};

const TIER_LABELS: Record<PackageFeatureItemRow["minTier"], string> = {
  essential: "Essential",
  advanced: "Advanced",
  premium: "Premium",
};

type Draft = { label: string; description: string; minTier: PackageFeatureItemRow["minTier"] };

export default function PackageFeaturesClient({ items }: { items: PackageFeatureItemRow[] }) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(items.map((i) => [i.id, { label: i.label, description: i.description ?? "", minTier: i.minTier }])),
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<{ file: File; onDone: (f: File) => void } | null>(null);

  const [newLabel, setNewLabel] = useState("");
  const [newTier, setNewTier] = useState<PackageFeatureItemRow["minTier"]>("essential");
  const [adding, setAdding] = useState(false);

  function setDraft(id: string, patch: Partial<Draft>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function handleSave(id: string) {
    const draft = drafts[id];
    if (!draft) return;
    setBusyId(id);
    setError(null);
    try {
      await updatePackageFeatureItem(id, draft);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save item");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this package feature item?")) return;
    setBusyId(id);
    setError(null);
    try {
      await deletePackageFeatureItem(id);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleMove(id: string, direction: "up" | "down") {
    setBusyId(id);
    await movePackageFeatureItem(id, direction);
    router.refresh();
    setBusyId(null);
  }

  async function handleImageChange(id: string, file: File | null) {
    if (!file) return;
    setBusyId(id);
    setError(null);
    const formData = new FormData();
    formData.set("image", file);
    try {
      await setPackageFeatureSampleImage(id, formData);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload image");
    } finally {
      setBusyId(null);
    }
  }

  async function handleImageRemove(id: string) {
    setBusyId(id);
    await removePackageFeatureSampleImage(id);
    router.refresh();
    setBusyId(null);
  }

  async function handleAdd() {
    if (!newLabel.trim()) return;
    setAdding(true);
    setError(null);
    try {
      await createPackageFeatureItem({ label: newLabel, minTier: newTier });
      setNewLabel("");
      setNewTier("essential");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add item");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div>
      <p className="empty" style={{ padding: "0 0 12px" }}>
        These are the checklist items shown on each design package card. The tier a client sees them on is set by
        &ldquo;Included from&rdquo; - Advanced also shows every Essential item, Premium shows all three. The
        description shows as a hover tooltip on the client page; the sample image (optional) adds a &ldquo;Sample&rdquo;
        button next to the item that opens the image in a pop-up.
      </p>
      {error && <p style={{ color: "#b91c1c", fontSize: 13, margin: "10px 0" }}>{error}</p>}

      <div className="pkgfeat-list">
        {items.map((item, idx) => {
          const draft = drafts[item.id] ?? { label: item.label, description: item.description ?? "", minTier: item.minTier };
          const busy = busyId === item.id;
          return (
            <div key={item.id} className="pkgfeat-row">
              <div className="pkgfeat-row-order">
                <button type="button" disabled={busy || idx === 0} onClick={() => handleMove(item.id, "up")} aria-label="Move up">
                  ▲
                </button>
                <button
                  type="button"
                  disabled={busy || idx === items.length - 1}
                  onClick={() => handleMove(item.id, "down")}
                  aria-label="Move down"
                >
                  ▼
                </button>
              </div>

              <div className="pkgfeat-row-fields">
                <input
                  type="text"
                  value={draft.label}
                  onChange={(e) => setDraft(item.id, { label: e.target.value })}
                  placeholder="Item label"
                />
                <textarea
                  value={draft.description}
                  onChange={(e) => setDraft(item.id, { description: e.target.value })}
                  placeholder="Hover description (placeholder text is fine for now)"
                  rows={2}
                />
                <div className="pkgfeat-row-meta">
                  <label>
                    Included from
                    <select value={draft.minTier} onChange={(e) => setDraft(item.id, { minTier: e.target.value as Draft["minTier"] })}>
                      {(Object.keys(TIER_LABELS) as (keyof typeof TIER_LABELS)[]).map((tier) => (
                        <option key={tier} value={tier}>
                          {TIER_LABELS[tier]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button type="button" className="action" disabled={busy} onClick={() => handleSave(item.id)}>
                    Save
                  </button>
                  <button type="button" className="action danger" disabled={busy} onClick={() => handleDelete(item.id)}>
                    Delete
                  </button>
                </div>
              </div>

              <div className="pkgfeat-row-sample">
                {item.sampleImageUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.sampleImageUrl} alt="" className="pkgfeat-sample-thumb" />
                    <div className="pkgfeat-row-sample-actions">
                      <label className="action" style={{ cursor: "pointer" }}>
                        {busy ? "Uploading..." : "Replace"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          disabled={busy}
                          style={{ display: "none" }}
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;
                            e.target.value = "";
                            setCropTarget(file && { file, onDone: (cropped) => handleImageChange(item.id, cropped) });
                          }}
                        />
                      </label>
                      <button type="button" className="action danger" disabled={busy} onClick={() => handleImageRemove(item.id)}>
                        Remove
                      </button>
                    </div>
                  </>
                ) : (
                  <label className="action" style={{ cursor: "pointer" }}>
                    {busy ? "Uploading..." : "Add sample image"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      disabled={busy}
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        handleImageChange(item.id, file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="pkgfeat-add-row">
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="New item label"
        />
        <select value={newTier} onChange={(e) => setNewTier(e.target.value as Draft["minTier"])}>
          {(Object.keys(TIER_LABELS) as (keyof typeof TIER_LABELS)[]).map((tier) => (
            <option key={tier} value={tier}>
              {TIER_LABELS[tier]}
            </option>
          ))}
        </select>
        <button type="button" className="action" disabled={adding || !newLabel.trim()} onClick={handleAdd}>
          {adding ? "Adding..." : "+ Add item"}
        </button>
      </div>

      {cropTarget && (
        <ImageCropper
          file={cropTarget.file}
          onCancel={() => setCropTarget(null)}
          onConfirm={(cropped) => {
            cropTarget.onDone(cropped);
            setCropTarget(null);
          }}
        />
      )}
    </div>
  );
}
