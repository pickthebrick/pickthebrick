"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setSpaceLayerImage, removeSpaceLayerImage, moveSpaceLayerImage } from "@/app/actions/spaceLayers";
import { addCustomSpaceQuestion, deleteCustomSpaceQuestion } from "@/app/actions/spaceQuestions";
import { slotsForSpace, featureSlot } from "@/lib/spaceLayers";
import { mergedSpaceQuestions } from "@/lib/spaceQuestions";
import { SPACES } from "@/lib/spaces";
import ImageCropper from "@/app/components/ImageCropper";

type LayerRow = { spaceKey: string; slot: string; imageUrl: string; sortOrder: number };
type CustomQuestionRow = { id: string; spaceKey: string; key: string; label: string; sortOrder: number };

export default function DesignLayersClient({
  images,
  customQuestions,
}: {
  images: LayerRow[];
  customQuestions: CustomQuestionRow[];
}) {
  const router = useRouter();
  const [selectedSpace, setSelectedSpace] = useState(SPACES[0].key);
  const [busySlot, setBusySlot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<{ file: File; onDone: (f: File) => void } | null>(null);
  const [newOptionLabel, setNewOptionLabel] = useState("");
  const [addingOption, setAddingOption] = useState(false);

  const bySpace: Record<string, Record<string, LayerRow>> = {};
  for (const row of images) {
    (bySpace[row.spaceKey] ??= {})[row.slot] = row;
  }
  const currentImages = bySpace[selectedSpace] ?? {};

  const currentCustomQuestions = customQuestions.filter((q) => q.spaceKey === selectedSpace);
  const questions = mergedSpaceQuestions(selectedSpace, currentCustomQuestions);
  const slots = slotsForSpace(questions);
  // Maps a feature slot back to the custom question it came from, if any -
  // only custom options get a delete-this-option control; the hardcoded
  // SPACE_QUESTIONS set is fixed in code and isn't removable here.
  const customBySlot = new Map(currentCustomQuestions.map((q) => [featureSlot(q.key), q]));

  // Stacking order among uploaded feature/choice layers only (button/base
  // aren't reorderable - see moveSpaceLayerImage's comment) - used to
  // disable the top/bottom move arrows.
  const orderedMoveableSlots = Object.values(currentImages)
    .filter((r) => slots.find((s) => s.slot === r.slot)?.group !== "button" && r.slot !== "base")
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((r) => r.slot);

  async function handleMove(slot: string, direction: "up" | "down") {
    setBusySlot(slot);
    setError(null);
    setSuccess(null);
    try {
      await moveSpaceLayerImage(selectedSpace, slot, direction);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reorder layer");
    } finally {
      setBusySlot(null);
    }
  }

  async function handleChange(slot: string, file: File | null) {
    if (!file) return;
    setBusySlot(slot);
    setError(null);
    setSuccess(null);
    const formData = new FormData();
    formData.set("image", file);
    try {
      await setSpaceLayerImage(selectedSpace, slot, formData);
      router.refresh();
      setSuccess("Image uploaded.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload image");
    } finally {
      setBusySlot(null);
    }
  }

  async function handleRemove(slot: string) {
    setBusySlot(slot);
    setError(null);
    setSuccess(null);
    try {
      await removeSpaceLayerImage(selectedSpace, slot);
      router.refresh();
      setSuccess("Image removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove image");
    } finally {
      setBusySlot(null);
    }
  }

  async function handleAddOption() {
    if (!newOptionLabel.trim()) return;
    setAddingOption(true);
    setError(null);
    try {
      await addCustomSpaceQuestion(selectedSpace, newOptionLabel);
      setNewOptionLabel("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add option");
    } finally {
      setAddingOption(false);
    }
  }

  async function handleDeleteOption(id: string, slot: string) {
    if (!confirm("Delete this option? Clients will no longer see it, and its uploaded image (if any) will be removed."))
      return;
    setBusySlot(slot);
    await deleteCustomSpaceQuestion(id);
    router.refresh();
    setBusySlot(null);
  }

  return (
    <div>
      <p className="empty" style={{ padding: "0 0 12px" }}>
        Each space has a button image (shown on the space picker), a base room image (always the bottom layer), and
        one image per switch or chair/desk-count option - shown stacked on top of the base whenever that switch is
        on or that option is selected. Use the arrows to fix wrong overlapping between two uploaded layers. Any slot
        left empty falls back to the built-in line-art icon.
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
      {error && (
        <p style={{ color: "#b91c1c", fontSize: 14, fontWeight: 600, margin: "10px 0", padding: "8px 12px", background: "#fef2f2", border: "1px solid #b91c1c", borderRadius: 6 }}>
          {error}
        </p>
      )}
      {success && (
        <p style={{ color: "#166534", fontSize: 14, fontWeight: 600, margin: "10px 0", padding: "8px 12px", background: "#f0fdf4", border: "1px solid #166534", borderRadius: 6 }}>
          {success}
        </p>
      )}
      <div className="banner-grid" style={{ marginTop: 14 }}>
        {slots.map(({ slot, label, group }) => {
          const row = currentImages[slot];
          const imageUrl = row?.imageUrl;
          const busy = busySlot === slot;
          const moveable = imageUrl && group !== "button" && slot !== "base";
          const moveIdx = moveable ? orderedMoveableSlots.indexOf(slot) : -1;
          const customQuestion = customBySlot.get(slot);
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
                <div className="banner-card-title">
                  {label}
                  {customQuestion && <span className="status-badge" style={{ marginLeft: 6 }}>Custom</span>}
                </div>
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
                {moveable && (
                  <div className="banner-card-actions" style={{ marginTop: 6 }}>
                    <button
                      type="button"
                      className="action"
                      disabled={busy || moveIdx === -1 || moveIdx >= orderedMoveableSlots.length - 1}
                      onClick={() => handleMove(slot, "up")}
                      title="Move this layer up (renders later, so it sits on top of layers below it)"
                    >
                      ▲ Bring forward
                    </button>
                    <button
                      type="button"
                      className="action"
                      disabled={busy || moveIdx <= 0}
                      onClick={() => handleMove(slot, "down")}
                      title="Move this layer down (renders earlier, so it sits behind layers above it)"
                    >
                      ▼ Send backward
                    </button>
                  </div>
                )}
                {customQuestion && (
                  <div className="banner-card-actions" style={{ marginTop: 6 }}>
                    <button
                      type="button"
                      className="action danger"
                      disabled={busy}
                      onClick={() => handleDeleteOption(customQuestion.id, slot)}
                    >
                      Delete this option
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="pkgfeat-add-row" style={{ marginTop: 16 }}>
        <input
          type="text"
          value={newOptionLabel}
          onChange={(e) => setNewOptionLabel(e.target.value)}
          placeholder='New option for this space (e.g. "Bean bag seating")'
        />
        <button type="button" className="action" disabled={addingOption || !newOptionLabel.trim()} onClick={handleAddOption}>
          {addingOption ? "Adding..." : "+ Add option"}
        </button>
      </div>
      <p className="empty" style={{ padding: "6px 0 0" }}>
        A new option becomes a real switch clients can turn on for this space, right alongside the built-in ones -
        upload an image for it above like any other layer.
      </p>

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
