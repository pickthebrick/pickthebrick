"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchCatalog, type Catalog, type CatalogProduct } from "@/lib/catalog";
import {
  getOrCreateDraftQuote,
  fetchCartLines,
  upsertCartLine,
  removeCartLine,
  submitQuote,
  type CartLine,
} from "@/lib/quotes";
import "./build.css";

const SQM_TO_SQFT = 10.7639;

export default function BuildPage() {
  const supabase = useMemo(() => createClient(), []);

  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedSubtype, setSelectedSubtype] = useState<string | null>(null);
  const [displayUnit, setDisplayUnit] = useState<"sqm" | "sqft">("sqm");
  const [qtyDraft, setQtyDraft] = useState<Record<string, number>>({});

  const [view, setView] = useState<"build" | "preview" | "success">("build");
  const [confirmingComplete, setConfirmingComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const cartMap = useMemo(() => new Map(cart.map((l) => [l.productId, l])), [cart]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [catalogData, qId] = await Promise.all([fetchCatalog(supabase), getOrCreateDraftQuote(supabase)]);
        const lines = await fetchCartLines(supabase, qId);
        if (cancelled) return;
        setCatalog(catalogData);
        setQuoteId(qId);
        setCart(lines);
        setSelectedCategory(catalogData.enabledCategories[0] ?? null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load catalog");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) {
    return (
      <div className="ptb-build">
        <div className="main">Loading catalog...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="ptb-build">
        <div className="main">Something went wrong: {error}</div>
      </div>
    );
  }
  if (!catalog) return null;

  const categoryMeta = selectedCategory ? catalog.categoryMeta[selectedCategory] ?? null : null;
  const types = selectedCategory ? catalog.catalog[selectedCategory] ?? {} : {};
  const activeType = selectedType ? types[selectedType] ?? null : null;
  const subtypes = activeType?.subtypes ?? {};
  const activeSubtype = selectedSubtype ? subtypes[selectedSubtype] ?? null : null;
  const products = activeSubtype?.products ?? [];
  const isCount = categoryMeta?.unit === "count";

  const materials = cart.reduce((s, l) => s + l.rate * l.qty, 0);
  const install = cart.reduce((s, l) => s + l.install * l.qty, 0);
  const grand = materials + install;

  function selectCategory(key: string) {
    setSelectedCategory(key);
    setSelectedType(null);
    setSelectedSubtype(null);
  }
  function selectType(key: string) {
    setSelectedType(key);
    setSelectedSubtype(null);
  }
  function categoryHasItems(key: string) {
    const label = catalog!.categoryMeta[key]?.label;
    return !!label && cart.some((l) => l.categoryLabel === label);
  }

  function dispQty(baseQty: number) {
    if (isCount) return baseQty;
    return displayUnit === "sqft" ? Math.round(baseQty * SQM_TO_SQFT) : baseQty;
  }
  function baseQtyFromDisplay(displayQty: number) {
    if (isCount) return Math.max(1, Math.round(displayQty));
    const sqm = displayUnit === "sqft" ? displayQty / SQM_TO_SQFT : displayQty;
    return Math.max(0.1, sqm);
  }
  function dispRate(rate: number) {
    if (isCount) return rate;
    return displayUnit === "sqft" ? Math.round((rate / SQM_TO_SQFT) * 100) / 100 : rate;
  }

  async function handleAddToCart(product: CatalogProduct) {
    if (!quoteId || !categoryMeta || !activeType || !activeSubtype) return;
    if (cartMap.has(product.id)) {
      setCart((prev) => prev.filter((l) => l.productId !== product.id));
      removeCartLine(supabase, quoteId, product.id).catch((e) => setError(e.message));
      return;
    }
    const qty = qtyDraft[product.id] ?? (isCount ? 1 : 10);
    const line: CartLine = {
      productId: product.id,
      name: product.name,
      categoryLabel: categoryMeta.label,
      typeLabel: activeType.label,
      subtypeLabel: activeSubtype.label,
      rate: product.rate,
      install: product.install,
      unit: categoryMeta.unit,
      qty,
    };
    setCart((prev) => [...prev, line]);
    upsertCartLine(supabase, quoteId, line).catch((e) => setError(e.message));
  }

  function changeLineQty(productId: string, deltaDisplay: number) {
    setCart((prev) =>
      prev.map((l) => {
        if (l.productId !== productId) return l;
        const newQty =
          l.unit === "count"
            ? Math.max(1, l.qty + deltaDisplay)
            : Math.max(0.1, l.qty + (displayUnit === "sqft" ? deltaDisplay / SQM_TO_SQFT : deltaDisplay));
        const updated = { ...l, qty: newQty };
        if (quoteId) upsertCartLine(supabase, quoteId, updated).catch((e) => setError(e.message));
        return updated;
      })
    );
  }

  function setLineQty(productId: string, displayValue: string) {
    const parsed = parseFloat(displayValue);
    if (Number.isNaN(parsed)) return;
    setCart((prev) =>
      prev.map((l) => {
        if (l.productId !== productId) return l;
        const newQty =
          l.unit === "count" ? Math.max(1, Math.round(parsed)) : Math.max(0.1, displayUnit === "sqft" ? parsed / SQM_TO_SQFT : parsed);
        const updated = { ...l, qty: newQty };
        if (quoteId) upsertCartLine(supabase, quoteId, updated).catch((e) => setError(e.message));
        return updated;
      })
    );
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
    if (quoteId) removeCartLine(supabase, quoteId, productId).catch((e) => setError(e.message));
  }

  async function handleSubmit() {
    if (!quoteId || cart.length === 0) return;
    setSubmitting(true);
    try {
      await submitQuote(supabase, quoteId);
      setView("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit quote");
    } finally {
      setSubmitting(false);
      setConfirmingComplete(false);
    }
  }

  async function downloadPdf() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 50;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("PickTheBrick", 40, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(110, 110, 110);
    doc.text("Office Fitout Aggregator - Dubai, UAE", 40, y + 16);
    doc.setTextColor(58, 61, 66);
    doc.setFontSize(9);
    doc.text("Quotation Date: " + new Date().toLocaleDateString(), pageWidth - 40, y, { align: "right" });
    doc.text("Items: " + cart.length, pageWidth - 40, y + 14, { align: "right" });

    y += 40;
    doc.setDrawColor(220, 220, 220);
    doc.line(40, y, pageWidth - 40, y);
    y += 22;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Item", 40, y);
    doc.text("Category", 200, y);
    doc.text("Qty", 340, y);
    doc.text("Rate", 410, y);
    doc.text("Amount", 480, y);
    y += 8;
    doc.setDrawColor(58, 61, 66);
    doc.line(40, y, pageWidth - 40, y);
    y += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    cart.forEach((l) => {
      const amt = (l.rate + l.install) * l.qty;
      const nameLines = doc.splitTextToSize(l.name, 145);
      doc.text(nameLines, 40, y);
      doc.text(l.categoryLabel, 200, y);
      doc.text(String(l.qty) + (l.unit === "count" ? " pcs" : " sqm"), 340, y);
      doc.text("AED " + l.rate + " +" + l.install, 410, y);
      doc.text("AED " + amt.toLocaleString(), 480, y);
      y += Math.max(16, nameLines.length * 12 + 4);
      doc.setDrawColor(235, 235, 235);
      doc.line(40, y - 6, pageWidth - 40, y - 6);
    });

    y += 10;
    doc.line(320, y, pageWidth - 40, y);
    y += 16;
    doc.setFontSize(10);
    doc.text("Materials Subtotal", 320, y);
    doc.text("AED " + materials.toLocaleString(), 480, y);
    y += 16;
    doc.text("Installation Subtotal", 320, y);
    doc.text("AED " + install.toLocaleString(), 480, y);
    y += 18;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Total", 320, y);
    doc.text("AED " + grand.toLocaleString(), 480, y);

    y += 40;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(140, 140, 140);
    doc.text("Generated by PickTheBrick.", 40, y);

    doc.save("PickTheBrick-Quotation.pdf");
  }

  return (
    <div className="ptb-build">
      <header>
        <div className="brand">PickTheBrick</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div className="cart-pill">
            <span>
              {cart.length} item{cart.length !== 1 ? "s" : ""}
            </span>
            <span className="badge">{cart.length}</span>
          </div>
          <a href="/my-quotes" style={{ fontSize: 13, fontWeight: 600 }}>
            My quotes
          </a>
          <button onClick={handleSignOut} style={{ fontSize: 13, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
            Sign out
          </button>
        </div>
      </header>

      {view === "build" && (
        <div className="layout">
          <div className="rail">
            {Object.entries(catalog.categoryMeta).map(([key, meta]) => {
              const enabled = catalog.enabledCategories.includes(key);
              const active = key === selectedCategory;
              return (
                <div
                  key={key}
                  className={`rail-item ${enabled ? "" : "disabled"} ${active ? "active" : ""}`}
                  onClick={() => enabled && selectCategory(key)}
                >
                  {meta.label}
                  {categoryHasItems(key) && <div className="rail-tick" />}
                  {!enabled && <span style={{ marginLeft: "auto", fontSize: 9 }}>soon</span>}
                </div>
              );
            })}
          </div>

          <div className="main">
            {categoryMeta && (
              <>
                <h1>{categoryMeta.label}</h1>
                <p className="subtitle">{categoryMeta.subtitle}</p>

                <div className="tab-row">
                  {Object.entries(types).map(([key, t]) => (
                    <div key={key} className={`tab-chip ${key === selectedType ? "selected" : ""}`} onClick={() => selectType(key)}>
                      {t.label}
                    </div>
                  ))}
                </div>

                {activeType && (
                  <div className="chip-row">
                    {Object.entries(subtypes).map(([key, s]) => (
                      <div
                        key={key}
                        className={`chip ${key === selectedSubtype ? "selected" : ""}`}
                        onClick={() => setSelectedSubtype(key)}
                      >
                        {s.label}
                      </div>
                    ))}
                  </div>
                )}

                {activeSubtype && (
                  <>
                    {!isCount && (
                      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                        <div style={{ display: "flex", border: "1px solid var(--line)", borderRadius: 20, overflow: "hidden" }}>
                          {(["sqm", "sqft"] as const).map((u) => (
                            <button
                              key={u}
                              onClick={() => setDisplayUnit(u)}
                              style={{
                                border: "none",
                                padding: "6px 14px",
                                fontSize: 11.5,
                                fontWeight: 700,
                                background: displayUnit === u ? "var(--ink)" : "var(--paper)",
                                color: displayUnit === u ? "#fff" : "var(--grey)",
                                cursor: "pointer",
                              }}
                            >
                              {u}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="product-grid">
                      {products.map((p) => {
                        const inCart = cartMap.has(p.id);
                        const qtyBase = qtyDraft[p.id] ?? (isCount ? 1 : 10);
                        return (
                          <div key={p.id} className={`product-card ${inCart ? "selected" : ""}`}>
                            <div className="pname">{p.name}</div>
                            <div className="prate">
                              {isCount ? `AED ${p.rate}/door ` : `AED ${dispRate(p.rate)}/${displayUnit} `}
                              <span className="install">+ AED {isCount ? p.install : dispRate(p.install)} install</span>
                            </div>
                            <div className="pcontrols">
                              <div className="qty-box">
                                <input
                                  type="number"
                                  min={1}
                                  defaultValue={dispQty(qtyBase)}
                                  onChange={(e) =>
                                    setQtyDraft((prev) => ({ ...prev, [p.id]: baseQtyFromDisplay(parseFloat(e.target.value) || 1) }))
                                  }
                                />
                                <span>{isCount ? "pcs" : displayUnit}</span>
                              </div>
                              <button className={`addbtn ${inCart ? "added" : ""}`} onClick={() => handleAddToCart(p)}>
                                {inCart ? "In quote ✓" : "Add to quote"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          <div className="ledger">
            <div className="ledger-head">
              <div className="title">Your Quote</div>
              <div className="cart-count">
                {cart.length} item{cart.length !== 1 ? "s" : ""}
              </div>
            </div>

            {cart.length === 0 ? (
              <div className="ledger-empty">
                No items added yet.
                <br />
                Pick a product on the left to begin.
              </div>
            ) : (
              <div className="cart-items">
                {cart.map((l) => (
                  <div key={l.productId} className="line-item">
                    <div className="li-top">
                      <div className="li-name">{l.name}</div>
                      <div className="li-remove" onClick={() => removeLine(l.productId)}>
                        &times;
                      </div>
                    </div>
                    <div className="li-meta">
                      {l.categoryLabel} &middot; {l.typeLabel} / {l.subtypeLabel}
                    </div>
                    <div className="li-bottom">
                      <div className="li-qty">
                        <button onClick={() => changeLineQty(l.productId, -1)}>&minus;</button>
                        <input
                          value={l.unit === "count" ? l.qty : displayUnit === "sqft" ? Math.round(l.qty * SQM_TO_SQFT) : l.qty}
                          onChange={(e) => setLineQty(l.productId, e.target.value)}
                        />
                        <button onClick={() => changeLineQty(l.productId, 1)}>+</button>
                      </div>
                      <div className="li-amt">AED {((l.rate + l.install) * l.qty).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="ledger-totals">
              <div className="trow">
                <span>Materials</span>
                <span>AED {materials.toLocaleString()}</span>
              </div>
              <div className="trow">
                <span>Installation</span>
                <span>AED {install.toLocaleString()}</span>
              </div>
              <div className="trow grand">
                <span>Total</span>
                <span className="amt">AED {grand.toLocaleString()}</span>
              </div>
            </div>

            <button className="nextbtn" disabled={cart.length === 0} onClick={() => setView("preview")}>
              Review my quote &rarr;
            </button>
          </div>
        </div>
      )}

      {view === "preview" && (
        <div className="preview-wrap">
          <div className="preview-card">
            <div className="back-link" onClick={() => setView("build")}>
              &larr; Back to build
            </div>
            <h2>Review your quote</h2>
            <p className="preview-sub">
              Generated {new Date().toLocaleDateString()} &middot; {cart.length} item{cart.length !== 1 ? "s" : ""}
            </p>

            <table className="preview-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Spec</th>
                  <th style={{ textAlign: "right" }}>Qty</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((l) => (
                  <tr key={l.productId}>
                    <td>
                      <b>{l.name}</b>
                      <br />
                      <span style={{ color: "var(--grey)", fontSize: 11 }}>{l.categoryLabel}</span>
                    </td>
                    <td style={{ color: "var(--grey)" }}>
                      {l.typeLabel} / {l.subtypeLabel}
                    </td>
                    <td className="num">
                      {l.qty} {l.unit === "count" ? "pcs" : "sqm"}
                    </td>
                    <td className="num">AED {((l.rate + l.install) * l.qty).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="preview-totals">
              <div className="trow">
                <span>Materials Subtotal</span>
                <span>AED {materials.toLocaleString()}</span>
              </div>
              <div className="trow">
                <span>Installation Subtotal</span>
                <span>AED {install.toLocaleString()}</span>
              </div>
              <div className="trow grand">
                <span>Total</span>
                <span className="amt">AED {grand.toLocaleString()}</span>
              </div>
            </div>

            {!confirmingComplete ? (
              <div className="action-row">
                <button className="action-btn secondary" onClick={downloadPdf}>
                  Download PDF
                </button>
                <button className="action-btn primary" onClick={() => setConfirmingComplete(true)}>
                  Complete quote
                </button>
              </div>
            ) : (
              <div className="action-row">
                <p style={{ flexBasis: "100%", fontSize: 13, color: "var(--grey)" }}>
                  Confirming saves this quote as final. A PickTheBrick Captain will reach out shortly to get your office
                  moving.
                </p>
                <button className="action-btn secondary" onClick={() => setConfirmingComplete(false)}>
                  Cancel
                </button>
                <button className="action-btn primary" disabled={submitting} onClick={handleSubmit}>
                  {submitting ? "Submitting..." : "Yes, submit quote"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {view === "success" && (
        <div className="preview-wrap">
          <div className="preview-card success-state">
            <div className="icon">&#10003;</div>
            <h2>Quote saved</h2>
            <p>Your PickTheBrick quote is locked in. A Captain from our team will be in touch shortly to help turn this into a real fitout.</p>
            <div className="action-row" style={{ marginTop: 24 }}>
              <a className="action-btn primary" href="/my-quotes" style={{ textDecoration: "none" }}>
                View my quotes
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
