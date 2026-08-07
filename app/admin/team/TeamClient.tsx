"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAdmin, deleteAdmin } from "@/app/actions/team";

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
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<TeamRole>("admin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createAdmin({ email, password, fullName, phone, role });
      setEmail("");
      setPassword("");
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

  return (
    <>
      <form className="edit-inline-form" onSubmit={handleCreate} style={{ marginBottom: 20 }}>
        <input type="text" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="tel" placeholder="Mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <input
          type="password"
          placeholder="Password (min 8 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
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
              <td>{a.email}</td>
              <td>{a.phone ?? "-"}</td>
              <td>{ROLE_LABEL[a.role as TeamRole] ?? a.role}</td>
              <td>{new Date(a.createdAt).toLocaleDateString()}</td>
              <td>
                {a.id !== currentUserId && (
                  <button className="action danger" onClick={() => handleDelete(a.id)} disabled={busy}>
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
