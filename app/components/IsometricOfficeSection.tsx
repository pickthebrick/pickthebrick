"use client";

import { useEffect, useRef } from "react";

// Full-bleed isometric office image as its own parallax section (the user's
// own render - an isometric cutaway of a PickTheBrick fit-out crew at work),
// scrolling at a different rate than the page around it. No text overlay -
// the image is the whole section. Drop the file at public/isometric-office.png
// (or change IMAGE_SRC below) - everything else here is already wired for it.
const IMAGE_SRC = "/isometric-office.png";

export default function IsometricOfficeSection() {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = layerRef.current?.closest(".iso-section") as HTMLElement | null;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (!section) return;
        const rect = section.getBoundingClientRect();
        // -1 (section just below viewport) .. 1 (section just above it) - 0
        // is centered, so the image sits at its resting position when the
        // section is in the middle of the screen.
        const progress = Math.max(-1, Math.min(1, 1 - (rect.top + rect.height / 2) / (window.innerHeight / 2)));
        // Kept well inside the img's own scale(1.1) overscan (see home.css)
        // so this translate never scrolls empty space into view.
        if (layerRef.current) layerRef.current.style.transform = `translate3d(0, ${progress * -30}px, 0)`;
        ticking = false;
      });
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="iso-section">
      <div ref={layerRef} className="iso-bg-layer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={IMAGE_SRC} alt="Isometric cutaway of a PickTheBrick office fit-out in progress" />
      </div>
    </section>
  );
}
