"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBanner, toggleBannerActive, deleteBanner, updateAiDesignerBanner } from "@/app/actions/banners";
import { setCategoryImage, removeCategoryImage } from "@/app/actions/catalog";
import AdminPanel from "../AdminPanel";

type Banner = {
  id: string;
  imagePath: string;
  linkUrl: string | null;
  title: string | null;
  active: boolean;
};

type AiDesignerBanner = { headline: string; subText: string; popupMessage: string; backgroundColor: string; enabled: boolean };

type CategoryRow = { id: string; key: string; label: string; imageUrl: string | null };

export default function MarketingClient({
  banners,
  aiDesignerBanner,
  categories,
}: {
  banners: Banner[];
  aiDesignerBanner: AiDesignerBanner;
  categories: CategoryRow[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const [aiHeadline, setAiHeadline] = useState(aiDesignerBanner.headline);
  const [aiSubText, setAiSubText] = useState(aiDesignerBanner.subText);
  const [aiPopup, setAiPopup] = useState(aiDesignerBanner.popupMessage);
  const [aiBackground, setAiBackground] = useState(aiDesignerBanner.backgroundColor);
  const [aiEnabled, setAiEnabled] = useState(aiDesignerBanner.enabled);
  const [aiSaving, setAiSaving] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  async function handleAiSave(e: React.FormEvent) {
    e.preventDefault();
    setAiSaving(true);
    setAiError(null);
    try {
      await updateAiDesignerBanner({
        headline: aiHeadline,
        subText: aiSubText,
        popupMessage: aiPopup,
        backgroundColor: aiBackground,
        enabled: aiEnabled,
      });
      router.refresh();
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Could not save banner");
    } finally {
      setAiSaving(false);
    }
  }

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

  const [catBusyId, setCatBusyId] = useState<string | null>(null);
  const [catError, setCatError] = useState<string | null>(null);

  async function handleCategoryImageChange(categoryId: string, file: File | null) {
    if (!file) return;
    setCatBusyId(categoryId);
    setCatError(null);
    const formData = new FormData();
    formData.set("image", file);
    try {
      await setCategoryImage(categoryId, formData);
      router.refresh();
    } catch (err) {
      setCatError(err instanceof Error ? err.message : "Could not upload image");
    } finally {
      setCatBusyId(null);
    }
  }

  async function handleCategoryImageRemove(categoryId: string) {
    setCatBusyId(categoryId);
    await removeCategoryImage(categoryId);
    router.refresh();
    setCatBusyId(null);
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

      <AdminPanel title="Banners" count={banners.length}>
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
      </AdminPanel>

      <AdminPanel title="AI Designer banner (/design page)" defaultOpen={false}>
        <form className="edit-inline-form" onSubmit={handleAiSave} style={{ flexWrap: "wrap" }}>
          <input type="text" placeholder="Headline" value={aiHeadline} onChange={(e) => setAiHeadline(e.target.value)} />
          <input type="text" placeholder="Sub-line" value={aiSubText} onChange={(e) => setAiSubText(e.target.value)} style={{ minWidth: 320 }} />
          <input type="text" placeholder="Popup message on click" value={aiPopup} onChange={(e) => setAiPopup(e.target.value)} style={{ minWidth: 320 }} />
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            Background
            <input type="color" value={aiBackground} onChange={(e) => setAiBackground(e.target.value)} style={{ width: 40, height: 28, padding: 2, cursor: "pointer" }} />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <input type="checkbox" checked={aiEnabled} onChange={(e) => setAiEnabled(e.target.checked)} />
            Show on /design
          </label>
          {aiError && <p style={{ color: "#b91c1c", fontSize: 13 }}>{aiError}</p>}
          <button type="submit" className="action" disabled={aiSaving}>
            {aiSaving ? "Saving..." : "Save"}
          </button>
        </form>
      </AdminPanel>

      <AdminPanel title="Category tile images (homepage Full Catalog)" count={categories.length}>
        <p className="empty" style={{ padding: "0 0 12px" }}>
          Each tile on the homepage catalog grid shows this photo with the category name over it. Categories without
          a photo yet fall back to placeholder art.
        </p>
        {catError && <p style={{ color: "#b91c1c", fontSize: 13, marginBottom: 10 }}>{catError}</p>}
        <div className="banner-grid">
          {categories.map((c) => (
            <div key={c.id} className="banner-card">
              <div className="banner-card-img-wrap">
                {c.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.imageUrl} alt={c.label} />
                ) : (
                  <div className="empty" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                    No image - using placeholder art
                  </div>
                )}
              </div>
              <div className="banner-card-body">
                <div className="banner-card-title">{c.label}</div>
                <div className="banner-card-actions">
                  <label className="action" style={{ cursor: "pointer" }}>
                    {catBusyId === c.id ? "Uploading..." : c.imageUrl ? "Replace" : "Upload"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      disabled={catBusyId === c.id}
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        handleCategoryImageChange(c.id, file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {c.imageUrl && (
                    <button className="action danger" disabled={catBusyId === c.id} onClick={() => handleCategoryImageRemove(c.id)}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </AdminPanel>
    </>
  );
}
