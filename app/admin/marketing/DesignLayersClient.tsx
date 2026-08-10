"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setSpaceLayerImage, removeSpaceLayerImage } from "@/app/actions/spaceLayers";
import { slotsForSpace } from "@/lib/spaceLayers";
import { SPACES } from "@/lib/spaces";
import ImageCropper from "@/app/components/ImageCropper";

type LayerRow = { spaceKey: string; slot: string; imageUrl: string };

export default function DesignLayersClient({ images }: { images: LayerRow[] }) {
  const router = useRouter();
  const [selectedSpace, setSelectedSpace] = useState(SPACES[0].key);
  const [busySlot, setBusySlot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<{ file: File; onDone: (f: File) => void } | null>(null);

  const bySpace: Record<string, Record<string, string>> = {};
  for (const row of images) {
    (bySpace[row.spaceKey] ??= {})[row.slot] = row.imageUrl;
  }
  const currentImages = bySpace[selectedSpace] ?? {};

  async function handleChange(slot: string, file: File | null) {
    if (!file) return;
    setBusySlot(slot);
    setError(null);
    const formData = new FormData();
    formData.set("image", file);
    try {
      await setSpaceLayerImage(selectedSpace, slot, formData);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload image");
    } finally {
      setBusySlot(null);
    }
  }

  async function handleRemove(slot: string) {
    setBusySlot(slot);
    await removeSpaceLayerImage(selectedSpace, slot);
    router.refresh();
    setBusySlot(null);
  }

  return (
    <div>
      <p className="empty" style={{ padding: "0 0 12px" }}>
        Each space has a button image (shown on the space picker), a base room image, and one image per switch or
        chair/desk-count option - shown on the Features step whenever that switch is on or that option is selected.
        Any slot left empty falls back to the built-in line-art icon.
      </p>
      <div className="design-layers-space-picker">
        {SPACES.map((s) => (
          <button
            key={s.key}
            type="button"
            className={`design-layers-space-chip ${selectedSpace === s.key ? "selected" : ""}`}
            onClick={() => setSelectedSpace(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>
      {error && <p style={{ color: "#b91c1c", fontSize: 13, margin: "10px 0" }}>{error}</p>}
      <div className="banner-grid" style={{ marginTop: 14 }}>
        {slotsForSpace(selectedSpace).map(({ slot, label }) => {
          const imageUrl = currentImages[slot];
          const busy = busySlot === slot;
          return (
            <div key={slot} className="banner-card">
              <div className="banner-card-img-wrap">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt={label} />
                ) : (
                  <div className="empty" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                    No image - using SpaceIcon fallback
                  </div>
                )}
              </div>
              <div className="banner-card-body">
                <div className="banner-card-title">{label}</div>
                <div className="banner-card-actions">
                  <label className="action" style={{ cursor: "pointer" }}>
                    {busy ? "Uploading..." : imageUrl ? "Replace" : "Upload"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      disabled={busy}
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        e.target.value = "";
                        setCropTarget(file && { file, onDone: (cropped) => handleChange(slot, cropped) });
                      }}
                    />
                  </label>
                  {imageUrl && (
                    <button className="action danger" disabled={busy} onClick={() => handleRemove(slot)}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
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
