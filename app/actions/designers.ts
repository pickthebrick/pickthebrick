"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/roles";
import { getSession } from "@/lib/auth";
import { Role, DesignerApplicationStatus } from "@/app/generated/prisma/enums";
import {
  sendDesignerApplicationReceivedEmail,
  sendDesignerApplicationAdminAlertEmail,
  sendDesignerApplicationApprovedEmail,
  sendDesignerApplicationRejectedEmail,
  sendDesignerApplicationBlockedEmail,
} from "@/lib/email";
import { sendTemplatedWhatsApp } from "@/lib/whatsapp";
import { uploadToStorage } from "@/lib/storage";

const CV_EXTENSIONS = new Set(["pdf", "jpg", "jpeg", "png", "doc", "docx"]);

async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");
  return session;
}

async function requireAdmin() {
  const session = await requireSession();
  if (!isAdminRole(session.role)) throw new Error("Admin only");
  return session;
}

function revalidateDesigners() {
  revalidatePath("/designer/apply");
  revalidatePath("/admin/applications");
}

// Submits (or resubmits, if previously rejected) a designer's application -
// mirrors submitContractorApplication in app/actions/contractors.ts. This is
// project-based gig work, not employment (see app/designer/apply/page.tsx's
// copy), so there's no category/type selection - just the applicant's
// Revit/location details, a portfolio link, and a CV (file or link).
export async function submitDesignerApplication(formData: FormData) {
  const session = await requireSession();
  if (session.role !== Role.designer) throw new Error("Only designer accounts can apply");

  const name = (formData.get("name") as string | null)?.trim();
  const location = (formData.get("location") as string | null)?.trim();
  const country = (formData.get("country") as string | null)?.trim();
  const whatsappNumber = (formData.get("whatsappNumber") as string | null)?.trim();
  const portfolioUrl = (formData.get("portfolioUrl") as string | null)?.trim();
  const cvLink = (formData.get("cvLink") as string | null)?.trim();
  const knowsRevit = formData.get("knowsRevit") === "on";

  if (!name || !location || !country || !whatsappNumber || !portfolioUrl) {
    throw new Error("Please fill in your name, location, country, WhatsApp number, and portfolio link");
  }

  const existing = await prisma.designerApplication.findUnique({ where: { designerId: session.id } });
  if (existing && existing.status !== DesignerApplicationStatus.rejected) {
    throw new Error("Your application has already been submitted");
  }

  let cvFilePath = existing?.cvFilePath ?? null;
  const file = formData.get("cv") as File | null;
  if (file && file.size > 0) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!CV_EXTENSIONS.has(ext)) throw new Error("Please upload a PDF, DOC, JPG, or PNG file");
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    cvFilePath = await uploadToStorage("designer-cvs", filename, buffer, file.type);
  } else if (cvLink) {
    cvFilePath = cvLink;
  }
  if (!cvFilePath) throw new Error("Please upload your CV or paste a link to it");

  await prisma.user.update({ where: { id: session.id }, data: { fullName: name, whatsappNumber } });

  if (existing) {
    await prisma.designerApplication.update({
      where: { id: existing.id },
      data: {
        knowsRevit,
        location,
        country,
        whatsappNumber,
        portfolioUrl,
        cvFilePath,
        status: DesignerApplicationStatus.pending,
        submittedAt: new Date(),
        agreedTermsAt: new Date(),
        reviewedAt: null,
        reviewNote: null,
      },
    });
  } else {
    await prisma.designerApplication.create({
      data: {
        designerId: session.id,
        knowsRevit,
        location,
        country,
        whatsappNumber,
        portfolioUrl,
        cvFilePath,
        agreedTermsAt: new Date(),
      },
    });
  }

  const [me, admins] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.id } }),
    prisma.user.findMany({ where: { role: Role.admin } }),
  ]);
  if (me) {
    await sendDesignerApplicationReceivedEmail(me.email);
    await sendTemplatedWhatsApp("designer_application_received", me.whatsappNumber);
    for (const admin of admins) {
      await sendDesignerApplicationAdminAlertEmail(admin.email, me.email);
      await sendTemplatedWhatsApp("designer_application_admin_alert", admin.whatsappNumber, { applicantEmail: me.email });
    }
  }
  revalidateDesigners();
}

// Lets a designer withdraw their own application (at any status) and start
// over - mirrors deleteContractorApplication.
export async function deleteDesignerApplication() {
  const session = await requireSession();
  if (session.role !== Role.designer) throw new Error("Only designer accounts can do this");

  await prisma.designerApplication.deleteMany({ where: { designerId: session.id } });
  revalidateDesigners();
}

// Freeform status setter - mirrors setContractorApplicationStatus.
export async function setDesignerApplicationStatus(applicationId: string, status: DesignerApplicationStatus, note?: string) {
  await requireAdmin();
  const application = await prisma.designerApplication.update({
    where: { id: applicationId },
    data: { status, reviewedAt: new Date(), reviewNote: note?.trim() || null },
    include: { designer: true },
  });

  if (status === DesignerApplicationStatus.approved) {
    await sendDesignerApplicationApprovedEmail(application.designer.email);
    await sendTemplatedWhatsApp("designer_application_approved", application.designer.whatsappNumber);
  } else if (status === DesignerApplicationStatus.rejected) {
    await sendDesignerApplicationRejectedEmail(application.designer.email, application.reviewNote);
    await sendTemplatedWhatsApp("designer_application_rejected", application.designer.whatsappNumber, {
      noteLine: application.reviewNote ? ` Note from our team: ${application.reviewNote}` : "",
    });
  } else if (status === DesignerApplicationStatus.blocked) {
    await sendDesignerApplicationBlockedEmail(application.designer.email, application.reviewNote);
    await sendTemplatedWhatsApp("designer_application_blocked", application.designer.whatsappNumber, {
      noteLine: application.reviewNote ? ` Note from our team: ${application.reviewNote}` : "",
    });
  }
  revalidateDesigners();
}
