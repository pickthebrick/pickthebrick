"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CatalogProduct } from "@/lib/catalog";
import {
  addProductImage,
  deleteProductImage,
  reorderProductImage,
  addColorOption,
  deleteColorOption,
  addSpec,
  deleteSpec,
  addProductDownload,
  deleteProductDownload,
  updateProductDescription,
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
  const specFormRef = useRef<HTMLFormElement>(null);
  const downloadFormRef = useRef<HTMLFormElement>(null);

  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [downloadFileName, setDownloadFileName] = useState<string | null>(null);
  const [description, setDescription] = useState(product.description ?? "");

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
    run(() => addColorOption(product.id, name, hex), () => colorFormRef.current?.reset());
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
                  <img src={img.path} alt="" />
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

          <div className="modal-section-label">Colors</div>
          {product.colorOptions.length === 0 ? (
            <div className="empty">No color options yet - the Color section is hidden for clients.</div>
          ) : (
            <ul className="edit-list">
              {product.colorOptions.map((c) => (
                <li key={c.id}>
                  <span className="swatch" style={{ background: c.hex, display: "inline-block" }} />
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
            <button type="submit" className="action" disabled={isPending}>
              Add color
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
    </div>
  );
}
