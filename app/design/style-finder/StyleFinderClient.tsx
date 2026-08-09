"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  STYLE_FINDER_STYLES,
  DECK_SIZE,
  MIN_SHOWN_FOR_CONFIDENT_PICK,
  resolveStyleImages,
} from "@/lib/styleFinder";
import { submitStyleFinderResult } from "@/app/actions/styleFinder";
import AuthGate from "@/app/components/AuthGate";
import "../../marketing.css";

type PoolImage = { styleKey: string; name: string; desc: string; url: string };
type StyleStat = { shown: number; liked: number };
type StyleImageRow = { styleKey: string; slot: number; imageUrl: string };

// Marketer-uploaded photos (see lib/styleFinder.ts's resolveStyleImages) take
// over from the picsum placeholder pool slot by slot - deterministic given
// `images`, so this is safe to compute outside the post-mount effect that
// handles the actually-random deck order below.
function buildImagePool(images: StyleImageRow[]): PoolImage[] {
  const byStyle: Record<string, Record<number, string>> = {};
  for (const row of images) {
    (byStyle[row.styleKey] ??= {})[row.slot] = row.imageUrl;
  }
  return STYLE_FINDER_STYLES.flatMap((s) =>
    resolveStyleImages(s, byStyle[s.key] ?? {}).map((url) => ({ styleKey: s.key, name: s.name, desc: s.desc, url })),
  );
}

function shuffledDeck(pool: PoolImage[]): PoolImage[] {
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(DECK_SIZE, shuffled.length));
}

function emptyStats(): Record<string, StyleStat> {
  return Object.fromEntries(STYLE_FINDER_STYLES.map((s) => [s.key, { shown: 0, liked: 0 }]));
}

function rankStats(stats: Record<string, StyleStat>) {
  return STYLE_FINDER_STYLES.map((s) => ({ key: s.key, name: s.name, ...stats[s.key] }))
    .filter((r) => r.shown > 0)
    .map((r) => ({ ...r, pct: Math.round((r.liked / r.shown) * 100) }))
    .sort((a, b) => b.pct - a.pct || b.liked - a.liked);
}

export default function StyleFinderClient({
  isAnonymous,
  returnTo,
  images,
}: {
  isAnonymous: boolean;
  returnTo: string | null;
  // Marketer-uploaded photos per (style, slot) - see app/design/style-finder/
  // page.tsx and the "Style Finder photos" panel in the marketing dashboard.
  images: StyleImageRow[];
}) {
  const router = useRouter();
  const imagePool = buildImagePool(images);
  // Shuffle order depends on Math.random(), which must never run during SSR
  // (the server and the client's hydration pass would pick different
  // orders, tripping a hydration mismatch) - start empty and populate only
  // after mount, once we're safely client-only.
  const [deckImages, setDeckImages] = useState<PoolImage[]>([]);
  useEffect(() => {
    // Populating client-only randomized state after mount is the fix for
    // the SSR hydration mismatch Math.random() would otherwise cause, not
    // something to restructure away (see the comment above deckImages).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDeckImages(shuffledDeck(imagePool));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [current, setCurrent] = useState(0);
  const [stats, setStats] = useState<Record<string, StyleStat>>(emptyStats);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Only relevant when !returnTo (the standalone entry point) and the
  // visitor is anonymous - the pitch is "create an account, we'll keep your
  // profile, then start your design", not a hard gate (see onCancel below).
  const [showAuth, setShowAuth] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ startX: 0, currentX: 0, dragging: false });

  const visible = deckImages.slice(current, current + 3);

  async function finish(finalStats: Record<string, StyleStat>) {
    setDone(true);
    setSaving(true);
    setError(null);
    try {
      await submitStyleFinderResult(Object.entries(finalStats).map(([styleKey, s]) => ({ styleKey, ...s })));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your style profile");
    } finally {
      setSaving(false);
    }
  }

  function swipe(direction: 1 | -1) {
    if (current >= deckImages.length) return;
    const img = deckImages[current];
    const nextStats: Record<string, StyleStat> = {
      ...stats,
      [img.styleKey]: {
        shown: stats[img.styleKey].shown + 1,
        liked: stats[img.styleKey].liked + (direction > 0 ? 1 : 0),
      },
    };
    setStats(nextStats);

    const card = cardRef.current;
    if (card) {
      card.style.transition = "transform 0.4s ease, opacity 0.4s ease";
      card.style.transform = `translateX(${direction * 500}px) rotate(${direction * 30}deg)`;
      card.style.opacity = "0";
    }
    const next = current + 1;
    setTimeout(() => {
      setCurrent(next);
      if (next >= deckImages.length) finish(nextStats);
    }, 220);
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    drag.current = { startX: e.clientX, currentX: 0, dragging: true };
    e.currentTarget.setPointerCapture(e.pointerId);
    if (cardRef.current) cardRef.current.style.transition = "none";
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current.dragging || !cardRef.current) return;
    const dx = e.clientX - drag.current.startX;
    drag.current.currentX = dx;
    cardRef.current.style.transform = `translateX(${dx}px) rotate(${dx / 14}deg)`;
    const like = cardRef.current.querySelector<HTMLElement>(".sf-stamp.like");
    const nope = cardRef.current.querySelector<HTMLElement>(".sf-stamp.nope");
    if (like) like.style.opacity = String(Math.max(0, dx / 80));
    if (nope) nope.style.opacity = String(Math.max(0, -dx / 80));
  }
  function onPointerUp() {
    if (!drag.current.dragging) return;
    drag.current.dragging = false;
    const dx = drag.current.currentX;
    if (cardRef.current) cardRef.current.style.transition = "transform 0.3s ease";
    if (dx > 90) swipe(1);
    else if (dx < -90) swipe(-1);
    else if (cardRef.current) {
      cardRef.current.style.transform = "";
      const like = cardRef.current.querySelector<HTMLElement>(".sf-stamp.like");
      const nope = cardRef.current.querySelector<HTMLElement>(".sf-stamp.nope");
      if (like) like.style.opacity = "0";
      if (nope) nope.style.opacity = "0";
    }
    drag.current.currentX = 0;
  }

  function restart() {
    setDeckImages(shuffledDeck(imagePool));
    setCurrent(0);
    setStats(emptyStats());
    setDone(false);
    setError(null);
  }

  const ranked = rankStats(stats);
  const confident = ranked.filter((r) => r.shown >= MIN_SHOWN_FOR_CONFIDENT_PICK && r.pct > 0);
  const winner = confident[0] ?? null;

  let headline = "No clear favorite yet";
  let subtext = "Nothing stood out strongly - your designer will present a couple of directions instead of committing to one.";
  if (winner) {
    headline = `Top pick: ${winner.name}`;
    subtext = `Liked in ${winner.pct}% of ${winner.shown} ${winner.name} images shown - a solid enough sample for your designer to start from. Full breakdown below.`;
  } else if (ranked.some((r) => r.liked > 0)) {
    const best = ranked[0];
    headline = `Leaning toward ${best.name}`;
    subtext = `Only shown ${best.shown} time${best.shown === 1 ? "" : "s"} this session, so treat this as a lean, not a confirmed favorite - your designer should present it alongside one alternative.`;
  }

  return (
    <div className="ptb-marketing">
      <header>
        <Link href="/" className="brand-mark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="PickTheBrick" />
        </Link>
        <nav>
          <Link href="/">Home</Link>
          <Link href="/design">Design</Link>
        </nav>
      </header>
      <main>
        <Link href={returnTo ?? "/design"} className="survey-back">
          &larr; Back
        </Link>

        <div className="sf-wrap">
          {!done ? (
            <>
              <div className="sf-head">
                <div className="sf-eyebrow">Style Finder</div>
                <h1>What&apos;s your style?</h1>
                <p>Swipe right on looks you love, left on ones that aren&apos;t you. {DECK_SIZE} quick swipes.</p>
              </div>

              <div className="sf-progress">
                {deckImages.map((_, i) => (
                  <div key={i} className={`sf-progress-seg ${i < current ? "done" : ""}`} />
                ))}
              </div>

              <div className="sf-deck">
                {visible.map((img, i) => {
                  const offset = i;
                  const top = offset === 0;
                  return (
                    <div
                      key={img.url}
                      ref={top ? cardRef : undefined}
                      className="sf-card"
                      style={{
                        transform: `scale(${1 - offset * 0.04}) translateY(${offset * 10}px)`,
                        zIndex: 10 - offset,
                        opacity: offset > 2 ? 0 : 1,
                        cursor: top ? "grab" : "default",
                      }}
                      onPointerDown={top ? onPointerDown : undefined}
                      onPointerMove={top ? onPointerMove : undefined}
                      onPointerUp={top ? onPointerUp : undefined}
                      onPointerCancel={top ? onPointerUp : undefined}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={img.name} className="sf-card-img" draggable={false} />
                      <div className="sf-scrim" />
                      <div className="sf-stamp like">LIKE</div>
                      <div className="sf-stamp nope">NOPE</div>
                      <div className="sf-card-info">
                        <div className="sf-style-name">{img.name}</div>
                        <div className="sf-style-desc">{img.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="sf-controls">
                <button type="button" className="sf-ctrl-btn nope" onClick={() => swipe(-1)} aria-label="Nope">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
                <button type="button" className="sf-ctrl-btn like" onClick={() => swipe(1)} aria-label="Like">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12l5 5L20 6" />
                  </svg>
                </button>
              </div>
              <div className="sf-microcopy">Drag the card, or use the buttons</div>
            </>
          ) : (
            <div className="sf-result">
              <div className="sf-result-icon">✓</div>
              {ranked.length === 0 ? (
                <>
                  <h2>No swipes recorded</h2>
                  <p>Your designer will start from a neutral concept.</p>
                </>
              ) : (
                <>
                  <h2>{headline}</h2>
                  <p>{subtext}</p>
                  <div className="sf-tally">
                    {ranked.map((r) => {
                      const isWinner = winner && r.key === winner.key;
                      const lowSample = r.shown < MIN_SHOWN_FOR_CONFIDENT_PICK;
                      return (
                        <div key={r.key} className="sf-tally-row">
                          <div className="sf-tally-top">
                            <span>
                              {isWinner ? "🏆 " : ""}
                              {r.name}
                              {lowSample && <span className="sf-tally-lowsample"> (low sample)</span>}
                            </span>
                            <span>
                              {r.liked}/{r.shown} liked · {r.pct}%
                            </span>
                          </div>
                          <div className="sf-tally-bar">
                            <div
                              className="sf-tally-fill"
                              style={{ width: `${r.pct}%`, opacity: isWinner ? 1 : 0.55 }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
              {error && (
                <p className="sqft-hint" style={{ textAlign: "center" }}>
                  {error}
                </p>
              )}

              {returnTo ? (
                <Link href={returnTo} className="sf-go">
                  {saving ? "Saving…" : "Continue →"}
                </Link>
              ) : isAnonymous && showAuth ? (
                <AuthGate
                  context="Create an account to save your style profile and start your design"
                  onSuccess={() => router.push("/design")}
                  onCancel={() => setShowAuth(false)}
                />
              ) : isAnonymous ? (
                <>
                  <p className="sqft-hint" style={{ textAlign: "center", marginBottom: 12 }}>
                    Your style profile is saved for this session. Create an account to keep it and let your designer
                    see it, then jump straight into picking a package.
                  </p>
                  <button type="button" className="sf-go" style={{ border: "none", cursor: "pointer" }} onClick={() => setShowAuth(true)}>
                    Save my profile & continue →
                  </button>
                  <Link href="/design" className="sf-restart" style={{ display: "block", marginTop: 10 }}>
                    Skip for now, browse packages →
                  </Link>
                </>
              ) : (
                <Link href="/design" className="sf-go">
                  Continue to package selection →
                </Link>
              )}
              <div className="sf-restart" onClick={restart}>
                Swipe again
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
