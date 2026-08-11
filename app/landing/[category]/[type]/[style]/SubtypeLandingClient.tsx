"use client";

import Link from "next/link";
import { ProductThumb } from "@/app/build/ProductThumb";
import type { CatalogCategoryMeta, CatalogType, CatalogSubtype } from "@/lib/catalog";
import { getSubtypeContent } from "@/lib/subtypeContent";
import JsonLd, { faqPageSchema } from "@/app/components/JsonLd";
import Breadcrumb from "../../../Breadcrumb";

// The most specific SEO landing page - one "Style" (Subtype). Same showroom
// pattern as the category and type pages above it in the hierarchy, scoped
// to this subtype's own products with its own written copy
// (lib/subtypeContent.ts).
export default function SubtypeLandingClient({
  meta,
  type,
  subtype,
}: {
  meta: CatalogCategoryMeta;
  type: CatalogType;
  subtype: CatalogSubtype;
}) {
  const content = getSubtypeContent(meta.key, type.key, subtype.key, subtype.label, type.label, meta.label);
  const heroImg = `https://picsum.photos/seed/${encodeURIComponent(meta.key + "-" + type.key + "-" + subtype.key + "-hero")}/1600/700`;

  return (
    <>
      <JsonLd data={faqPageSchema(content.faqs)} />
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
            <h1>{subtype.label} {type.label} for Dubai Offices</h1>
            <p>Part of our {type.label.toLowerCase()} range - browse {subtype.label.toLowerCase()} products and add straight to your fitout quote.</p>
            <a href="#products" className="landing-hero-cta">
              Browse {subtype.label.toLowerCase()} products ↓
            </a>
          </div>
        </div>

        <Breadcrumb
          items={[
            { name: meta.label, href: `/landing/${meta.key}` },
            { name: type.label, href: `/landing/${meta.key}/${type.key}` },
            { name: subtype.label },
          ]}
        />

        <section className="landing-section landing-about">
          <h2>About {subtype.label}</h2>
          {content.intro.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </section>

        <section id="products" className="landing-section landing-catalog">
          <h2>{subtype.label} Products</h2>
          {subtype.products.length === 0 ? (
            <div className="landing-empty">No products in this style yet - check back soon.</div>
          ) : (
            <div className="landing-product-grid">
              {subtype.products.map((p) => (
                <Link key={p.id} href={`/build?product=${p.id}`} className="landing-product-card">
                  <div className="landing-product-img">
                    <ProductThumb seed={p.id} images={p.images.map((i) => i.path)} />
                    {p.featured && <div className="landing-featured-badge">Featured</div>}
                  </div>
                  <div className="landing-product-body">
                    <div className="landing-product-sub">{subtype.label}</div>
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
          <h2>Why Choose PickTheBrick for {subtype.label}</h2>
          {content.benefits.map((b, i) => (
            <div key={i} className="landing-feature-row">
              <div className="landing-feature-text">
                <h3>{b.title}</h3>
                <p>{b.body}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="landing-section landing-faq">
          <h2>{subtype.label} FAQs</h2>
          {content.faqs.map((f, i) => (
            <details key={i} className="landing-faq-item">
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </section>

        <section className="landing-cta-band">
          <h2>Ready to add {subtype.label.toLowerCase()} to your quote?</h2>
          <p>See the full {type.label.toLowerCase()} range, or mix and match with any other category in one fitout quote.</p>
          <Link href={`/landing/${meta.key}/${type.key}`} className="landing-hero-cta light">
            Browse all {type.label} ↑
          </Link>
        </section>
      </main>
    </>
  );
}
