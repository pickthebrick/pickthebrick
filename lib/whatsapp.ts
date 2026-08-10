import "server-only";
import { prisma } from "@/lib/prisma";

// Falls back to a console-log stub when the Meta Cloud API credentials
// aren't set (local dev without credentials), mirroring lib/email.ts's
// sendEmail fallback - every call site below stays unchanged either way.
//
// Meta's 24-hour customer service window applies: free-form text (the
// `type: "text"` payload below) only delivers if the recipient has messaged
// this WhatsApp Business number within the last 24h. Proactive notifications
// to someone who hasn't messaged first require a pre-approved message
// template instead (Meta Business Manager > WhatsApp > Message Templates,
// approval takes hours to days) - swap the `text` block for a `template`
// block per-callsite once templates exist for the events that need it.
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

export async function sendWhatsApp({ to, body }: { to: string; body: string }) {
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.log(`[whatsapp] to=${to}\n${body}\n`);
    return;
  }
  const res = await fetch(`https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to.replace(/[^\d]/g, ""),
      type: "text",
      text: { body },
    }),
  });
  if (!res.ok) {
    console.error(`[whatsapp] Meta Cloud API failed to=${to}:`, await res.text());
  }
}

// Proactive OTP delivery (lib/phoneVerification.ts) can't use the plain-text
// path above - Meta only allows free-form text within 24h of the recipient
// messaging first, and a brand-new client verifying their number has never
// messaged this business number at all. This sends Meta's required
// "Authentication" category template instead, which every WhatsApp Business
// account must create and get approved in Meta Business Manager before OTPs
// can actually deliver (WHATSAPP_OTP_TEMPLATE_NAME - see .env.example).
// Falls back to the same console-log stub as sendWhatsApp() until then.
export async function sendWhatsAppOtp(to: string, code: string) {
  const normalized = to.replace(/[^\d]/g, "");
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID || !process.env.WHATSAPP_OTP_TEMPLATE_NAME) {
    console.log(`[whatsapp] to=${to}\nYour PickTheBrick verification code is ${code}. It expires in 10 minutes.\n`);
    return;
  }
  const res = await fetch(`https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: normalized,
      type: "template",
      template: {
        name: process.env.WHATSAPP_OTP_TEMPLATE_NAME,
        language: { code: process.env.WHATSAPP_OTP_TEMPLATE_LANG || "en_US" },
        components: [
          { type: "body", parameters: [{ type: "text", text: code }] },
          { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: code }] },
        ],
      },
    }),
  });
  if (!res.ok) {
    console.error(`[whatsapp] Meta Cloud API OTP send failed to=${to}:`, await res.text());
  }
}

function interpolate(text: string, vars: Record<string, string | number>) {
  return text.replace(/\{\{(\w+)\}\}/g, (_match, key) => (key in vars ? String(vars[key]) : `{{${key}}}`));
}

// Same NotificationTemplate row as sendTemplatedEmail (lib/email.ts) reads
// `emailSubject`/`emailBody` from - this reads `whatsappBody` instead.
// `to` is nullable because most users don't have a whatsappNumber on file
// yet - every call site passes it straight through and this silently skips
// rather than the caller having to guard every call.
export async function sendTemplatedWhatsApp(key: string, to: string | null | undefined, vars: Record<string, string | number> = {}) {
  if (!to) return;
  const template = await prisma.notificationTemplate.findUnique({ where: { key } });
  if (!template) {
    console.warn(`[whatsapp] missing NotificationTemplate for key "${key}"`);
    return;
  }
  await sendWhatsApp({ to, body: interpolate(template.whatsappBody, vars) });
}
