"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { upsertCartItem, removeCartItem, submitQuote, setQuoteDetails } from "@/app/actions/quotes";
import { signOutAction } from "@/app/actions/auth";
import type { Catalog, CatalogProduct } from "@/lib/catalog";
import type { CartLine } from "@/lib/quotes";
import type { Unit } from "@/app/generated/prisma/enums";
import { ProductThumb } from "./ProductThumb";
import ProductModal from "./ProductModal";
import QuoteDetailsModal from "./QuoteDetailsModal";
import TermsSection from "./TermsSection";
import "./build.css";

const SQM_TO_SQFT = 10.7639;

type BannerData = { id: string; imagePath: string; linkUrl: string | null; title: string | null };

// Per-product unit helpers - a subtype can mix units (e.g. mostly sqm with one
// count item), so these take the line/product's own unit instead of closing
// over a single category-wide unit.
function toDisplayQty(baseQty: number, unit: Unit, displayUnit: "sqm" | "sqft") {
  if (unit === "count" || unit === "lm") return baseQty;
  return displayUnit === "sqft" ? Math.round(baseQty * SQM_TO_SQFT) : baseQty;
}
function fromDisplayQty(displayQty: number, unit: Unit, displayUnit: "sqm" | "sqft") {
  if (unit === "count") return Math.max(1, Math.round(displayQty));
  if (unit === "lm") return Math.max(0.1, displayQty);
  const sqm = displayUnit === "sqft" ? displayQty / SQM_TO_SQFT : displayQty;
  return Math.max(0.1, sqm);
}
function toDisplayRate(rate: number, unit: Unit, displayUnit: "sqm" | "sqft") {
  if (unit === "count" || unit === "lm") return rate;
  return displayUnit === "sqft" ? Math.round((rate / SQM_TO_SQFT) * 100) / 100 : rate;
}
// Label for qty/rate inputs that follow the sqm/sqft toggle (grid, modal).
function unitLabel(unit: Unit, displayUnit: "sqm" | "sqft") {
  if (unit === "count") return "Nos";
  if (unit === "lm") return "lm";
  return displayUnit;
}
// Label for contexts that always show the stored BASE quantity (cart summary,
// PDF, preview table) - never toggled to sqft.
function baseUnitLabel(unit: Unit) {
  if (unit === "count") return "Nos";
  if (unit === "lm") return "lm";
  return "sqm";
}

export default function BuildClient({
  catalog,
  quoteId,
  initialCart,
  banners,
  initialLocation,
  initialOfficeSize,
}: {
  catalog: Catalog;
  quoteId: string;
  initialCart: CartLine[];
  banners: BannerData[];
  initialLocation: string | null;
  initialOfficeSize: string | null;
}) {
  const [cart, setCart] = useState<CartLine[]>(initialCart);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState(initialLocation ?? "");
  const [officeSize, setOfficeSize] = useState(initialOfficeSize ?? "");
  const [showDetailsModal, setShowDetailsModal] = useState(!initialLocation || !initialOfficeSize);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(catalog.enabledCategories[0] ?? null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedSubtype, setSelectedSubtype] = useState<string | null>(null);
  const [displayUnit, setDisplayUnit] = useState<"sqm" | "sqft">("sqm");
  const [qtyDraft, setQtyDraft] = useState<Record<string, number>>({});

  const [view, setView] = useState<"build" | "preview" | "success">("build");
  const [confirmingComplete, setConfirmingComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalProductId, setModalProductId] = useState<string | null>(null);

  const cartMap = useMemo(() => new Map(cart.map((l) => [l.productId, l])), [cart]);
  // Flat id -> product lookup so the cart/preview thumbnails (which only
  // store a snapshot, not a live catalog reference) can still show a real
  // uploaded image when one exists.
  const allProductsById = useMemo(() => {
    const map = new Map<string, CatalogProduct>();
    for (const catKey of Object.keys(catalog.catalog)) {
      for (const typeKey of Object.keys(catalog.catalog[catKey])) {
        for (const subKey of Object.keys(catalog.catalog[catKey][typeKey].subtypes)) {
          for (const p of catalog.catalog[catKey][typeKey].subtypes[subKey].products) {
            map.set(p.id, p);
          }
        }
      }
    }
    return map;
  }, [catalog]);

  // Deep-link support: a URL like /build?product=<id> (used by marketing
  // banners) jumps straight to that product's category/type/subtype and
  // opens its detail modal. Runs post-mount (rather than as a lazy useState
  // initializer) so the server-rendered markup matches the client's first
  // paint and only then jumps to the linked product.
  useEffect(() => {
    const productId = new URLSearchParams(window.location.search).get("product");
    if (!productId) return;
    for (const categoryKey of Object.keys(catalog.catalog)) {
      const types = catalog.catalog[categoryKey];
      for (const typeKey of Object.keys(types)) {
        const subtypes = types[typeKey].subtypes;
        for (const subtypeKey of Object.keys(subtypes)) {
          const match = subtypes[subtypeKey].products.some((p) => p.id === productId);
          if (match) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from the URL (an external system) after mount, not a cascading update
            setSelectedCategory(categoryKey);
            setSelectedType(typeKey);
            setSelectedSubtype(subtypeKey);
            setModalProductId(productId);
            window.history.replaceState(null, "", "/build");
            return;
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSignOut() {
    await signOutAction();
    window.location.href = "/login";
  }

  async function handleSaveDetails(loc: string, size: string) {
    await setQuoteDetails(quoteId, loc, size);
    setLocation(loc);
    setOfficeSize(size);
    setShowDetailsModal(false);
  }

  const categoryMeta = selectedCategory ? catalog.categoryMeta[selectedCategory] ?? null : null;
  const types = selectedCategory ? catalog.catalog[selectedCategory] ?? {} : {};
  const activeType = selectedType ? types[selectedType] ?? null : null;
  const subtypes = activeType?.subtypes ?? {};
  const activeSubtype = selectedSubtype ? subtypes[selectedSubtype] ?? null : null;
  const products = activeSubtype?.products ?? [];

  const grand = cart.reduce((s, l) => s + l.rate * l.qty, 0);

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
    const label = catalog.categoryMeta[key]?.label;
    return !!label && cart.some((l) => l.categoryLabel === label);
  }
  function typeHasItems(typeLabel: string) {
    return !!categoryMeta && cart.some((l) => l.categoryLabel === categoryMeta.label && l.typeLabel === typeLabel);
  }
  function subtypeHasItems(typeLabel: string, subtypeLabel: string) {
    return (
      !!categoryMeta &&
      cart.some((l) => l.categoryLabel === categoryMeta.label && l.typeLabel === typeLabel && l.subtypeLabel === subtypeLabel)
    );
  }

  async function handleAddToCart(product: CatalogProduct, baseQtyOverride?: number) {
    if (!categoryMeta || !activeType || !activeSubtype) return;
    if (cartMap.has(product.id)) {
      setCart((prev) => prev.filter((l) => l.productId !== product.id));
      removeCartItem(quoteId, product.id).catch((e) => setError(e.message));
      return;
    }
    const qty = baseQtyOverride ?? qtyDraft[product.id] ?? (product.unit === "count" ? 1 : 10);
    const line: CartLine = {
      productId: product.id,
      name: product.name,
      categoryLabel: categoryMeta.label,
      typeLabel: activeType.label,
      subtypeLabel: activeSubtype.label,
      rate: product.rate,
      unit: product.unit,
      qty,
    };
    setCart((prev) => [...prev, line]);
    upsertCartItem(quoteId, line).catch((e) => setError(e.message));
  }

  function changeLineQty(productId: string, deltaDisplay: number) {
    setCart((prev) =>
      prev.map((l) => {
        if (l.productId !== productId) return l;
        const currentDisplay = toDisplayQty(l.qty, l.unit, displayUnit);
        const updated = { ...l, qty: fromDisplayQty(currentDisplay + deltaDisplay, l.unit, displayUnit) };
        upsertCartItem(quoteId, updated).catch((e) => setError(e.message));
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
        const updated = { ...l, qty: fromDisplayQty(parsed, l.unit, displayUnit) };
        upsertCartItem(quoteId, updated).catch((e) => setError(e.message));
        return updated;
      })
    );
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
    removeCartItem(quoteId, productId).catch((e) => setError(e.message));
  }

  async function handleSubmit() {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      await submitQuote(quoteId);
      setView("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit quote");
    } finally {
      setSubmitting(false);
      setConfirmingComplete(false);
    }
  }

  function quoteSummaryText() {
    const lines = cart
      .map((l) => {
        const amt = l.rate * l.qty;
        return `- ${l.name} (${l.categoryLabel}, ${l.typeLabel} / ${l.subtypeLabel}) x${l.qty}${baseUnitLabel(l.unit)} - AED ${amt.toLocaleString()}`;
      })
      .join("\n");
    const meta = location || officeSize ? `${location || "-"} - ${officeSize || "-"}\n\n` : "";
    return `PickTheBrick Quotation\n\n${meta}${lines}\n\nTotal: AED ${grand.toLocaleString()}\n\n(Placeholder pricing - prototype only)`;
  }

  function shareViaWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(quoteSummaryText())}`, "_blank", "noopener,noreferrer");
  }

  function shareViaEmail() {
    const subject = encodeURIComponent("Your PickTheBrick Quotation");
    const body = encodeURIComponent(quoteSummaryText());
    window.location.assign(`mailto:?subject=${subject}&body=${body}`);
  }

  async function loadImageAsDataUrl(url: string): Promise<{ dataUrl: string; ratio: number } | null> {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const bitmap = await createImageBitmap(blob);
      const ratio = bitmap.width / bitmap.height;
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      return { dataUrl, ratio };
    } catch {
      return null;
    }
  }

  async function downloadPdf() {
    const { jsPDF } = await import("jspdf");
    const { TERMS_AND_CONDITIONS } = await import("@/lib/terms");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const ACCENT: [number, number, number] = [239, 123, 87];
    const INK: [number, number, number] = [58, 54, 50];
    const MUTED: [number, number, number] = [117, 110, 99];
    const LINE: [number, number, number] = [221, 211, 191];

    let y = 44;

    const logo = await loadImageAsDataUrl("/logo.png");
    if (logo) {
      const logoWidth = 90;
      doc.addImage(logo.dataUrl, "PNG", 40, y - 22, logoWidth, logoWidth / logo.ratio);
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(...INK);
      doc.text("PickTheBrick", 40, y);
    }

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.setFontSize(9);
    doc.text("Quotation Date: " + new Date().toLocaleDateString(), pageWidth - 40, y - 10, { align: "right" });
    doc.text("Items: " + cart.length, pageWidth - 40, y + 4, { align: "right" });

    y += 34;
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(1.5);
    doc.line(40, y, pageWidth - 40, y);
    y += 20;

    if (location || officeSize) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(...INK);
      doc.text("Location:", 40, y);
      doc.text("Office size:", 220, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...MUTED);
      doc.text(location || "-", 95, y);
      doc.text(officeSize || "-", 285, y);
      y += 22;
      doc.setDrawColor(...LINE);
      doc.setLineWidth(1);
      doc.line(40, y - 8, pageWidth - 40, y - 8);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    doc.text("Item", 40, y);
    doc.text("Category", 200, y);
    doc.text("Qty", 340, y);
    doc.text("Rate", 410, y);
    doc.text("Amount", 480, y);
    y += 8;
    doc.setDrawColor(...INK);
    doc.setLineWidth(1);
    doc.line(40, y, pageWidth - 40, y);
    y += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    cart.forEach((l) => {
      const amt = l.rate * l.qty;
      const nameLines = doc.splitTextToSize(l.name, 145);
      doc.setTextColor(...INK);
      doc.text(nameLines, 40, y);
      doc.setTextColor(...MUTED);
      doc.text(l.categoryLabel, 200, y);
      doc.text(String(l.qty) + " " + baseUnitLabel(l.unit), 340, y);
      doc.text("AED " + l.rate, 410, y);
      doc.setTextColor(...INK);
      doc.text("AED " + amt.toLocaleString(), 480, y);
      y += Math.max(16, nameLines.length * 12 + 4);
      doc.setDrawColor(...LINE);
      doc.line(40, y - 6, pageWidth - 40, y - 6);
    });

    y += 10;
    doc.setDrawColor(...INK);
    doc.line(320, y, pageWidth - 40, y);
    y += 18;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Total", 320, y);
    doc.setTextColor(...ACCENT);
    doc.text("AED " + grand.toLocaleString(), 480, y);

    y += 40;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text("Placeholder pricing - prototype only. Full terms & conditions on the final page.", 40, y);

    // ---- terms & conditions page ----
    doc.addPage();
    let ty = 50;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...INK);
    doc.text("Terms & Conditions", 40, ty);
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(1.5);
    ty += 12;
    doc.line(40, ty, pageWidth - 40, ty);
    ty += 26;

    TERMS_AND_CONDITIONS.forEach((clause) => {
      const bodyLines = doc.splitTextToSize(clause.body, pageWidth - 80);
      const blockHeight = 16 + bodyLines.length * 12 + 10;
      if (ty + blockHeight > pageHeight - 50) {
        doc.addPage();
        ty = 50;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(...INK);
      doc.text(clause.heading, 40, ty);
      ty += 14;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(...MUTED);
      doc.text(bodyLines, 40, ty);
      ty += bodyLines.length * 12 + 14;
    });

    doc.save("PickTheBrick-Quotation.pdf");
  }

  return (
    <div className="ptb-build">
      <header>
        <Link href="/" className="brand-mark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="PickTheBrick" />
        </Link>
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

      {error && <div style={{ padding: "8px 34px", color: "#b91c1c", fontSize: 13 }}>{error}</div>}

      {location && officeSize && (
        <div className="quote-meta" style={{ margin: "0 34px", borderTop: "none" }}>
          <span>
            📍 <b>{location}</b>
          </span>
          <span>
            Size: <b>{officeSize}</b>
          </span>
          <span className="edit-link" onClick={() => setShowDetailsModal(true)}>
            Edit
          </span>
        </div>
      )}

      {showDetailsModal && (
        <QuoteDetailsModal
          initialLocation={location}
          initialOfficeSize={officeSize}
          onSave={handleSaveDetails}
          onClose={() => setShowDetailsModal(false)}
          dismissable={!!(location && officeSize)}
        />
      )}

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

                <div className="step-hint">Step 1 &middot; Choose a type to see styles</div>
                <div className="tab-row">
                  {Object.entries(types).map(([key, t]) => (
                    <div key={key} className={`tab-chip ${key === selectedType ? "selected" : ""}`} onClick={() => selectType(key)}>
                      {t.label}
                      {typeHasItems(t.label) && <span className="mini-tick" />}
                    </div>
                  ))}
                </div>

                {activeType && (
                  <>
                    <div className="step-hint">Step 2 &middot; Choose a style to see products</div>
                    <div className="chip-row">
                      {Object.entries(subtypes).map(([key, s]) => (
                        <div
                          key={key}
                          className={`chip ${key === selectedSubtype ? "selected" : ""}`}
                          onClick={() => setSelectedSubtype(key)}
                        >
                          {s.label}
                          {subtypeHasItems(activeType.label, s.label) && <span className="mini-tick" />}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {activeSubtype && (
                  <>
                    <div className="step-hint">Step 3 &middot; Add products to your quote</div>
                    {products.some((p) => p.unit === "sqm") && (
                      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                        <div style={{ display: "flex", border: "1px solid var(--line)", overflow: "hidden" }}>
                          {(["sqm", "sqft"] as const).map((u) => (
                            <button
                              key={u}
                              onClick={() => setDisplayUnit(u)}
                              style={{
                                border: "none",
                                padding: "6px 14px",
                                fontSize: 11.5,
                                fontWeight: 700,
                                background: displayUnit === u ? "var(--fg)" : "var(--surface)",
                                color: displayUnit === u ? "#fff" : "var(--muted)",
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
                        const qtyBase = qtyDraft[p.id] ?? (p.unit === "count" ? 1 : 10);
                        return (
                          <div key={p.id} className={`product-card ${inCart ? "selected" : ""}`}>
                            <div className="pimg-wrap" onClick={() => setModalProductId(p.id)}>
                              <ProductThumb seed={p.id} images={p.images.map((i) => i.path)} />
                              {p.featured && <div className="featured-badge">Featured</div>}
                              <div className="expand-hint">View details</div>
                            </div>
                            <div className="pbody">
                              <div className="pname" onClick={() => setModalProductId(p.id)}>
                                {p.name}
                              </div>
                              <div className="prate">AED {toDisplayRate(p.rate, p.unit, displayUnit)}/{unitLabel(p.unit, displayUnit)}</div>
                              <div className="pcontrols">
                                <div className="qty-box">
                                  <input
                                    type="number"
                                    min={p.unit === "count" ? 1 : 0.1}
                                    defaultValue={toDisplayQty(qtyBase, p.unit, displayUnit)}
                                    onChange={(e) =>
                                      setQtyDraft((prev) => ({
                                        ...prev,
                                        [p.id]: fromDisplayQty(parseFloat(e.target.value) || (p.unit === "count" ? 1 : 0.1), p.unit, displayUnit),
                                      }))
                                    }
                                  />
                                  <span>{unitLabel(p.unit, displayUnit)}</span>
                                </div>
                                <button className={`addbtn ${inCart ? "added" : ""}`} onClick={() => handleAddToCart(p)}>
                                  {inCart ? "In quote ✓" : "Add to quote"}
                                </button>
                              </div>
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
                          value={toDisplayQty(l.qty, l.unit, displayUnit)}
                          onChange={(e) => setLineQty(l.productId, e.target.value)}
                        />
                        <button onClick={() => changeLineQty(l.productId, 1)}>+</button>
                      </div>
                      <div className="li-amt">AED {(l.rate * l.qty).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="ledger-totals">
              <div className="trow grand">
                <span>Total</span>
                <span className="amt">AED {grand.toLocaleString()}</span>
              </div>
            </div>

            <button className="nextbtn" disabled={cart.length === 0} onClick={() => setView("preview")}>
              Review my quote &rarr;
            </button>

            {banners.length > 0 && (
              <div className="banner-slot">
                {banners.map((b) => (
                  <a
                    key={b.id}
                    href={b.linkUrl || undefined}
                    target={b.linkUrl ? "_blank" : undefined}
                    rel={b.linkUrl ? "noopener noreferrer" : undefined}
                    className="banner-ad"
                    style={{ pointerEvents: b.linkUrl ? "auto" : "none" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={b.imagePath} alt={b.title ?? ""} />
                  </a>
                ))}
              </div>
            )}
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

            {location && officeSize && (
              <div className="quote-meta">
                <span>
                  📍 <b>{location}</b>
                </span>
                <span>
                  Size: <b>{officeSize}</b>
                </span>
                <span className="edit-link" onClick={() => setShowDetailsModal(true)}>
                  Edit
                </span>
              </div>
            )}

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
                      <div className="item-cell">
                        <div className="item-thumb">
                          <ProductThumb
                            seed={l.productId}
                            images={allProductsById.get(l.productId)?.images.map((i) => i.path)}
                          />
                        </div>
                        <div>
                          <b>{l.name}</b>
                          <br />
                          <span style={{ color: "var(--muted)", fontSize: 11 }}>{l.categoryLabel}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: "var(--muted)" }}>
                      {l.typeLabel} / {l.subtypeLabel}
                    </td>
                    <td className="num">
                      {l.qty} {baseUnitLabel(l.unit)}
                    </td>
                    <td className="num">AED {(l.rate * l.qty).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="preview-totals">
              <div className="trow grand">
                <span>Total</span>
                <span className="amt">AED {grand.toLocaleString()}</span>
              </div>
            </div>

            <div className="share-row">
              <div className="share-btn" onClick={shareViaWhatsApp}>
                Share via WhatsApp
              </div>
              <div className="share-btn" onClick={shareViaEmail}>
                Share via Email
              </div>
            </div>

            <TermsSection agreed={agreedToTerms} onAgreedChange={setAgreedToTerms} />

            {!confirmingComplete ? (
              <div className="action-row">
                <button className="action-btn secondary" onClick={downloadPdf}>
                  Download PDF
                </button>
                <button
                  className="action-btn primary"
                  disabled={!agreedToTerms}
                  title={!agreedToTerms ? "Please agree to the Terms & Conditions first" : undefined}
                  onClick={() => setConfirmingComplete(true)}
                >
                  Complete quote
                </button>
              </div>
            ) : (
              <div className="action-row">
                <p style={{ flexBasis: "100%", fontSize: 13, color: "var(--muted)" }}>
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

      {modalProductId &&
        categoryMeta &&
        activeType &&
        activeSubtype &&
        (() => {
          const p = products.find((prod) => prod.id === modalProductId);
          if (!p) return null;
          const inCart = cartMap.has(p.id);
          const baseQty = qtyDraft[p.id] ?? (p.unit === "count" ? 1 : 10);
          return (
            <ProductModal
              product={{
                id: p.id,
                name: p.name,
                rate: p.rate,
                description: p.description,
                categoryLabel: categoryMeta.label,
                typeLabel: activeType.label,
                subtypeLabel: activeSubtype.label,
                unit: p.unit,
                images: p.images.map((i) => i.path),
                colorOptions: p.colorOptions,
                specs: p.specs,
                downloads: p.downloads,
              }}
              inCart={inCart}
              initialQty={toDisplayQty(baseQty, p.unit, displayUnit)}
              displayUnit={displayUnit}
              onClose={() => setModalProductId(null)}
              onAddToCart={(qty) => {
                const base = fromDisplayQty(qty, p.unit, displayUnit);
                setQtyDraft((prev) => ({ ...prev, [p.id]: base }));
                handleAddToCart(p, base);
                setModalProductId(null);
              }}
            />
          );
        })()}
    </div>
  );
}
