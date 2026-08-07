import "server-only";
import { prisma } from "@/lib/prisma";

// No WhatsApp provider is configured yet - every send just logs to the
// console, mirroring lib/email.ts's sendEmail stub. Swap the body of
// sendWhatsApp for a real provider (e.g. Twilio/Meta Cloud API) once
// credentials are available; every call site below stays unchanged.
export async function sendWhatsApp({ to, body }: { to: string; body: string }) {
  console.log(`[whatsapp] to=${to}\n${body}\n`);
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
