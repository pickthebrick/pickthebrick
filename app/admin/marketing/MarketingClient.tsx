"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBanner, toggleBannerActive, deleteBanner } from "@/app/actions/banners";

type Banner = {
  id: string;
  imagePath: string;
  linkUrl: string | null;
  title: string | null;
  active: boolean;
};

export default function MarketingClient({ banners }: { banners: Banner[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createBanner(formData);
        formRef.current?.reset();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not upload banner");
      }
    });
  }

  async function handleToggle(id: string) {
    setBusyId(id);
    await toggleBannerActive(id);
    router.refresh();
    setBusyId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this banner?")) return;
    setBusyId(id);
    await deleteBanner(id);
    router.refresh();
    setBusyId(null);
  }

  return (
    <>
      <div className="banner-upload-card">
        <h2>Add a banner</h2>
        <form ref={formRef} onSubmit={handleSubmit} className="banner-form">
          <input type="file" name="image" accept="image/jpeg,image/png,image/webp,image/gif" required />
          <input type="text" name="title" placeholder="Title (optional, used as alt text)" />
          <input type="url" name="linkUrl" placeholder="Link URL (optional)" />
          {error && <p style={{ color: "#b91c1c", fontSize: 13 }}>{error}</p>}
          <button type="submit" className="action" disabled={isPending}>
            {isPending ? "Uploading..." : "Upload banner"}
          </button>
        </form>
      </div>

      {banners.length === 0 ? (
        <div className="empty">No banners yet.</div>
      ) : (
        <div className="banner-grid">
          {banners.map((b) => (
            <div key={b.id} className="banner-card">
              <div className="banner-card-img-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.imagePath} alt={b.title ?? ""} />
                {!b.active && <div className="banner-inactive-badge">Inactive</div>}
              </div>
              <div className="banner-card-body">
                <div className="banner-card-title">{b.title || "(untitled)"}</div>
                {b.linkUrl && <div className="banner-card-link">{b.linkUrl}</div>}
                <div className="banner-card-actions">
                  <button className="action" disabled={busyId === b.id} onClick={() => handleToggle(b.id)}>
                    {b.active ? "Deactivate" : "Activate"}
                  </button>
                  <button className="action danger" disabled={busyId === b.id} onClick={() => handleDelete(b.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
