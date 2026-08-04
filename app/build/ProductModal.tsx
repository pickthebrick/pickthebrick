"use client";

import { useState } from "react";
import { ProductThumb } from "./ProductThumb";

const SIZES = ["600x600mm", "300x600mm", "Custom Size"];
const DOWNLOAD_KINDS: { kind: "datasheet" | "method" | "3d"; label: string }[] = [
  { kind: "datasheet", label: "Data Sheet" },
  { kind: "method", label: "Method Statement" },
  { kind: "3d", label: "3D File" },
];

function unitSuffix(unit: string, displayUnit: string) {
  if (unit === "count") return "Nos";
  if (unit === "lm") return "lm";
  return displayUnit;
}

function downloadPlaceholder(name: string, kind: "datasheet" | "method" | "3d") {
  const label = kind === "datasheet" ? "Data Sheet" : kind === "method" ? "Method Statement" : "3D Model";
  const ext = kind === "3d" ? "txt" : "txt";
  const body =
    kind === "3d"
      ? `Placeholder 3D model file for: ${name}\n\nStand-in for a real .glb/.gltf model - to be added when the real catalog is loaded.`
      : `Placeholder ${label.toLowerCase()} generated for prototype purposes.\n\nReal ${label.toLowerCase()} content for "${name}" will be loaded here once available.`;
  const blob = new Blob([body], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name.replace(/[^a-z0-9]+/gi, "_")}_${label.replace(/\s+/g, "")}_placeholder.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}

export type ModalProduct = {
  id: string;
  name: string;
  rate: number;
  description?: string | null;
  categoryLabel: string;
  typeLabel: string;
  subtypeLabel: string;
  unit: string;
  images?: string[];
  colorOptions?: { id: string; name: string; hex: string }[];
  specs?: { id: string; label: string; value: string }[];
  downloads?: { id: string; label: string; kind: string; filePath: string }[];
};

export default function ProductModal({
  product,
  inCart,
  initialQty,
  displayUnit,
  onClose,
  onAddToCart,
}: {
  product: ModalProduct;
  inCart: boolean;
  initialQty: number;
  displayUnit: string;
  onClose: () => void;
  onAddToCart: (qty: number) => void;
}) {
  const images = product.images ?? [];
  const hasRealImages = images.length > 0;
  const [activeImg, setActiveImg] = useState(0);
  const [color, setColor] = useState<string | null>(product.colorOptions?.[0]?.id ?? null);
  const [size, setSize] = useState(SIZES[0]);
  const [qty, setQty] = useState(initialQty);
  const isCount = product.unit === "count";

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div />
          <div className="modal-close" onClick={onClose}>
            &times;
          </div>
        </div>
        <div className="modal-body">
          <div className="modal-gallery">
            <div className="main-img">
              <ProductThumb seed={product.id} variant={activeImg} images={images} />
            </div>
            <div className="thumb-col">
              {(hasRealImages ? images.map((_, i) => i) : [0, 1, 2, 3]).map((i) => (
                <div key={i} className={`thumb ${activeImg === i ? "active" : ""}`} onClick={() => setActiveImg(i)}>
                  <ProductThumb seed={product.id} variant={i} images={images} />
                </div>
              ))}
            </div>
          </div>

          <div className="modal-title">{product.name}</div>
          <div className="modal-cat">
            {product.categoryLabel} / {product.typeLabel} / {product.subtypeLabel}
          </div>
          <div className="modal-price">
            AED {product.rate}/{unitSuffix(product.unit, displayUnit)}
          </div>

          {product.description && (
            <>
              <div className="modal-section-label">Description</div>
              <p className="modal-description">{product.description}</p>
            </>
          )}

          <div className="modal-section-label">Quantity</div>
          <div className="qty-box" style={{ width: "fit-content" }}>
            <button type="button" onClick={() => setQty((q) => Math.max(isCount ? 1 : 0.1, q - (isCount ? 1 : 1)))}>
              &minus;
            </button>
            <input
              type="number"
              min={isCount ? 1 : 0.1}
              value={qty}
              onChange={(e) => setQty(Math.max(isCount ? 1 : 0.1, parseFloat(e.target.value) || (isCount ? 1 : 0.1)))}
            />
            <span>{unitSuffix(product.unit, displayUnit)}</span>
            <button type="button" onClick={() => setQty((q) => q + (isCount ? 1 : 1))}>
              +
            </button>
          </div>

          {product.colorOptions && product.colorOptions.length > 0 && (
            <>
              <div className="modal-section-label">Color</div>
              <div className="swatch-row">
                {product.colorOptions.map((c) => (
                  <div
                    key={c.id}
                    title={c.name}
                    className={`swatch ${color === c.id ? "selected" : ""}`}
                    style={{ background: c.hex }}
                    onClick={() => setColor(c.id)}
                  />
                ))}
              </div>
            </>
          )}

          <div className="modal-section-label">Size</div>
          <div className="opt-row">
            {SIZES.map((s) => (
              <div key={s} className={`opt-chip ${size === s ? "selected" : ""}`} onClick={() => setSize(s)}>
                {s}
              </div>
            ))}
          </div>

          <div className="modal-section-label">Specification</div>
          <table className="spec-table">
            <tbody>
              <tr>
                <td>Category</td>
                <td>{product.categoryLabel}</td>
              </tr>
              <tr>
                <td>Style / Material</td>
                <td>
                  {product.typeLabel} / {product.subtypeLabel}
                </td>
              </tr>
              {product.specs?.map((s) => (
                <tr key={s.id}>
                  <td>{s.label}</td>
                  <td>{s.value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="modal-section-label">Downloads</div>
          <div className="download-row">
            {DOWNLOAD_KINDS.map(({ kind, label }) => {
              const real = product.downloads?.find((d) => d.kind === kind);
              return real ? (
                <a key={kind} className="dl-btn" href={real.filePath} download>
                  {real.label}
                </a>
              ) : (
                <div key={kind} className="dl-btn" onClick={() => downloadPlaceholder(product.name, kind)}>
                  {label}
                </div>
              );
            })}
          </div>

          <button className="modal-addbtn" onClick={() => onAddToCart(qty)}>
            {inCart ? "In quote ✓ (click to remove)" : "Add to quote"}
          </button>
        </div>
      </div>
    </div>
  );
}
