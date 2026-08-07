"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { updateUserContactInfo } from "@/app/actions/users";

type Base = { id: string; fullName: string | null; email: string; phone: string | null; whatsappNumber: string | null; createdAt: Date };
type Client = Base & { company: string | null; _count: { quotesAsClient: number; designRequestsAsClient: number } };
type Captain = Base & { _count: { quotesAsCaptain: number } };
type Contractor = Base & {
  status: string | null;
  companyName: string | null;
  officeLocation: string | null;
  categories: { label: string; types: string[] }[];
};
type Designer = Base & { _count: { designRequestsAsDesigner: number } };
type Marketer = Base;

type Tab = "client" | "captain" | "contractor" | "designer" | "marketing";

const TABS: { key: Tab; label: string }[] = [
  { key: "client", label: "Clients" },
  { key: "captain", label: "Captains" },
  { key: "contractor", label: "Contractors" },
  { key: "designer", label: "Designers" },
  { key: "marketing", label: "Marketers" },
];

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  blocked: "Blocked",
};

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const csv = [header, ...rows].map((row) => row.map((cell) => csvEscape(String(cell))).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function matchesSearch(base: Base, q: string) {
  if (!q.trim()) return true;
  const haystack = `${base.fullName ?? ""} ${base.email}`.toLowerCase();
  return haystack.includes(q.trim().toLowerCase());
}

export default function AdminDatabaseClient({
  clients,
  captains,
  contractors,
  designers,
  marketers,
}: {
  clients: Client[];
  captains: Captain[];
  contractors: Contractor[];
  designers: Designer[];
  marketers: Marketer[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("client");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [waDrafts, setWaDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveWhatsapp(userId: string) {
    const value = waDrafts[userId];
    if (value === undefined) return;
    setBusy(userId);
    setError(null);
    try {
      await updateUserContactInfo(userId, { whatsappNumber: value });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update WhatsApp number");
    } finally {
      setBusy(null);
    }
  }

  function WhatsappCell({ user }: { user: Base }) {
    const draft = waDrafts[user.id] ?? user.whatsappNumber ?? "";
    return (
      <div style={{ display: "flex", gap: 4 }}>
        <input
          type="text"
          placeholder="WhatsApp number"
          value={draft}
          onChange={(e) => setWaDrafts((prev) => ({ ...prev, [user.id]: e.target.value }))}
          style={{ width: 140 }}
        />
        <button
          className="action"
          disabled={busy === user.id || draft === (user.whatsappNumber ?? "")}
          onClick={() => saveWhatsapp(user.id)}
        >
          Save
        </button>
      </div>
    );
  }

  const filteredClients = useMemo(() => clients.filter((c) => matchesSearch(c, search)), [clients, search]);
  const filteredCaptains = useMemo(() => captains.filter((c) => matchesSearch(c, search)), [captains, search]);
  const filteredDesigners = useMemo(() => designers.filter((c) => matchesSearch(c, search)), [designers, search]);
  const filteredMarketers = useMemo(() => marketers.filter((c) => matchesSearch(c, search)), [marketers, search]);
  const allContractorCategories = useMemo(() => {
    const set = new Set<string>();
    for (const c of contractors) for (const cat of c.categories) set.add(cat.label);
    return Array.from(set).sort();
  }, [contractors]);
  const filteredContractors = useMemo(
    () =>
      contractors.filter((c) => {
        if (!matchesSearch(c, search)) return false;
        if (statusFilter !== "all" && (c.status ?? "none") !== statusFilter) return false;
        if (categoryFilter !== "all" && !c.categories.some((cat) => cat.label === categoryFilter)) return false;
        return true;
      }),
    [contractors, search, statusFilter, categoryFilter],
  );

  function handleExport() {
    if (tab === "client") {
      downloadCsv(
        "clients.csv",
        ["Name", "Email", "Phone", "WhatsApp", "Company", "Quotes", "Design requests", "Joined"],
        filteredClients.map((c) => [
          c.fullName ?? "",
          c.email,
          c.phone ?? "",
          c.whatsappNumber ?? "",
          c.company ?? "",
          c._count.quotesAsClient,
          c._count.designRequestsAsClient,
          new Date(c.createdAt).toLocaleDateString(),
        ]),
      );
    } else if (tab === "captain") {
      downloadCsv(
        "captains.csv",
        ["Name", "Email", "Phone", "WhatsApp", "Assigned projects", "Joined"],
        filteredCaptains.map((c) => [
          c.fullName ?? "",
          c.email,
          c.phone ?? "",
          c.whatsappNumber ?? "",
          c._count.quotesAsCaptain,
          new Date(c.createdAt).toLocaleDateString(),
        ]),
      );
    } else if (tab === "contractor") {
      downloadCsv(
        "contractors.csv",
        ["Name", "Email", "Phone", "WhatsApp", "Company", "Office location", "Categories", "Status", "Joined"],
        filteredContractors.map((c) => [
          c.fullName ?? "",
          c.email,
          c.phone ?? "",
          c.whatsappNumber ?? "",
          c.companyName ?? "",
          c.officeLocation ?? "",
          c.categories.map((cat) => (cat.types.length ? `${cat.label} (${cat.types.join(", ")})` : cat.label)).join("; "),
          c.status ? (STATUS_LABEL[c.status] ?? c.status) : "Not applied",
          new Date(c.createdAt).toLocaleDateString(),
        ]),
      );
    } else if (tab === "designer") {
      downloadCsv(
        "designers.csv",
        ["Name", "Email", "Phone", "WhatsApp", "Design requests", "Joined"],
        filteredDesigners.map((c) => [
          c.fullName ?? "",
          c.email,
          c.phone ?? "",
          c.whatsappNumber ?? "",
          c._count.designRequestsAsDesigner,
          new Date(c.createdAt).toLocaleDateString(),
        ]),
      );
    } else {
      downloadCsv(
        "marketers.csv",
        ["Name", "Email", "Phone", "WhatsApp", "Joined"],
        filteredMarketers.map((c) => [
          c.fullName ?? "",
          c.email,
          c.phone ?? "",
          c.whatsappNumber ?? "",
          new Date(c.createdAt).toLocaleDateString(),
        ]),
      );
    }
  }

  return (
    <>
      {error && <p style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</p>}

      <div className="dash-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`dash-tab ${tab === t.key ? "active" : ""}`}
            onClick={() => {
              setTab(t.key);
              setStatusFilter("all");
              setCategoryFilter("all");
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="edit-inline-form" style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {tab === "contractor" && (
          <>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="none">Not applied</option>
              <option value="pending">Pending review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="blocked">Blocked</option>
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="all">All categories</option>
              {allContractorCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </>
        )}
        <button className="action" onClick={handleExport}>
          Export to Excel (CSV)
        </button>
      </div>

      {tab === "client" &&
        (filteredClients.length === 0 ? (
          <div className="empty">No clients match.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>WhatsApp</th>
                <th>Company</th>
                <th>Quotes</th>
                <th>Design requests</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((c) => (
                <tr key={c.id}>
                  <td>{c.fullName ?? "-"}</td>
                  <td>
                    {c.email}
                    {c.phone && <div className="sub" style={{ marginBottom: 0 }}>{c.phone}</div>}
                  </td>
                  <td>
                    <WhatsappCell user={c} />
                  </td>
                  <td>{c.company ?? "-"}</td>
                  <td>{c._count.quotesAsClient}</td>
                  <td>{c._count.designRequestsAsClient}</td>
                  <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}

      {tab === "captain" &&
        (filteredCaptains.length === 0 ? (
          <div className="empty">No captains match.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>WhatsApp</th>
                <th>Assigned projects</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {filteredCaptains.map((c) => (
                <tr key={c.id}>
                  <td>{c.fullName ?? "-"}</td>
                  <td>
                    {c.email}
                    {c.phone && <div className="sub" style={{ marginBottom: 0 }}>{c.phone}</div>}
                  </td>
                  <td>
                    <WhatsappCell user={c} />
                  </td>
                  <td>{c._count.quotesAsCaptain}</td>
                  <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}

      {tab === "contractor" &&
        (filteredContractors.length === 0 ? (
          <div className="empty">No contractors match.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>WhatsApp</th>
                <th>Company</th>
                <th>Categories</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {filteredContractors.map((c) => (
                <tr key={c.id}>
                  <td>{c.fullName ?? "-"}</td>
                  <td>
                    {c.email}
                    {c.phone && <div className="sub" style={{ marginBottom: 0 }}>{c.phone}</div>}
                  </td>
                  <td>
                    <WhatsappCell user={c} />
                  </td>
                  <td>
                    {c.companyName ?? "-"}
                    {c.officeLocation && <div className="sub" style={{ marginBottom: 0 }}>{c.officeLocation}</div>}
                  </td>
                  <td style={{ maxWidth: 240 }}>
                    {c.categories.length === 0
                      ? "-"
                      : c.categories.map((cat) => (
                          <div key={cat.label} style={{ marginBottom: 2 }}>
                            {cat.label}
                            {cat.types.length > 0 && (
                              <span className="sub" style={{ marginBottom: 0 }}>
                                {" "}
                                ({cat.types.join(", ")})
                              </span>
                            )}
                          </div>
                        ))}
                  </td>
                  <td>
                    {c.status ? (
                      <span className={`status-badge ${c.status}`}>{STATUS_LABEL[c.status] ?? c.status}</span>
                    ) : (
                      "Not applied"
                    )}
                  </td>
                  <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}

      {tab === "designer" &&
        (filteredDesigners.length === 0 ? (
          <div className="empty">No designers match.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>WhatsApp</th>
                <th>Design requests</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {filteredDesigners.map((c) => (
                <tr key={c.id}>
                  <td>{c.fullName ?? "-"}</td>
                  <td>
                    {c.email}
                    {c.phone && <div className="sub" style={{ marginBottom: 0 }}>{c.phone}</div>}
                  </td>
                  <td>
                    <WhatsappCell user={c} />
                  </td>
                  <td>{c._count.designRequestsAsDesigner}</td>
                  <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}

      {tab === "marketing" &&
        (filteredMarketers.length === 0 ? (
          <div className="empty">No marketers match.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>WhatsApp</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {filteredMarketers.map((c) => (
                <tr key={c.id}>
                  <td>{c.fullName ?? "-"}</td>
                  <td>
                    {c.email}
                    {c.phone && <div className="sub" style={{ marginBottom: 0 }}>{c.phone}</div>}
                  </td>
                  <td>
                    <WhatsappCell user={c} />
                  </td>
                  <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}
    </>
  );
}
