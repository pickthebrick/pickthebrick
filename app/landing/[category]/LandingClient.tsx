"use client";

import { useState } from "react";
import Link from "next/link";
import { ProductThumb } from "@/app/build/ProductThumb";
import type { CatalogCategoryMeta, CatalogType } from "@/lib/catalog";
import { getLandingContent } from "@/lib/landingContent";

// Public "showroom" landing page for one catalog category - built to be the
// landing target for social/ads campaigns (see the footer link in
// app/components/SiteFooter.tsx). Pure showcase: no cart/qty controls here,
// each product's CTA deep-links into /build?product=<id>, reusing the
// existing deep-link handling already built into BuildClient.tsx. An
// anonymous visitor clicking through hits the normal login wall
// (proxy.ts's ?next= redirect) and lands back on this exact product.
//
// Heavier on editorial text than a typical product grid, deliberately - this
// is the page ad/social traffic lands on, so the on-page copy (about section,
// benefit blocks, FAQ) is what search engines and first-time visitors read
// before they ever reach the catalog itself.
export default function LandingClient({
  meta,
  types,
}: {
  meta: CatalogCategoryMeta;
  types: Record<string, CatalogType>;
}) {
  const typeEntries = Object.entries(types);
  const [selectedType, setSelectedType] = useState<string | null>(typeEntries[0]?.[0] ?? null);

  const activeType = selectedType ? types[selectedType] : null;
  const products = activeType
    ? Object.values(activeType.subtypes).flatMap((s) => s.products.map((p) => ({ ...p, subtypeLabel: s.label })))
    : [];

  const content = getLandingContent(meta.key, meta.label);
  // Seeded placeholder photography (same "dummy photo service" pattern as
  // ProductThumb) - swap for real category/lifestyle photography once shot.
  const heroImg = `https://picsum.photos/seed/${encodeURIComponent(meta.key + "-hero")}/1600/700`;
  const featureImg = (i: number) => `https://picsum.photos/seed/${encodeURIComponent(meta.key + "-feature-" + i)}/700/560`;

  return (
    <>
      <header>
        <Link href="/" className="brand-mark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="PickTheBrick" />
        </Link>
        <nav>
          <Link href="/">Home</Link>
          <Link href="/build">Build</Link>
        </nav>
      </header>
      <main>
        <div className="landing-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroImg} alt="" className="landing-hero-img" loading="eager" />
          <div className="landing-hero-scrim" />
          <div className="landing-hero-content">
            <span className="landing-badge">✓ Supply &amp; installation included - no separate install charge</span>
            <h1>{meta.label} for Dubai Office Fit-Outs</h1>
            <p>{meta.subtitle ?? "Browse our full range and add straight to your fitout quote."}</p>
            <a href="#products" className="landing-hero-cta">
              Browse the {meta.label.toLowerCase()} range ↓
            </a>
          </div>
        </div>

        <section className="landing-section landing-about">
          <h2>About {meta.label}</h2>
          {content.intro.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </section>

        <section id="products" className="landing-section landing-catalog">
          <h2>Our {meta.label} Range</h2>
          {typeEntries.length > 0 && (
            <div className="landing-type-tabs">
              {typeEntries.map(([key, t]) => (
                <button
                  key={key}
                  className={`landing-type-tab ${key === selectedType ? "selected" : ""}`}
                  onClick={() => setSelectedType(key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {products.length === 0 ? (
            <div className="landing-empty">No products in this style yet - check back soon.</div>
          ) : (
            <div className="landing-product-grid">
              {products.map((p) => (
                <Link key={p.id} href={`/build?product=${p.id}`} className="landing-product-card">
                  <div className="landing-product-img">
                    <ProductThumb seed={p.id} images={p.images.map((i) => i.path)} />
                    {p.featured && <div className="landing-featured-badge">Featured</div>}
                  </div>
                  <div className="landing-product-body">
                    <div className="landing-product-sub">{p.subtypeLabel}</div>
                    <div className="landing-product-name">{p.name}</div>
                    <div className="landing-product-rate">
                      AED {p.rate.toLocaleString()}
                      <span>/{p.unit === "count" ? "unit" : p.unit}, installed</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="landing-section landing-benefits">
          <h2>Why Choose PickTheBrick for {meta.label}</h2>
          {content.benefits.map((b, i) => (
            <div key={i} className={`landing-feature-row ${i % 2 === 1 ? "reverse" : ""}`}>
              <div className="landing-feature-img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={featureImg(i)} alt="" loading="lazy" />
              </div>
              <div className="landing-feature-text">
                <h3>{b.title}</h3>
                <p>{b.body}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="landing-section landing-faq">
          <h2>{meta.label} FAQs</h2>
          {content.faqs.map((f, i) => (
            <details key={i} className="landing-faq-item">
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </section>

        <section className="landing-cta-band">
          <h2>Ready to add {meta.label.toLowerCase()} to your quote?</h2>
          <p>Mix and match with any other category - flooring, partitions, lighting, and more - in one fitout quote.</p>
          <a href="#products" className="landing-hero-cta light">
            Browse the range ↑
          </a>
        </section>
      </main>
    </>
  );
}
