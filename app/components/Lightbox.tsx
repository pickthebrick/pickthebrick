"use client";

// Full-screen click-to-enlarge overlay for a single product image - shared
// between the client Build modal and the admin product image manager so
// "click a photo to enlarge it" behaves identically everywhere.
export default function Lightbox({ src, alt, onClose }: { src: string; alt?: string; onClose: () => void }) {
  return (
    <div className="lightbox-backdrop" onClick={onClose}>
      <button type="button" className="lightbox-close" onClick={onClose} aria-label="Close">
        &times;
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt ?? ""} className="lightbox-img" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}
