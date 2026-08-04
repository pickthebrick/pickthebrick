"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  toggleCategoryEnabled,
  createProduct,
  updateProduct,
  deleteProduct,
  moveProduct,
} from "@/app/actions/products";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  moveCategory,
  createType,
  updateType,
  deleteType,
  moveType,
  createSubtype,
  updateSubtype,
  deleteSubtype,
  moveSubtype,
} from "@/app/actions/catalog";
import type { Catalog } from "@/lib/catalog";
import type { Unit } from "@/app/generated/prisma/enums";
import ProductEditModal from "./ProductEditModal";

const UNIT_OPTIONS: { value: Unit; label: string }[] = [
  { value: "sqm", label: "sqm / sqft" },
  { value: "lm", label: "Linear meter (lm)" },
  { value: "count", label: "Nos. (count)" },
];
const PRODUCT_UNIT_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Same as category" },
  ...UNIT_OPTIONS,
];

export default function ProductsClient({ catalog }: { catalog: Catalog }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const categoryKeys = Object.keys(catalog.categoryMeta);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryKeys[0] ?? null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedSubtype, setSelectedSubtype] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: "", rate: "", unit: "", featured: false });
  const [newProduct, setNewProduct] = useState({ name: "", rate: "", unit: "", featured: false });
  const [manageProductId, setManageProductId] = useState<string | null>(null);

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryDraft, setCategoryDraft] = useState({ label: "", subtitle: "", unit: "sqm" as Unit });
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ label: "", subtitle: "", unit: "sqm" as Unit });

  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [typeDraft, setTypeDraft] = useState("");
  const [addingType, setAddingType] = useState(false);
  const [newTypeLabel, setNewTypeLabel] = useState("");

  const [editingSubtypeId, setEditingSubtypeId] = useState<string | null>(null);
  const [subtypeDraft, setSubtypeDraft] = useState("");
  const [addingSubtype, setAddingSubtype] = useState(false);
  const [newSubtypeLabel, setNewSubtypeLabel] = useState("");

  const categoryMeta = selectedCategory ? catalog.categoryMeta[selectedCategory] : null;
  const types = selectedCategory ? catalog.catalog[selectedCategory] ?? {} : {};
  const typeEntries = Object.entries(types);
  const activeType = selectedType ? types[selectedType] : null;
  const subtypes = activeType?.subtypes ?? {};
  const subtypeEntries = Object.entries(subtypes);
  const activeSubtype = selectedSubtype ? subtypes[selectedSubtype] : null;
  const products = activeSubtype?.products ?? [];
  const manageProduct = manageProductId ? products.find((p) => p.id === manageProductId) ?? null : null;

  function selectCategory(key: string) {
    setSelectedCategory(key);
    setSelectedType(null);
    setSelectedSubtype(null);
    setEditingId(null);
  }
  function selectType(key: string) {
    setSelectedType(key);
    setSelectedSubtype(null);
    setEditingId(null);
  }
  function selectSubtype(key: string) {
    setSelectedSubtype(key);
    setEditingId(null);
    setNewProduct({ name: "", rate: "", unit: "", featured: false });
  }

  async function run(fn: () => Promise<void>) {
    setPending(true);
    setError(null);
    try {
      await fn();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  function startEdit(product: { id: string; name: string; rate: number; rawUnit: Unit | null; featured: boolean }) {
    setEditingId(product.id);
    setDraft({
      name: product.name,
      rate: String(product.rate),
      unit: product.rawUnit ?? "",
      featured: product.featured,
    });
  }

  return (
    <div>
      <h1>Products</h1>
      <p className="sub">Manage the catalog shown to clients on the build page, organized by category.</p>

      {error && <p className="form-error">{error}</p>}

      <div className="products-layout">
        <div className="products-cat-col">
          {categoryKeys.map((key, i) => {
            const meta = catalog.categoryMeta[key];
            const isEditing = editingCategoryId === meta.id;
            if (isEditing) {
              return (
                <div key={key} className="products-add-card">
                  <input
                    type="text"
                    value={categoryDraft.label}
                    onChange={(e) => setCategoryDraft((d) => ({ ...d, label: e.target.value }))}
                    placeholder="Category name"
                  />
                  <input
                    type="text"
                    value={categoryDraft.subtitle}
                    onChange={(e) => setCategoryDraft((d) => ({ ...d, subtitle: e.target.value }))}
                    placeholder="Subtitle"
                    style={{ marginTop: 6 }}
                  />
                  <select
                    value={categoryDraft.unit}
                    onChange={(e) => setCategoryDraft((d) => ({ ...d, unit: e.target.value as Unit }))}
                    style={{ marginTop: 6 }}
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                  <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                    <button
                      className="action"
                      disabled={pending}
                      onClick={() =>
                        run(() => updateCategory(meta.id, categoryDraft.label, categoryDraft.subtitle, categoryDraft.unit)).then(
                          () => setEditingCategoryId(null),
                        )
                      }
                    >
                      Save
                    </button>
                    <button className="action" style={{ background: "var(--muted)" }} onClick={() => setEditingCategoryId(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              );
            }
            return (
              <div key={key} className={`products-cat-btn ${selectedCategory === key ? "active" : ""}`} style={{ cursor: "default" }}>
                <span style={{ cursor: "pointer", flex: 1 }} onClick={() => selectCategory(key)}>
                  {meta.label}
                  {!meta.enabled && <span className="products-disabled-tag">Hidden</span>}
                </span>
                <div className="products-reorder-col">
                  <button type="button" disabled={pending || i === 0} onClick={() => run(() => moveCategory(meta.id, "up"))}>
                    &uarr;
                  </button>
                  <button
                    type="button"
                    disabled={pending || i === categoryKeys.length - 1}
                    onClick={() => run(() => moveCategory(meta.id, "down"))}
                  >
                    &darr;
                  </button>
                </div>
                <div className="products-chip-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategoryId(meta.id);
                      setCategoryDraft({ label: meta.label, subtitle: meta.subtitle ?? "", unit: meta.unit });
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete category "${meta.label}" and everything under it?`)) {
                        run(() => deleteCategory(meta.id)).then(() => {
                          if (selectedCategory === key) selectCategory(categoryKeys.find((k) => k !== key) ?? "");
                        });
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}

          {addingCategory ? (
            <div className="products-add-card">
              <input
                type="text"
                value={newCategory.label}
                onChange={(e) => setNewCategory((d) => ({ ...d, label: e.target.value }))}
                placeholder="Category name"
              />
              <input
                type="text"
                value={newCategory.subtitle}
                onChange={(e) => setNewCategory((d) => ({ ...d, subtitle: e.target.value }))}
                placeholder="Subtitle"
                style={{ marginTop: 6 }}
              />
              <select
                value={newCategory.unit}
                onChange={(e) => setNewCategory((d) => ({ ...d, unit: e.target.value as Unit }))}
                style={{ marginTop: 6 }}
              >
                {UNIT_OPTIONS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
              <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                <button
                  className="action"
                  disabled={pending}
                  onClick={() =>
                    run(() => createCategory(newCategory.label, newCategory.subtitle, newCategory.unit)).then(() => {
                      setAddingCategory(false);
                      setNewCategory({ label: "", subtitle: "", unit: "sqm" });
                    })
                  }
                >
                  Add
                </button>
                <button className="action" style={{ background: "var(--muted)" }} onClick={() => setAddingCategory(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="products-cat-btn" onClick={() => setAddingCategory(true)}>
              + Add category
            </button>
          )}
        </div>

        <div className="products-main-col">
          {categoryMeta && (
            <>
              <div className="products-cat-header">
                <div>
                  <h2>{categoryMeta.label}</h2>
                  {categoryMeta.subtitle && <p className="sub">{categoryMeta.subtitle}</p>}
                </div>
                <label className="products-toggle">
                  <input
                    type="checkbox"
                    checked={categoryMeta.enabled}
                    disabled={pending}
                    onChange={() => run(() => toggleCategoryEnabled(categoryMeta.id))}
                  />
                  Visible to clients
                </label>
              </div>

              <div className="products-chip-row">
                {typeEntries.map(([key, t], i) =>
                  editingTypeId === t.id ? (
                    <span key={key} className="products-add-inline">
                      <input type="text" value={typeDraft} onChange={(e) => setTypeDraft(e.target.value)} />
                      <button
                        className="action"
                        disabled={pending}
                        onClick={() => run(() => updateType(t.id, typeDraft)).then(() => setEditingTypeId(null))}
                      >
                        Save
                      </button>
                      <button className="action" style={{ background: "var(--muted)" }} onClick={() => setEditingTypeId(null)}>
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <div key={key} className={`products-chip ${selectedType === key ? "selected" : ""}`}>
                      <span onClick={() => selectType(key)}>{t.label}</span>
                      <span className="products-chip-actions">
                        <button
                          type="button"
                          disabled={pending || i === 0}
                          onClick={() => run(() => moveType(t.id, "up"))}
                        >
                          &uarr;
                        </button>
                        <button
                          type="button"
                          disabled={pending || i === typeEntries.length - 1}
                          onClick={() => run(() => moveType(t.id, "down"))}
                        >
                          &darr;
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTypeId(t.id);
                            setTypeDraft(t.label);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete type "${t.label}" and everything under it?`)) run(() => deleteType(t.id));
                          }}
                        >
                          Delete
                        </button>
                      </span>
                    </div>
                  ),
                )}
                {addingType ? (
                  <span className="products-add-inline">
                    <input type="text" value={newTypeLabel} onChange={(e) => setNewTypeLabel(e.target.value)} placeholder="Type name" />
                    <button
                      className="action"
                      disabled={pending}
                      onClick={() =>
                        run(() => createType(categoryMeta.id, newTypeLabel)).then(() => {
                          setAddingType(false);
                          setNewTypeLabel("");
                        })
                      }
                    >
                      Add
                    </button>
                    <button className="action" style={{ background: "var(--muted)" }} onClick={() => setAddingType(false)}>
                      Cancel
                    </button>
                  </span>
                ) : (
                  <div className="products-chip" onClick={() => setAddingType(true)}>
                    + Add type
                  </div>
                )}
              </div>

              {activeType && (
                <div className="products-chip-row">
                  {subtypeEntries.map(([key, s], i) =>
                    editingSubtypeId === s.id ? (
                      <span key={key} className="products-add-inline">
                        <input type="text" value={subtypeDraft} onChange={(e) => setSubtypeDraft(e.target.value)} />
                        <button
                          className="action"
                          disabled={pending}
                          onClick={() => run(() => updateSubtype(s.id, subtypeDraft)).then(() => setEditingSubtypeId(null))}
                        >
                          Save
                        </button>
                        <button className="action" style={{ background: "var(--muted)" }} onClick={() => setEditingSubtypeId(null)}>
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <div key={key} className={`products-chip ${selectedSubtype === key ? "selected" : ""}`}>
                        <span onClick={() => selectSubtype(key)}>{s.label}</span>
                        <span className="products-chip-actions">
                          <button
                            type="button"
                            disabled={pending || i === 0}
                            onClick={() => run(() => moveSubtype(s.id, "up"))}
                          >
                            &uarr;
                          </button>
                          <button
                            type="button"
                            disabled={pending || i === subtypeEntries.length - 1}
                            onClick={() => run(() => moveSubtype(s.id, "down"))}
                          >
                            &darr;
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSubtypeId(s.id);
                              setSubtypeDraft(s.label);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete style "${s.label}" and everything under it?`)) run(() => deleteSubtype(s.id));
                            }}
                          >
                            Delete
                          </button>
                        </span>
                      </div>
                    ),
                  )}
                  {addingSubtype ? (
                    <span className="products-add-inline">
                      <input
                        type="text"
                        value={newSubtypeLabel}
                        onChange={(e) => setNewSubtypeLabel(e.target.value)}
                        placeholder="Style name"
                      />
                      <button
                        className="action"
                        disabled={pending}
                        onClick={() =>
                          run(() => createSubtype(activeType.id, newSubtypeLabel)).then(() => {
                            setAddingSubtype(false);
                            setNewSubtypeLabel("");
                          })
                        }
                      >
                        Add
                      </button>
                      <button className="action" style={{ background: "var(--muted)" }} onClick={() => setAddingSubtype(false)}>
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <div className="products-chip" onClick={() => setAddingSubtype(true)}>
                      + Add style
                    </div>
                  )}
                </div>
              )}

              {activeSubtype && (
                <>
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Rate</th>
                        <th>Unit</th>
                        <th>Featured</th>
                        <th>Order</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p, i) => (
                        <tr key={p.id} className={editingId === p.id ? "products-row-editing" : ""}>
                          {editingId === p.id ? (
                            <>
                              <td>
                                <input
                                  className="products-inline-input"
                                  value={draft.name}
                                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                                />
                              </td>
                              <td>
                                <input
                                  className="products-inline-input products-inline-num"
                                  type="number"
                                  value={draft.rate}
                                  onChange={(e) => setDraft((d) => ({ ...d, rate: e.target.value }))}
                                />
                              </td>
                              <td>
                                <select value={draft.unit} onChange={(e) => setDraft((d) => ({ ...d, unit: e.target.value }))}>
                                  {PRODUCT_UNIT_OPTIONS.map((u) => (
                                    <option key={u.value} value={u.value}>
                                      {u.label}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={draft.featured}
                                  onChange={(e) => setDraft((d) => ({ ...d, featured: e.target.checked }))}
                                />
                              </td>
                              <td />
                              <td>
                                <button
                                  className="action"
                                  disabled={pending}
                                  onClick={() =>
                                    run(() =>
                                      updateProduct(
                                        p.id,
                                        draft.name,
                                        parseFloat(draft.rate),
                                        draft.unit ? (draft.unit as Unit) : null,
                                        draft.featured,
                                      ),
                                    ).then(() => setEditingId(null))
                                  }
                                >
                                  Save
                                </button>{" "}
                                <button className="action" style={{ background: "var(--muted)" }} onClick={() => setEditingId(null)}>
                                  Cancel
                                </button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td>
                                {p.name}
                                {p.featured && <span className="products-disabled-tag" style={{ background: "var(--accent)", color: "#fff" }}>Featured</span>}
                              </td>
                              <td>AED {p.rate}</td>
                              <td>{p.rawUnit ?? `${p.unit} (default)`}</td>
                              <td>{p.featured ? "Yes" : "-"}</td>
                              <td>
                                <div className="products-reorder-col">
                                  <button type="button" disabled={pending || i === 0} onClick={() => run(() => moveProduct(p.id, "up"))}>
                                    &uarr;
                                  </button>
                                  <button
                                    type="button"
                                    disabled={pending || i === products.length - 1}
                                    onClick={() => run(() => moveProduct(p.id, "down"))}
                                  >
                                    &darr;
                                  </button>
                                </div>
                              </td>
                              <td>
                                <button className="action" onClick={() => startEdit(p)}>
                                  Edit
                                </button>{" "}
                                <button className="action" style={{ background: "var(--muted)" }} onClick={() => setManageProductId(p.id)}>
                                  Manage
                                </button>{" "}
                                <button
                                  className="action danger"
                                  disabled={pending}
                                  onClick={() => {
                                    if (confirm(`Delete "${p.name}"? This cannot be undone.`)) {
                                      run(() => deleteProduct(p.id));
                                    }
                                  }}
                                >
                                  Delete
                                </button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                      {products.length === 0 && (
                        <tr>
                          <td colSpan={6} className="empty">
                            No products in this style yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  <div className="products-add-card">
                    <h3>Add a product</h3>
                    <div className="banner-form">
                      <input
                        type="text"
                        placeholder="Product name"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct((d) => ({ ...d, name: e.target.value }))}
                      />
                      <input
                        type="text"
                        placeholder="Rate (AED, all-inclusive)"
                        value={newProduct.rate}
                        onChange={(e) => setNewProduct((d) => ({ ...d, rate: e.target.value }))}
                      />
                      <select value={newProduct.unit} onChange={(e) => setNewProduct((d) => ({ ...d, unit: e.target.value }))}>
                        {PRODUCT_UNIT_OPTIONS.map((u) => (
                          <option key={u.value} value={u.value}>
                            {u.label}
                          </option>
                        ))}
                      </select>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5 }}>
                        <input
                          type="checkbox"
                          checked={newProduct.featured}
                          onChange={(e) => setNewProduct((d) => ({ ...d, featured: e.target.checked }))}
                        />
                        Featured
                      </label>
                      <button
                        className="action"
                        disabled={pending}
                        onClick={() =>
                          run(() =>
                            createProduct(
                              activeSubtype.id,
                              newProduct.name,
                              parseFloat(newProduct.rate),
                              newProduct.unit ? (newProduct.unit as Unit) : null,
                              newProduct.featured,
                            ),
                          ).then(() => setNewProduct({ name: "", rate: "", unit: "", featured: false }))
                        }
                      >
                        Add product
                      </button>
                    </div>
                  </div>
                </>
              )}

              {activeType && !activeSubtype && <p className="sub">Choose a style above to see its products.</p>}
              {!activeType && <p className="sub">Choose a type above to see its styles.</p>}
            </>
          )}
        </div>
      </div>

      {manageProduct && <ProductEditModal product={manageProduct} onClose={() => setManageProductId(null)} />}
    </div>
  );
}
