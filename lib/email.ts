import "server-only";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

// Falls back to a console-log stub when RESEND_API_KEY isn't set (local dev
// without credentials) so nothing blocks development - every call site below
// stays unchanged either way.
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "PickTheBrick <hello@pickthebrick.com>";

export async function sendEmail({ to, subject, body }: { to: string; subject: string; body: string }) {
  if (!resend) {
    console.log(`[email] to=${to} subject="${subject}"\n${body}\n`);
    return;
  }
  const { error } = await resend.emails.send({ from: FROM_EMAIL, to, subject, text: body });
  if (error) {
    console.error(`[email] Resend failed to=${to} subject="${subject}":`, error);
  }
}

export function money(amount: number) {
  return `AED ${amount.toLocaleString()}`;
}

function interpolate(text: string, vars: Record<string, string | number>) {
  return text.replace(/\{\{(\w+)\}\}/g, (_match, key) => (key in vars ? String(vars[key]) : `{{${key}}}`));
}

// Every sendXEmail helper below is a thin wrapper around this - it loads the
// event's copy from NotificationTemplate (editable from the admin
// Notifications tab) and fills in {{placeholders}}. A missing template
// (shouldn't happen once prisma/seed.ts has run) just logs and skips rather
// than throwing, so a copy problem never blocks the underlying action.
async function sendTemplatedEmail(key: string, to: string, vars: Record<string, string | number> = {}) {
  const template = await prisma.notificationTemplate.findUnique({ where: { key } });
  if (!template) {
    console.warn(`[email] missing NotificationTemplate for key "${key}"`);
    return;
  }
  await sendEmail({
    to,
    subject: interpolate(template.emailSubject, vars),
    body: interpolate(template.emailBody, vars),
  });
}

// ---------- quotes.ts ----------

export async function sendQuoteSubmittedEmail(to: string) {
  await sendTemplatedEmail("quote_submitted", to);
}

export async function sendQuoteSubmittedAdminAlertEmail(to: string, clientEmail: string, referenceNumber: string) {
  await sendTemplatedEmail("quote_submitted_admin_alert", to, { clientEmail, referenceNumber });
}

export async function sendCaptainAssignedEmail(to: string, quoteId: string) {
  await sendTemplatedEmail("captain_assigned", to, { quoteId });
}

export async function sendCaptainReassignedEmail(to: string, quoteId: string) {
  await sendTemplatedEmail("captain_reassigned", to, { quoteId });
}

export async function sendCaptainRemovedEmail(to: string, quoteId: string) {
  await sendTemplatedEmail("captain_removed", to, { quoteId });
}

export async function sendQuoteConfirmedEmail(to: string) {
  await sendTemplatedEmail("quote_confirmed", to);
}

export async function sendContractorAssignedEmail(to: string, quoteId: string) {
  await sendTemplatedEmail("contractor_assigned", to, { quoteId });
}

export async function sendQuoteApprovedEmail(to: string) {
  await sendTemplatedEmail("quote_approved", to);
}

export async function sendQuotePaidEmail(to: string) {
  await sendTemplatedEmail("quote_paid", to);
}

export async function sendContractorPaymentRecordedEmail(to: string, quoteId: string) {
  await sendTemplatedEmail("contractor_payment_recorded", to, { quoteId });
}

// ---------- design.ts ----------

export async function sendDesignSubmittedEmail(to: string) {
  await sendTemplatedEmail("design_submitted", to);
}

export async function sendDesignDeliveredEmail(to: string) {
  await sendTemplatedEmail("design_delivered", to);
}

export async function sendDesignerAssignedEmail(to: string, requestId: string) {
  await sendTemplatedEmail("designer_assigned", to, { requestId });
}

export async function sendDesignerRemovedEmail(to: string, requestId: string) {
  await sendTemplatedEmail("designer_removed", to, { requestId });
}

// ---------- contractors.ts ----------

export async function sendContractorApplicationReceivedEmail(to: string) {
  await sendTemplatedEmail("contractor_application_received", to);
}

export async function sendContractorApplicationAdminAlertEmail(to: string, applicantEmail: string) {
  await sendTemplatedEmail("contractor_application_admin_alert", to, { applicantEmail });
}

export async function sendContractorApplicationApprovedEmail(to: string) {
  await sendTemplatedEmail("contractor_application_approved", to);
}

export async function sendContractorApplicationRejectedEmail(to: string, note?: string | null) {
  await sendTemplatedEmail("contractor_application_rejected", to, {
    noteLine: note ? ` Note from our team: ${note}` : "",
  });
}

export async function sendContractorApplicationBlockedEmail(to: string, note?: string | null) {
  await sendTemplatedEmail("contractor_application_blocked", to, {
    noteLine: note ? ` Note from our team: ${note}` : "",
  });
}

// ---------- designers.ts ----------

export async function sendDesignerApplicationReceivedEmail(to: string) {
  await sendTemplatedEmail("designer_application_received", to);
}

export async function sendDesignerApplicationAdminAlertEmail(to: string, applicantEmail: string) {
  await sendTemplatedEmail("designer_application_admin_alert", to, { applicantEmail });
}

export async function sendDesignerApplicationApprovedEmail(to: string) {
  await sendTemplatedEmail("designer_application_approved", to);
}

export async function sendDesignerApplicationRejectedEmail(to: string, note?: string | null) {
  await sendTemplatedEmail("designer_application_rejected", to, {
    noteLine: note ? ` Note from our team: ${note}` : "",
  });
}

export async function sendDesignerApplicationBlockedEmail(to: string, note?: string | null) {
  await sendTemplatedEmail("designer_application_blocked", to, {
    noteLine: note ? ` Note from our team: ${note}` : "",
  });
}

// ---------- progress.ts ----------

export async function sendProgressReportedEmail(to: string, quoteId: string) {
  await sendTemplatedEmail("progress_reported", to, { quoteId });
}

export async function sendProgressApprovedEmail(to: string, quoteId: string) {
  await sendTemplatedEmail("progress_approved", to, { quoteId });
}

export async function sendSiteInspectionRequestedEmail(to: string, quoteId: string) {
  await sendTemplatedEmail("site_inspection_requested", to, { quoteId });
}

export async function sendSiteInspectionRespondedEmail(to: string, quoteId: string, status: string) {
  await sendTemplatedEmail("site_inspection_responded", to, { quoteId, status });
}

export async function sendPaymentClaimRequestedEmail(to: string, quoteId: string, amount: number) {
  await sendTemplatedEmail("payment_claim_requested", to, { quoteId, amount: money(amount) });
}

export async function sendPaymentClaimResolvedEmail(to: string, quoteId: string, status: string) {
  await sendTemplatedEmail("payment_claim_resolved", to, { quoteId, status });
}

// ---------- passwordReset.ts ----------

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await sendTemplatedEmail("password_reset", to, { resetUrl });
}

// ---------- careers.ts ----------

// Internal ops notification, not client-facing marketing copy, so this
// skips the editable NotificationTemplate system and just sends directly.
export async function sendJobApplicationReceivedEmail(
  to: string,
  data: { jobTitle: string; fullName: string; email: string; phone?: string | null; coverNote?: string | null; cvUrl: string },
) {
  await sendEmail({
    to,
    subject: `New job application: ${data.jobTitle} - ${data.fullName}`,
    body: [
      `Role applied for: ${data.jobTitle}`,
      `Name: ${data.fullName}`,
      `Email: ${data.email}`,
      data.phone ? `Phone: ${data.phone}` : null,
      data.coverNote ? `\nCover note:\n${data.coverNote}` : null,
      `\nCV: ${data.cvUrl}`,
    ]
      .filter(Boolean)
      .join("\n"),
  });
}
