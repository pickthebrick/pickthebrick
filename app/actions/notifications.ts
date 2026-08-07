"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/roles";
import { getSession } from "@/lib/auth";

async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");
  if (!isAdminRole(session.role)) throw new Error("Admin only");
  return session;
}

export async function updateNotificationTemplate(
  id: string,
  data: { emailSubject: string; emailBody: string; whatsappBody: string },
) {
  await requireAdmin();
  if (!data.emailSubject.trim() || !data.emailBody.trim() || !data.whatsappBody.trim()) {
    throw new Error("Email subject, email body, and WhatsApp body can't be empty");
  }
  await prisma.notificationTemplate.update({
    where: { id },
    data: {
      emailSubject: data.emailSubject.trim(),
      emailBody: data.emailBody.trim(),
      whatsappBody: data.whatsappBody.trim(),
    },
  });
  revalidatePath("/admin/notifications");
}
