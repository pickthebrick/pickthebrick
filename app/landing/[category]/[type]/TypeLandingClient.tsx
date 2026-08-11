"use client";

import Link from "next/link";
import { ProductThumb } from "@/app/build/ProductThumb";
import type { CatalogCategoryMeta, CatalogType } from "@/lib/catalog";
import { getTypeContent } from "@/lib/typeContent";
import { slugify } from "@/lib/slug";
import JsonLd, { faqPageSchema } from "@/app/components/JsonLd";
import Breadcrumb from "../../Breadcrumb";

// One level more specific than the category page (app/landing/[category]) -
// same "showroom" pattern (see LandingClient.tsx's own header comment) and
// the same deep-link-into-/build product CTA, scoped to a single Type so it
// has its own indexable URL and its own written copy (lib/typeContent.ts).
export default function TypeLandingClient({ meta, type }: { meta: CatalogCategoryMeta; type: CatalogType }) {
  const subtypeEntries = Object.values(type.subtypes);
  const products = subtypeEntries.flatMap((s) => s.products.map((p) => ({ ...p, subtypeLabel: s.label })));
  const content = getTypeContent(meta.key, type.key, type.label, meta.label);

  const heroImg = `https://picsum.photos/seed/${encodeURIComponent(meta.key + "-" + type.key + "-hero")}/1600/700`;
  const featureImg = (i: number) => `https://picsum.photos/seed/${encodeURIComponent(meta.key + "-" + type.key + "-feature-" + i)}/700/560`;

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
            <h1>{type.label} for Dubai Office Fit-Outs</h1>
            <p>Part of our {meta.label.toLowerCase()} range - browse {type.label.toLowerCase()} styles and add straight to your fitout quote.</p>
            <a href="#products" className="landing-hero-cta">
              Browse {type.label.toLowerCase()} styles ↓
            </a>
          </div>
        </div>

        <Breadcrumb items={[{ name: meta.label, href: `/landing/${meta.key}` }, { name: type.label }]} />

        <section className="landing-section landing-about">
          <h2>About {type.label}</h2>
          {content.intro.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </section>

        <section id="products" className="landing-section landing-catalog">
          <h2>{type.label} Styles</h2>
          {subtypeEntries.length > 0 && (
            <div className="landing-type-tabs">
              {subtypeEntries.map((s) => (
                <Link key={s.key} href={`/landing/${meta.key}/${type.key}/${slugify(s.key)}`} className="landing-type-tab">
                  {s.label}
                </Link>
              ))}
            </div>
          )}

          {products.length === 0 ? (
            <div className="landing-empty">No products in this type yet - check back soon.</div>
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
          <h2>Why Choose PickTheBrick for {type.label}</h2>
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
          <h2>{type.label} FAQs</h2>
          {content.faqs.map((f, i) => (
            <details key={i} className="landing-faq-item">
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </section>

        <section className="landing-cta-band">
          <h2>Ready to add {type.label.toLowerCase()} to your quote?</h2>
          <p>
            See the full {meta.label.toLowerCase()} range, or mix and match with any other category in one fitout quote.
          </p>
          <Link href={`/landing/${meta.key}`} className="landing-hero-cta light">
            Browse all {meta.label} ↑
          </Link>
        </section>
      </main>
    </>
  );
}
