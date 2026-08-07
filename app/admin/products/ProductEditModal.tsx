"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CatalogProduct } from "@/lib/catalog";
import Lightbox from "@/app/components/Lightbox";
import {
  addProductImage,
  deleteProductImage,
  reorderProductImage,
  addColorOption,
  deleteColorOption,
  addProductSize,
  deleteProductSize,
  reorderProductSize,
  addSpec,
  deleteSpec,
  addProductDownload,
  deleteProductDownload,
  updateProductDescription,
  updateProductVariantToggles,
} from "@/app/actions/products";

const DOWNLOAD_KINDS = [
  { value: "datasheet", label: "Data Sheet" },
  { value: "method", label: "Method Statement" },
  { value: "3d", label: "3D File" },
  { value: "other", label: "Other" },
];

export default function ProductEditModal({ product, onClose }: { product: CatalogProduct; onClose: () => void }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const imageFormRef = useRef<HTMLFormElement>(null);
  const colorFormRef = useRef<HTMLFormElement>(null);
  const sizeFormRef = useRef<HTMLFormElement>(null);
  const specFormRef = useRef<HTMLFormElement>(null);
  const downloadFormRef = useRef<HTMLFormElement>(null);

  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [colorImageFileName, setColorImageFileName] = useState<string | null>(null);
  const [downloadFileName, setDownloadFileName] = useState<string | null>(null);
  const [description, setDescription] = useState(product.description ?? "");
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [sizeVariantsEnabled, setSizeVariantsEnabled] = useState(product.sizeVariantsEnabled);
  const [colorVariantsEnabled, setColorVariantsEnabled] = useState(product.colorVariantsEnabled);

  function run(fn: () => Promise<void>, onDone?: () => void) {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
        onDone?.();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  function handleImageUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!(formData.get("image") as File | null)?.size) {
      setError("Please choose an image file first");
      return;
    }
    run(
      () => addProductImage(product.id, formData),
      () => {
        imageFormRef.current?.reset();
        setImageFileName(null);
      },
    );
  }

  function handleColorAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = String(formData.get("name") ?? "");
    const hex = String(formData.get("hex") ?? "");
    run(
      () => addColorOption(product.id, name, hex, formData),
      () => {
        colorFormRef.current?.reset();
        setColorImageFileName(null);
      },
    );
  }

  function handleSizeAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const label = String(formData.get("label") ?? "");
    run(() => addProductSize(product.id, label), () => sizeFormRef.current?.reset());
  }

  function handleToggleChange(next: { sizeVariantsEnabled: boolean; colorVariantsEnabled: boolean }) {
    setSizeVariantsEnabled(next.sizeVariantsEnabled);
    setColorVariantsEnabled(next.colorVariantsEnabled);
    run(() => updateProductVariantToggles(product.id, next));
  }

  function handleSpecAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const label = String(formData.get("label") ?? "");
    const value = String(formData.get("value") ?? "");
    run(() => addSpec(product.id, label, value), () => specFormRef.current?.reset());
  }

  function handleDownloadUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!(formData.get("file") as File | null)?.size) {
      setError("Please choose a file first");
      return;
    }
    const label = String(formData.get("label") ?? "");
    const kind = String(formData.get("kind") ?? "other");
    run(
      () => addProductDownload(product.id, label, kind, formData),
      () => {
        downloadFormRef.current?.reset();
        setDownloadFileName(null);
      },
    );
  }

  function handleSaveDescription() {
    run(() => updateProductDescription(product.id, description));
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card product-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title" style={{ marginBottom: 0 }}>
            Manage: {product.name}
          </div>
          <div className="modal-close" onClick={onClose}>
            &times;
          </div>
        </div>
        <div className="modal-body">
          {error && <p className="form-error">{error}</p>}

          <div className="modal-section-label">Description</div>
          <textarea
            className="edit-description"
            rows={3}
            placeholder="A short description shown to clients under this product's price..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="edit-inline-form" style={{ marginBottom: 18 }}>
            <button type="button" className="action" disabled={isPending} onClick={handleSaveDescription}>
              Save description
            </button>
          </div>

          <div className="modal-section-label">Images</div>
          {product.images.length === 0 ? (
            <div className="empty">No images uploaded yet - the client sees a placeholder photo.</div>
          ) : (
            <div className="edit-image-grid">
              {product.images.map((img, i) => (
                <div key={img.id} className="edit-image-card">
                  {i === 0 && <div className="edit-thumb-badge">Thumbnail</div>}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.path} alt="" style={{ cursor: "zoom-in" }} onClick={() => setLightboxSrc(img.path)} />
                  <div className="edit-image-actions">
                    <button
                      type="button"
                      disabled={isPending || i === 0}
                      onClick={() => run(() => reorderProductImage(img.id, "up"))}
                    >
                      &uarr;
                    </button>
                    <button
                      type="button"
                      disabled={isPending || i === product.images.length - 1}
                      onClick={() => run(() => reorderProductImage(img.id, "down"))}
                    >
                      &darr;
                    </button>
                    <button
                      type="button"
                      className="danger"
                      disabled={isPending}
                      onClick={() => run(() => deleteProductImage(img.id))}
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <form ref={imageFormRef} onSubmit={handleImageUpload} className="edit-inline-form">
            <label className="file-picker">
              {imageFileName ?? "Choose image file"}
              <input
                type="file"
                name="image"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => setImageFileName(e.target.files?.[0]?.name ?? null)}
              />
            </label>
            <label className="edit-checkbox-label">
              <input type="checkbox" name="thumbnail" />
              Set as thumbnail
            </label>
            <button type="submit" className="action" disabled={isPending}>
              Upload image
            </button>
          </form>

          <div className="modal-section-label">
            Colors{" "}
            <label className="edit-checkbox-label" style={{ fontWeight: 400, marginLeft: 10 }}>
              <input
                type="checkbox"
                checked={colorVariantsEnabled}
                disabled={isPending}
                onChange={(e) => handleToggleChange({ sizeVariantsEnabled, colorVariantsEnabled: e.target.checked })}
              />
              Show on client
            </label>
          </div>
          {product.colorOptions.length === 0 ? (
            <div className="empty">No color options yet - the Color section is hidden for clients.</div>
          ) : (
            <ul className="edit-list">
              {product.colorOptions.map((c) => (
                <li key={c.id}>
                  {c.imagePath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.imagePath}
                      alt={c.name}
                      className="swatch"
                      style={{ display: "inline-block", cursor: "zoom-in", objectFit: "cover" }}
                      onClick={() => setLightboxSrc(c.imagePath)}
                    />
                  ) : (
                    <span className="swatch" style={{ background: c.hex, display: "inline-block" }} />
                  )}
                  {c.name} <span className="sub">{c.hex}</span>
                  <button type="button" className="danger" disabled={isPending} onClick={() => run(() => deleteColorOption(c.id))}>
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          )}
          <form ref={colorFormRef} onSubmit={handleColorAdd} className="edit-inline-form">
            <input type="text" name="name" placeholder="Color name" required />
            <input type="color" name="hex" defaultValue="#9a9187" />
            <label className="file-picker">
              {colorImageFileName ?? "Swatch photo (optional)"}
              <input
                type="file"
                name="image"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => setColorImageFileName(e.target.files?.[0]?.name ?? null)}
              />
            </label>
            <button type="submit" className="action" disabled={isPending}>
              Add color
            </button>
          </form>

          <div className="modal-section-label">
            Sizes{" "}
            <label className="edit-checkbox-label" style={{ fontWeight: 400, marginLeft: 10 }}>
              <input
                type="checkbox"
                checked={sizeVariantsEnabled}
                disabled={isPending}
                onChange={(e) => handleToggleChange({ sizeVariantsEnabled: e.target.checked, colorVariantsEnabled })}
              />
              Show on client
            </label>
          </div>
          {product.sizes.length === 0 ? (
            <div className="empty">No size options yet - the Size section is hidden for clients.</div>
          ) : (
            <ul className="edit-list">
              {product.sizes.map((s, i) => (
                <li key={s.id}>
                  {s.label}
                  <button
                    type="button"
                    disabled={isPending || i === 0}
                    onClick={() => run(() => reorderProductSize(s.id, "up"))}
                  >
                    &uarr;
                  </button>
                  <button
                    type="button"
                    disabled={isPending || i === product.sizes.length - 1}
                    onClick={() => run(() => reorderProductSize(s.id, "down"))}
                  >
                    &darr;
                  </button>
                  <button type="button" className="danger" disabled={isPending} onClick={() => run(() => deleteProductSize(s.id))}>
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          )}
          <form ref={sizeFormRef} onSubmit={handleSizeAdd} className="edit-inline-form">
            <input type="text" name="label" placeholder="Size label, e.g. W1200 X D740 X H750 MM" required />
            <button type="submit" className="action" disabled={isPending}>
              Add size
            </button>
          </form>

          <div className="modal-section-label">Specification rows</div>
          {product.specs.length === 0 ? (
            <div className="empty">No extra spec rows yet.</div>
          ) : (
            <ul className="edit-list">
              {product.specs.map((s) => (
                <li key={s.id}>
                  <b>{s.label}:</b> {s.value}
                  <button type="button" className="danger" disabled={isPending} onClick={() => run(() => deleteSpec(s.id))}>
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          )}
          <form ref={specFormRef} onSubmit={handleSpecAdd} className="edit-inline-form">
            <input type="text" name="label" placeholder="Label, e.g. Warranty" required />
            <input type="text" name="value" placeholder="Value, e.g. 5 years" required />
            <button type="submit" className="action" disabled={isPending}>
              Add row
            </button>
          </form>

          <div className="modal-section-label">Downloads</div>
          {product.downloads.length === 0 ? (
            <div className="empty">No real files uploaded yet - clients get a placeholder download.</div>
          ) : (
            <ul className="edit-list">
              {product.downloads.map((d) => (
                <li key={d.id}>
                  <a href={d.filePath} target="_blank" rel="noopener noreferrer">
                    {d.label}
                  </a>{" "}
                  <span className="sub">({d.kind})</span>
                  <button
                    type="button"
                    className="danger"
                    disabled={isPending}
                    onClick={() => run(() => deleteProductDownload(d.id))}
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          )}
          <form ref={downloadFormRef} onSubmit={handleDownloadUpload} className="edit-inline-form">
            <input type="text" name="label" placeholder="Label, e.g. Data Sheet" required />
            <select name="kind" defaultValue="datasheet">
              {DOWNLOAD_KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
            <label className="file-picker">
              {downloadFileName ?? "Choose file"}
              <input type="file" name="file" onChange={(e) => setDownloadFileName(e.target.files?.[0]?.name ?? null)} />
            </label>
            <button type="submit" className="action" disabled={isPending}>
              Upload file
            </button>
          </form>

          <button type="button" className="modal-addbtn" onClick={onClose} disabled={isPending}>
            {isPending ? "Working..." : "Done"}
          </button>
        </div>
      </div>
      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </div>
  );
}
