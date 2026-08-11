"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAdmin, deleteAdmin, resendTeamWelcomeEmail, updateAdminEmail } from "@/app/actions/team";

type Admin = { id: string; email: string; fullName: string | null; phone: string | null; role: string; createdAt: Date };
type TeamRole = "admin" | "super_admin" | "marketing" | "captain";

const ROLE_LABEL: Record<TeamRole, string> = {
  admin: "Admin",
  super_admin: "Super Admin",
  marketing: "Marketing",
  captain: "Captain",
};

export default function TeamClient({ admins, currentUserId }: { admins: Admin[]; currentUserId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<TeamRole>("admin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // The row currently being edited, and its in-progress email value - only
  // one row at a time, mirroring the single top-level busy flag below.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await createAdmin({ email, fullName, phone, role });
      setNotice(`Account created - a welcome email with a set-password link was sent to ${email}.`);
      setEmail("");
      setFullName("");
      setPhone("");
      setRole("admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this admin account? This can't be undone.")) return;
    setBusy(true);
    setError(null);
    try {
      await deleteAdmin(id);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete account");
    } finally {
      setBusy(false);
    }
  }

  async function handleResendWelcome(id: string, email: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await resendTeamWelcomeEmail(id);
      setNotice(`Welcome email with a new set-password link was sent to ${email}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend welcome email");
    } finally {
      setBusy(false);
    }
  }

  function startEditEmail(a: Admin) {
    setEditingId(a.id);
    setEditEmail(a.email);
    setError(null);
  }

  async function handleSaveEmail(id: string) {
    setBusy(true);
    setError(null);
    try {
      await updateAdminEmail(id, editEmail);
      setEditingId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update email");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form className="edit-inline-form" onSubmit={handleCreate} style={{ marginBottom: 20 }}>
        <input type="text" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="tel" placeholder="Mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <select value={role} onChange={(e) => setRole(e.target.value as TeamRole)}>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
          <option value="marketing">Marketing</option>
          <option value="captain">Captain</option>
        </select>
        <button type="submit" className="action" disabled={busy}>
          {busy ? "Adding…" : "Add account"}
        </button>
      </form>

      {notice && <p className="sub" style={{ color: "#2f7d4f" }}>{notice}</p>}
      {error && <p className="sub" style={{ color: "#b23b3b" }}>{error}</p>}

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Mobile</th>
            <th>Role</th>
            <th>Added</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {admins.map((a) => (
            <tr key={a.id}>
              <td>{a.fullName ?? "-"}</td>
              <td>
                {editingId === a.id ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      autoFocus
                      style={{ minWidth: 200 }}
                    />
                    <button type="button" className="action" disabled={busy} onClick={() => handleSaveEmail(a.id)}>
                      Save
                    </button>
                    <button type="button" className="action" disabled={busy} onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  a.email
                )}
              </td>
              <td>{a.phone ?? "-"}</td>
              <td>{ROLE_LABEL[a.role as TeamRole] ?? a.role}</td>
              <td>{new Date(a.createdAt).toLocaleDateString()}</td>
              <td>
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  {editingId !== a.id && (
                    <button type="button" className="action" disabled={busy} onClick={() => startEditEmail(a)}>
                      Edit email
                    </button>
                  )}
                  <button type="button" className="action" disabled={busy} onClick={() => handleResendWelcome(a.id, a.email)}>
                    Resend welcome email
                  </button>
                  {a.id !== currentUserId && (
                    <button className="action danger" onClick={() => handleDelete(a.id)} disabled={busy}>
                      Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
