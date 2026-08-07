"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { updateNotificationTemplate } from "@/app/actions/notifications";
import AdminPanel from "../AdminPanel";

type Template = {
  id: string;
  key: string;
  label: string;
  emailSubject: string;
  emailBody: string;
  whatsappBody: string;
};

// Mirrors the source-file split in app/actions/*.ts, purely for grouping the
// admin's view - the templates themselves don't carry a "group" field.
const GROUPS: { title: string; keys: string[] }[] = [
  {
    title: "Quotes",
    keys: [
      "quote_submitted",
      "captain_assigned",
      "captain_reassigned",
      "captain_removed",
      "quote_confirmed",
      "contractor_assigned",
      "quote_approved",
      "quote_paid",
      "contractor_payment_recorded",
    ],
  },
  {
    title: "Design",
    keys: ["design_submitted", "design_delivered", "designer_assigned", "designer_removed"],
  },
  {
    title: "Contractors",
    keys: [
      "contractor_application_received",
      "contractor_application_admin_alert",
      "contractor_application_approved",
      "contractor_application_rejected",
      "contractor_application_blocked",
    ],
  },
  {
    title: "Progress",
    keys: [
      "progress_reported",
      "progress_approved",
      "site_inspection_requested",
      "site_inspection_responded",
      "payment_claim_requested",
      "payment_claim_resolved",
    ],
  },
];

function extractVariables(t: Template) {
  const text = `${t.emailSubject} ${t.emailBody} ${t.whatsappBody}`;
  const matches = text.matchAll(/\{\{(\w+)\}\}/g);
  return Array.from(new Set(Array.from(matches, (m) => m[1])));
}

function TemplateEditor({ template }: { template: Template }) {
  const router = useRouter();
  const [emailSubject, setEmailSubject] = useState(template.emailSubject);
  const [emailBody, setEmailBody] = useState(template.emailBody);
  const [whatsappBody, setWhatsappBody] = useState(template.whatsappBody);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const variables = extractVariables(template);
  const dirty = emailSubject !== template.emailSubject || emailBody !== template.emailBody || whatsappBody !== template.whatsappBody;

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      await updateNotificationTemplate(template.id, { emailSubject, emailBody, whatsappBody });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save template");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ paddingBottom: 6 }}>
      {error && <p className="form-error">{error}</p>}
      {variables.length > 0 && (
        <p className="sub">
          Variables available: {variables.map((v) => `{{${v}}}`).join(", ")}
        </p>
      )}
      <div className="modal-section-label" style={{ marginTop: 0 }}>
        Email subject
      </div>
      <input
        type="text"
        value={emailSubject}
        onChange={(e) => setEmailSubject(e.target.value)}
        style={{ width: "100%", marginBottom: 10 }}
      />
      <div className="modal-section-label">Email body</div>
      <textarea
        className="edit-description"
        rows={3}
        value={emailBody}
        onChange={(e) => setEmailBody(e.target.value)}
      />
      <div className="modal-section-label">WhatsApp message</div>
      <textarea
        className="edit-description"
        rows={3}
        value={whatsappBody}
        onChange={(e) => setWhatsappBody(e.target.value)}
      />
      <button className="action" disabled={!dirty || busy} onClick={handleSave}>
        {busy ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

export default function NotificationsClient({ templates }: { templates: Template[] }) {
  const byKey = useMemo(() => new Map(templates.map((t) => [t.key, t])), [templates]);
  const groupedKeys = new Set(GROUPS.flatMap((g) => g.keys));
  const ungrouped = templates.filter((t) => !groupedKeys.has(t.key));

  return (
    <>
      {GROUPS.map((group) => {
        const rows = group.keys.map((k) => byKey.get(k)).filter((t): t is Template => !!t);
        if (rows.length === 0) return null;
        return (
          <AdminPanel key={group.title} title={group.title} count={rows.length} defaultOpen={false}>
            {rows.map((t) => (
              <AdminPanel key={t.id} title={t.label} defaultOpen={false}>
                <TemplateEditor template={t} />
              </AdminPanel>
            ))}
          </AdminPanel>
        );
      })}
      {ungrouped.length > 0 && (
        <AdminPanel title="Other" count={ungrouped.length} defaultOpen={false}>
          {ungrouped.map((t) => (
            <AdminPanel key={t.id} title={t.label} defaultOpen={false}>
              <TemplateEditor template={t} />
            </AdminPanel>
          ))}
        </AdminPanel>
      )}
    </>
  );
}
