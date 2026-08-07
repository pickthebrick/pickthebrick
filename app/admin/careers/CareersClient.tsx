"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createJobPosting, updateJobPosting, toggleJobPostingEnabled, deleteJobPosting } from "@/app/actions/careers";

type Posting = {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  employmentType: string | null;
  description: string;
  enabled: boolean;
};

const EMPTY = { title: "", department: "", location: "", employmentType: "", description: "" };

export default function CareersClient({ postings }: { postings: Posting[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit(p: Posting) {
    setEditingId(p.id);
    setForm({
      title: p.title,
      department: p.department ?? "",
      location: p.location ?? "",
      employmentType: p.employmentType ?? "",
      description: p.description,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (editingId) {
        await updateJobPosting(editingId, form);
      } else {
        await createJobPosting(form);
      }
      cancelEdit();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save posting");
    } finally {
      setBusy(false);
    }
  }

  async function handleToggle(id: string) {
    setBusy(true);
    try {
      await toggleJobPostingEnabled(id);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this posting? Past applications for it are kept.")) return;
    setBusy(true);
    try {
      await deleteJobPosting(id);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form className="edit-inline-form" onSubmit={handleSubmit} style={{ marginBottom: 20, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Job title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          required
        />
        <input
          type="text"
          placeholder="Department (optional)"
          value={form.department}
          onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
        />
        <input
          type="text"
          placeholder="Location (optional)"
          value={form.location}
          onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
        />
        <input
          type="text"
          placeholder="Full-time / Part-time (optional)"
          value={form.employmentType}
          onChange={(e) => setForm((f) => ({ ...f, employmentType: e.target.value }))}
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          required
          style={{ width: "100%" }}
        />
        <button type="submit" className="action" disabled={busy}>
          {editingId ? "Save changes" : "Add posting"}
        </button>
        {editingId && (
          <button type="button" className="action" onClick={cancelEdit} disabled={busy}>
            Cancel
          </button>
        )}
      </form>

      {error && <p className="sub" style={{ color: "#b23b3b" }}>{error}</p>}

      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Department</th>
            <th>Location</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {postings.map((p) => (
            <tr key={p.id}>
              <td>{p.title}</td>
              <td>{p.department ?? "-"}</td>
              <td>{p.location ?? "-"}</td>
              <td>{p.enabled ? "Live" : "Hidden"}</td>
              <td>
                <button className="action" onClick={() => startEdit(p)} disabled={busy}>
                  Edit
                </button>{" "}
                <button className="action" onClick={() => handleToggle(p.id)} disabled={busy}>
                  {p.enabled ? "Hide" : "Show"}
                </button>{" "}
                <button className="action danger" onClick={() => handleDelete(p.id)} disabled={busy}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
