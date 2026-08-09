"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setStyleFinderImage, removeStyleFinderImage } from "@/app/actions/styleFinderImages";
import { STYLE_FINDER_STYLES, IMAGES_PER_STYLE } from "@/lib/styleFinder";

type StyleImageRow = { styleKey: string; slot: number; imageUrl: string };

export default function StyleFinderImagesClient({ images }: { images: StyleImageRow[] }) {
  const router = useRouter();
  const [selectedStyle, setSelectedStyle] = useState(STYLE_FINDER_STYLES[0].key);
  const [busySlot, setBusySlot] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const byStyle: Record<string, Record<number, string>> = {};
  for (const row of images) {
    (byStyle[row.styleKey] ??= {})[row.slot] = row.imageUrl;
  }
  const currentImages = byStyle[selectedStyle] ?? {};

  async function handleChange(slot: number, file: File | null) {
    if (!file) return;
    setBusySlot(slot);
    setError(null);
    const formData = new FormData();
    formData.set("image", file);
    try {
      await setStyleFinderImage(selectedStyle, slot, formData);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload image");
    } finally {
      setBusySlot(null);
    }
  }

  async function handleRemove(slot: number) {
    setBusySlot(slot);
    await removeStyleFinderImage(selectedStyle, slot);
    router.refresh();
    setBusySlot(null);
  }

  return (
    <div>
      <p className="empty" style={{ padding: "0 0 12px" }}>
        Each style shows {IMAGES_PER_STYLE} photos in the swipe deck. Any slot left empty falls back to a placeholder
        photo until real photography is uploaded here.
      </p>
      <div className="design-layers-space-picker">
        {STYLE_FINDER_STYLES.map((s) => (
          <button
            key={s.key}
            type="button"
            className={`design-layers-space-chip ${selectedStyle === s.key ? "selected" : ""}`}
            onClick={() => setSelectedStyle(s.key)}
          >
            {s.name}
          </button>
        ))}
      </div>
      {error && <p style={{ color: "#b91c1c", fontSize: 13, margin: "10px 0" }}>{error}</p>}
      <div className="banner-grid" style={{ marginTop: 14 }}>
        {Array.from({ length: IMAGES_PER_STYLE }, (_, slot) => {
          const imageUrl = currentImages[slot];
          const busy = busySlot === slot;
          const label = `Image ${slot + 1}`;
          return (
            <div key={slot} className="banner-card">
              <div className="banner-card-img-wrap">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt={label} />
                ) : (
                  <div className="empty" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                    No image - using placeholder
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
                        handleChange(slot, file);
                        e.target.value = "";
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
    </div>
  );
}
