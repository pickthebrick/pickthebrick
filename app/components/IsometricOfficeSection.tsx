"use client";

import { useEffect, useRef } from "react";

// Full-bleed isometric office image (the user's own render - an isometric
// cutaway of a PickTheBrick fit-out crew at work) as the section's only
// element - object-fit:cover fills the whole box on its own, so there's no
// backing layer/color ever visible behind it. Drop the file at
// public/isometric-office.png (or change IMAGE_SRC below) to swap it.
// object-position is centered rather than top: the source PNG's own top
// ~20% is empty white canvas above the illustrated room (measured directly
// off the file), so anchoring to "top" mostly showed that blank margin
// instead of the office scene - centering lands on the actual artwork.
const IMAGE_SRC = "/isometric-office.png";

export default function IsometricOfficeSection() {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const section = imgRef.current?.closest(".iso-section") as HTMLElement | null;
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
        if (imgRef.current) imgRef.current.style.transform = `translate3d(0, ${progress * -30}px, 0)`;
        ticking = false;
      });
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="iso-section">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        className="iso-bg-img"
        src={IMAGE_SRC}
        alt="Isometric cutaway of a PickTheBrick office fit-out in progress"
      />
    </section>
  );
}
