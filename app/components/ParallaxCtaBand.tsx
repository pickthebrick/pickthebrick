import type { ReactNode } from "react";

// Closing-section shell shared by the homepage's final CTA band and the
// Design page's new closing section - a drifting dashed grid behind the
// content, echoing the hero's floorplan-grid motif without needing the
// hero's own scroll-parallax refs (this one just animates on its own via
// CSS, no JS, so it works identically wherever it's dropped in).
export default function ParallaxCtaBand({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section className={`parallax-cta${className ? ` ${className}` : ""}`}>
      <div className="parallax-grid" aria-hidden="true" />
      <div className="parallax-content">{children}</div>
    </section>
  );
}
