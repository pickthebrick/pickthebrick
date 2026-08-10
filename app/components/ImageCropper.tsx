"use client";

import { useEffect, useRef, useState } from "react";

const STAGE_MAX_W = 520;
const STAGE_MAX_H = 440;
const MIN_BOX = 40;
const HANDLE_HIT = 14;

type Box = { x: number; y: number; w: number; h: number };
type Corner = "nw" | "ne" | "sw" | "se";
type Drag = { mode: "move" | Corner; startBox: Box; startX: number; startY: number };

function clampBox(box: Box, stageW: number, stageH: number): Box {
  const w = Math.min(Math.max(box.w, MIN_BOX), stageW);
  const h = Math.min(Math.max(box.h, MIN_BOX), stageH);
  const x = Math.min(Math.max(box.x, 0), stageW - w);
  const y = Math.min(Math.max(box.y, 0), stageH - h);
  return { x, y, w, h };
}

function outputMime(fileType: string): string {
  if (fileType === "image/png") return "image/png";
  if (fileType === "image/webp") return "image/webp";
  return "image/jpeg";
}

// Freeform (or square-locked) drag-to-position, drag-corners-to-size crop
// modal - shared by every image uploader in the marketer dashboard so each
// call site only has to intercept its own onChange and hand the picked File
// through here before it reaches the existing upload handler/server action.
// No cropping library: this is a handful of pointer-event handlers over a
// CSS box-shadow mask, in keeping with this codebase staying dependency-light.
export default function ImageCropper({
  file,
  onCancel,
  onConfirm,
}: {
  file: File;
  onCancel: () => void;
  onConfirm: (croppedFile: File) => void;
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const [box, setBox] = useState<Box | null>(null);
  const [aspectLocked, setAspectLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const dragRef = useRef<Drag | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Synchronizing with an external resource (a browser-managed blob URL for
    // the picked File), not deriving state from props/state already
    // available during render - createObjectURL has to run as a side effect.
    const url = URL.createObjectURL(file);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleImgLoad() {
    const img = imgRef.current;
    if (!img) return;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    const scale = Math.min(STAGE_MAX_W / nw, STAGE_MAX_H / nh);
    const sw = Math.round(nw * scale);
    const sh = Math.round(nh * scale);
    setNatural({ w: nw, h: nh });
    setStage({ w: sw, h: sh });
    setBox({ x: sw * 0.05, y: sh * 0.05, w: sw * 0.9, h: sh * 0.9 });
  }

  function toggleAspect(square: boolean) {
    setAspectLocked(square);
    if (!square || !box) return;
    const size = Math.min(box.w, box.h);
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    setBox(clampBox({ x: cx - size / 2, y: cy - size / 2, w: size, h: size }, stage.w, stage.h));
  }

  function beginDrag(mode: Drag["mode"], e: React.PointerEvent) {
    if (!box) return;
    e.preventDefault();
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = { mode, startBox: box, startX: e.clientX, startY: e.clientY };
  }

  function onPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag || !box) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (drag.mode === "move") {
      setBox(clampBox({ ...drag.startBox, x: drag.startBox.x + dx, y: drag.startBox.y + dy }, stage.w, stage.h));
      return;
    }
    let { x, y, w, h } = drag.startBox;
    const isLeft = drag.mode === "nw" || drag.mode === "sw";
    const isTop = drag.mode === "nw" || drag.mode === "ne";
    if (aspectLocked) {
      // Square lock: drive the resize off whichever axis moved further, and
      // mirror the same delta onto the other axis from the fixed corner.
      const delta = Math.abs(dx) > Math.abs(dy) ? dx : dy;
      const signed = isLeft ? -delta : delta;
      w = drag.startBox.w + signed;
      h = w;
      if (isLeft) x = drag.startBox.x + drag.startBox.w - w;
      if (isTop) y = drag.startBox.y + drag.startBox.h - h;
    } else {
      if (isLeft) {
        w = drag.startBox.w - dx;
        x = drag.startBox.x + dx;
      } else {
        w = drag.startBox.w + dx;
      }
      if (isTop) {
        h = drag.startBox.h - dy;
        y = drag.startBox.y + dy;
      } else {
        h = drag.startBox.h + dy;
      }
    }
    if (w < MIN_BOX) {
      w = MIN_BOX;
      x = isLeft ? drag.startBox.x + drag.startBox.w - MIN_BOX : drag.startBox.x;
    }
    if (h < MIN_BOX) {
      h = MIN_BOX;
      y = isTop ? drag.startBox.y + drag.startBox.h - MIN_BOX : drag.startBox.y;
    }
    setBox(clampBox({ x, y, w, h }, stage.w, stage.h));
  }

  function endDrag() {
    dragRef.current = null;
  }

  function handleConfirm() {
    const img = imgRef.current;
    if (!img || !box || stage.w === 0) return;
    setBusy(true);
    const scale = natural.w / stage.w;
    const sx = box.x * scale;
    const sy = box.y * scale;
    const sw = box.w * scale;
    const sh = box.h * scale;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(sw);
    canvas.height = Math.round(sh);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setBusy(false);
      return;
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    const mime = outputMime(file.type);
    canvas.toBlob(
      (blob) => {
        setBusy(false);
        if (!blob) return;
        const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
        onConfirm(new File([blob], `crop.${ext}`, { type: mime }));
      },
      mime,
      0.92,
    );
  }

  const cropped = box && natural.w > 0 ? { w: Math.round(box.w * (natural.w / stage.w)), h: Math.round(box.h * (natural.h / stage.h)) } : null;

  return (
    <div className="img-crop-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="img-crop-modal">
        <div className="img-crop-header">
          <h3>Size &amp; crop image</h3>
          <div className="img-crop-aspect-toggle">
            <button type="button" className={!aspectLocked ? "selected" : ""} onClick={() => toggleAspect(false)}>
              Free
            </button>
            <button type="button" className={aspectLocked ? "selected" : ""} onClick={() => toggleAspect(true)}>
              Square
            </button>
          </div>
        </div>

        <div
          className="img-crop-stage"
          style={{ width: stage.w || STAGE_MAX_W, height: stage.h || STAGE_MAX_H }}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {objectUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img ref={imgRef} src={objectUrl} alt="" className="img-crop-img" onLoad={handleImgLoad} draggable={false} />
          )}
          {box && (
            <div
              className="img-crop-box"
              style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
              onPointerDown={(e) => beginDrag("move", e)}
            >
              {(["nw", "ne", "sw", "se"] as const).map((corner) => (
                <div
                  key={corner}
                  className={`img-crop-handle ${corner}`}
                  style={{ padding: HANDLE_HIT / 2 }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    beginDrag(corner, e);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="img-crop-footer">
          <span className="img-crop-dims">{cropped ? `${cropped.w} × ${cropped.h} px` : ""}</span>
          <div className="img-crop-actions">
            <button type="button" className="action" onClick={onCancel} disabled={busy}>
              Cancel
            </button>
            <button type="button" className="action" onClick={handleConfirm} disabled={busy || !box}>
              {busy ? "Applying..." : "Use this crop"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
