"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { submitJobApplication } from "@/app/actions/careers";

type Posting = {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  employmentType: string | null;
  description: string;
};

export default function CareersClient({ postings }: { postings: Posting[] }) {
  const formRef = useRef<HTMLDivElement>(null);
  const [jobTitle, setJobTitle] = useState("General application");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [coverNote, setCoverNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [postingId, setPostingId] = useState<string | null>(null);

  function applyTo(title: string, id: string | null) {
    setJobTitle(title);
    setPostingId(id);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please attach your CV");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("jobTitle", jobTitle);
      if (postingId) formData.append("jobPostingId", postingId);
      formData.append("fullName", fullName);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("coverNote", coverNote);
      formData.append("cv", file);
      await submitJobApplication(formData);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit your application");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <header>
        <Link href="/" className="brand-mark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="PickTheBrick" />
        </Link>
        <nav>
          <Link href="/">Home</Link>
          <Link href="/design">Design</Link>
          <Link href="/build">Build</Link>
        </nav>
      </header>
      <main>
        <div className="hero">
          <span className="hero-eyebrow">Careers</span>
          <h1>Join the PickTheBrick team</h1>
          <p>We&apos;re building the easiest way to fit out an office in Dubai - here&apos;s where we&apos;re hiring right now.</p>
        </div>

        {postings.length === 0 ? (
          <p className="sub" style={{ textAlign: "center" }}>
            No open roles right now - feel free to send a general application below.
          </p>
        ) : (
          <div className="careers-list">
            {postings.map((p) => (
              <div key={p.id} className="careers-card">
                <h3>{p.title}</h3>
                <p className="careers-meta">
                  {[p.department, p.location, p.employmentType].filter(Boolean).join(" · ") || "Dubai, UAE"}
                </p>
                <p className="careers-desc">{p.description}</p>
                <button type="button" className="package-cta" onClick={() => applyTo(p.title, p.id)}>
                  Apply for this role
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="careers-apply" ref={formRef}>
          <h2>Apply</h2>
          {submitted ? (
            <p className="sub">Thanks - your application has been received. We&apos;ll be in touch if it&apos;s a fit.</p>
          ) : (
            <form onSubmit={handleSubmit} className="careers-form">
              <label>
                Role
                <select value={jobTitle} onChange={(e) => { setJobTitle(e.target.value); setPostingId(postings.find((p) => p.title === e.target.value)?.id ?? null); }}>
                  <option value="General application">General application</option>
                  {postings.map((p) => (
                    <option key={p.id} value={p.title}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Full name
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </label>
              <label>
                Email
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </label>
              <label>
                Phone (optional)
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
              <label>
                Cover note (optional)
                <textarea value={coverNote} onChange={(e) => setCoverNote(e.target.value)} rows={4} />
              </label>
              <label>
                CV (PDF or Word, max 10MB)
                <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
              </label>
              {error && <p className="sub" style={{ color: "#b23b3b" }}>{error}</p>}
              <button type="submit" className="package-cta" disabled={busy}>
                {busy ? "Submitting…" : "Submit application"}
              </button>
            </form>
          )}
        </div>
      </main>
    </>
  );
}
