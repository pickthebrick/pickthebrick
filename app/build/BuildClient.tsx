"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  upsertCartItem,
  removeCartItem,
  submitQuote,
  setQuoteDetails,
  startOverDraftQuote,
  captainUpsertCartItem,
  captainRemoveCartItem,
  captainSetQuoteDetails,
} from "@/app/actions/quotes";
import type { Catalog, CatalogProduct } from "@/lib/catalog";
import type { CartLine } from "@/lib/quotes";
import type { Unit } from "@/app/generated/prisma/enums";
import { buildQuotePdf } from "@/lib/quotePdf";
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

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12c0 1.86.5 3.6 1.38 5.1L2 22l5.05-1.33A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2Zm0 18.1a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3 .79.8-2.93-.19-.3A8.1 8.1 0 1 1 20.1 12 8.1 8.1 0 0 1 12 20.1Zm4.44-6.06c-.24-.12-1.44-.71-1.66-.79s-.39-.12-.55.12-.63.79-.78.95-.29.18-.53.06a6.6 6.6 0 0 1-1.95-1.2 7.3 7.3 0 0 1-1.35-1.68c-.14-.24 0-.37.11-.49.11-.11.24-.29.36-.43a1.6 1.6 0 0 0 .24-.4.44.44 0 0 0 0-.42c-.06-.12-.55-1.33-.76-1.82s-.4-.41-.55-.42h-.47a.9.9 0 0 0-.65.3 2.75 2.75 0 0 0-.86 2.05 4.78 4.78 0 0 0 1 2.53 10.9 10.9 0 0 0 4.18 3.7c.58.25 1.04.4 1.4.51a3.36 3.36 0 0 0 1.54.1 2.52 2.52 0 0 0 1.65-1.16 2 2 0 0 0 .14-1.16c-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  );
}
function EmailIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3v12m0 0-4-4m4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function BuildClient({
  catalog,
  quoteId,
  initialCart,
  banners,
  initialLocation,
  initialOfficeSize,
  editAsCaptain = false,
  clientLabel,
}: {
  catalog: Catalog;
  quoteId: string;
  initialCart: CartLine[];
  banners: BannerData[];
  initialLocation: string | null;
  initialOfficeSize: string | null;
  editAsCaptain?: boolean;
  clientLabel?: string;
}) {
  const [cart, setCart] = useState<CartLine[]>(initialCart);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState(initialLocation ?? "");
  const [officeSize, setOfficeSize] = useState(initialOfficeSize ?? "");
  const [showDetailsModal, setShowDetailsModal] = useState(!editAsCaptain && (!initialLocation || !initialOfficeSize));
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // A Captain editing a client's already-confirmed quote uses a parallel set
  // of scoped actions (see assertCaptainOwnsQuote in app/actions/quotes.ts)
  // instead of the client's own draft-only ones - same request shapes, so
  // the rest of this component never needs to branch on editAsCaptain again.
  const doUpsertCartItem = editAsCaptain ? captainUpsertCartItem : upsertCartItem;
  const doRemoveCartItem = editAsCaptain ? captainRemoveCartItem : removeCartItem;
  const doSetQuoteDetails = editAsCaptain ? captainSetQuoteDetails : setQuoteDetails;

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


  async function handleSaveDetails(loc: string, size: string) {
    await doSetQuoteDetails(quoteId, loc, size);
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
      doRemoveCartItem(quoteId, product.id).catch((e) => setError(e.message));
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
    doUpsertCartItem(quoteId, line).catch((e) => setError(e.message));
  }

  function changeLineQty(productId: string, deltaDisplay: number) {
    setCart((prev) =>
      prev.map((l) => {
        if (l.productId !== productId) return l;
        const currentDisplay = toDisplayQty(l.qty, l.unit, displayUnit);
        const updated = { ...l, qty: fromDisplayQty(currentDisplay + deltaDisplay, l.unit, displayUnit) };
        doUpsertCartItem(quoteId, updated).catch((e) => setError(e.message));
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
        doUpsertCartItem(quoteId, updated).catch((e) => setError(e.message));
        return updated;
      })
    );
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
    doRemoveCartItem(quoteId, productId).catch((e) => setError(e.message));
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

  async function downloadPdf() {
    const doc = await buildQuotePdf({
      items: cart.map((l) => ({
        name: l.name,
        categoryLabel: l.categoryLabel,
        rate: l.rate,
        qty: l.qty,
        unitLabel: baseUnitLabel(l.unit),
        imageUrl: allProductsById.get(l.productId)?.images[0]?.path,
        productId: l.productId,
      })),
      grandTotal: grand,
      location,
      officeSize,
    });
    doc.save("PickTheBrick-Quotation.pdf");
  }

  const [confirmingStartOver, setConfirmingStartOver] = useState(false);
  const [startingOver, setStartingOver] = useState(false);

  async function handleStartOver() {
    setStartingOver(true);
    try {
      await startOverDraftQuote(quoteId);
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start over");
      setStartingOver(false);
      setConfirmingStartOver(false);
    }
  }

  return (
    <div className="ptb-build">
      <header>
        <Link href="/" className="brand-mark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="PickTheBrick" />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {editAsCaptain ? (
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              Editing {clientLabel ?? "client"}&apos;s quote
            </span>
          ) : (
            <a href="/my-quotes" style={{ fontSize: 13, fontWeight: 600 }}>
              My quotes
            </a>
          )}
        </div>
      </header>

      {editAsCaptain && (
        <div style={{ padding: "8px 34px", background: "var(--accent-soft, #fff4e5)", fontSize: 12.5 }}>
          You&apos;re editing this quote on the client&apos;s behalf. Changes save immediately and are reflected on
          their dashboard right away.
        </div>
      )}

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
          dismissable={editAsCaptain || !!(location && officeSize)}
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

            {!editAsCaptain &&
              (!confirmingStartOver ? (
                <button
                  className="start-over-btn"
                  disabled={cart.length === 0 && !location && !officeSize}
                  onClick={() => setConfirmingStartOver(true)}
                >
                  Start over
                </button>
              ) : (
                <div className="start-over-confirm">
                  <p>This will delete your current selections. Are you sure?</p>
                  <div className="start-over-confirm-actions">
                    <button className="start-over-confirm-cancel" disabled={startingOver} onClick={() => setConfirmingStartOver(false)}>
                      Cancel
                    </button>
                    <button className="start-over-confirm-yes" disabled={startingOver} onClick={handleStartOver}>
                      {startingOver ? "Clearing..." : "Yes, start over"}
                    </button>
                  </div>
                </div>
              ))}

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

            {editAsCaptain && (
              <div className="share-row">
                <div className="share-btn" onClick={shareViaWhatsApp}>
                  Share via WhatsApp
                </div>
                <div className="share-btn" onClick={shareViaEmail}>
                  Share via Email
                </div>
              </div>
            )}

            {editAsCaptain ? (
              <div className="action-row">
                <button className="action-btn secondary" onClick={downloadPdf}>
                  Download PDF
                </button>
                <button className="action-btn secondary" onClick={() => setView("build")}>
                  &larr; Back to editing
                </button>
                <button
                  className="action-btn primary"
                  onClick={() => {
                    // This is a captain's own new tab opened from their dashboard
                    // (see the "Edit client's quote" link in CaptainClient.tsx) -
                    // closing it returns them straight to the already-open
                    // dashboard tab instead of leaving a second, stale one
                    // behind. Falls back to navigating in place for browsers
                    // that refuse the script-close (e.g. no window.opener).
                    window.close();
                    setTimeout(() => {
                      if (!window.closed) window.location.href = "/captain";
                    }, 300);
                  }}
                >
                  Done — back to project
                </button>
              </div>
            ) : (
              <>
                <TermsSection agreed={agreedToTerms} onAgreedChange={setAgreedToTerms} />

                {!confirmingComplete ? (
                  <div className="action-row">
                    <button className="action-btn secondary" onClick={() => setView("build")}>
                      Edit quote
                    </button>
                    <button
                      className="action-btn primary"
                      disabled={!agreedToTerms}
                      title={!agreedToTerms ? "Please agree to the Terms & Conditions first" : undefined}
                      onClick={() => setConfirmingComplete(true)}
                    >
                      I&apos;m done
                    </button>
                    <button type="button" className="icon-btn" onClick={shareViaWhatsApp} title="Share via WhatsApp" aria-label="Share via WhatsApp">
                      <WhatsAppIcon />
                    </button>
                    <button type="button" className="icon-btn" onClick={shareViaEmail} title="Share via Email" aria-label="Share via Email">
                      <EmailIcon />
                    </button>
                    <button type="button" className="icon-btn" onClick={downloadPdf} title="Download PDF" aria-label="Download PDF">
                      <DownloadIcon />
                    </button>
                  </div>
                ) : (
                  <div className="action-row">
                    <div className="confirm-callout" style={{ flexBasis: "100%" }}>
                      Confirming saves this quote as final. A PickTheBrick Captain will reach out shortly to get your
                      office moving — or get in touch with our team now on{" "}
                      <a href="tel:+971523142272">0523142272</a>.
                    </div>
                    <button className="action-btn secondary" onClick={() => setConfirmingComplete(false)}>
                      Cancel
                    </button>
                    <button className="action-btn primary" disabled={submitting} onClick={handleSubmit}>
                      {submitting ? "Submitting..." : "Yes, I'm done"}
                    </button>
                  </div>
                )}
              </>
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
              <Link className="action-btn secondary" href="/" style={{ textDecoration: "none" }}>
                Go to home page
              </Link>
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
                sizes: p.sizes,
                sizeVariantsEnabled: p.sizeVariantsEnabled,
                colorVariantsEnabled: p.colorVariantsEnabled,
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
