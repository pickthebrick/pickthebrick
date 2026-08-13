"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/roles";
import { getSession } from "@/lib/auth";
import { Role, ContractorApplicationStatus } from "@/app/generated/prisma/enums";
import {
  sendContractorApplicationReceivedEmail,
  sendContractorApplicationAdminAlertEmail,
  sendContractorApplicationApprovedEmail,
  sendContractorApplicationRejectedEmail,
  sendContractorApplicationBlockedEmail,
} from "@/lib/email";
import { sendTemplatedWhatsApp } from "@/lib/whatsapp";
import { uploadToStorage } from "@/lib/storage";

const LICENSE_EXTENSIONS = new Set(["pdf", "jpg", "jpeg", "png"]);
const LOGO_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
const MAX_LOGO_BYTES = 5 * 1024 * 1024;

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

function revalidateContractors() {
  revalidatePath("/contractor/apply");
  revalidatePath("/admin/applications");
}

// Submits (or resubmits, if previously rejected) a contractor's application:
// which catalog categories (and, within each, which types) they cover, plus
// a trade license upload. Every checked category must have at least one
// type selected - no category-only fallback (see assertAssignableContractor
// in app/actions/timeline.ts, which checks type-level approval).
export async function submitContractorApplication(categoryIds: string[], typeIds: string[], formData: FormData) {
  const session = await requireSession();
  if (session.role !== Role.contractor) throw new Error("Only contractor accounts can apply");
  if (categoryIds.length === 0) throw new Error("Select at least one category");

  const types = await prisma.type.findMany({ where: { id: { in: typeIds } }, select: { id: true, categoryId: true } });
  if (types.length !== typeIds.length) throw new Error("One of the selected types no longer exists");
  const categoryIdSet = new Set(categoryIds);
  for (const type of types) {
    if (!categoryIdSet.has(type.categoryId)) throw new Error("Types must belong to a checked category");
  }
  const typeCategoryIds = new Set(types.map((t) => t.categoryId));
  for (const categoryId of categoryIds) {
    if (!typeCategoryIds.has(categoryId)) throw new Error("Select at least one type for every category you check");
  }

  const name = (formData.get("name") as string | null)?.trim();
  const companyName = (formData.get("company") as string | null)?.trim();
  const contactPhone = (formData.get("phone") as string | null)?.trim();
  const officeLocation = (formData.get("officeLocation") as string | null)?.trim();
  if (!name || !companyName || !contactPhone || !officeLocation) {
    throw new Error("Please fill in your name, company name, contact phone, and office location");
  }

  const file = formData.get("license") as File | null;
  const existing = await prisma.contractorApplication.findUnique({ where: { contractorId: session.id } });
  if (existing && existing.status !== ContractorApplicationStatus.rejected) {
    throw new Error("Your application has already been submitted");
  }

  let licenseFilePath = existing?.licenseFilePath;
  if (file && file.size > 0) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!LICENSE_EXTENSIONS.has(ext)) throw new Error("Please upload a PDF, JPG, or PNG file");
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    licenseFilePath = await uploadToStorage("trade-licenses", filename, buffer, file.type);
  }
  if (!licenseFilePath) throw new Error("Please upload your trade license");

  // Optional - a contractor may not have a logo ready yet, and can always
  // add/replace one later from Profile (see updateContractorLogo below).
  const logoFile = formData.get("logo") as File | null;
  let logoUrl: string | undefined;
  if (logoFile && logoFile.size > 0) {
    if (logoFile.size > MAX_LOGO_BYTES) throw new Error("Logo is too large - please keep it under 5MB");
    const ext = logoFile.name.split(".").pop()?.toLowerCase() ?? "";
    if (!LOGO_EXTENSIONS.has(ext)) throw new Error("Please upload a JPG, PNG, or WEBP file for your logo");
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buffer = Buffer.from(await logoFile.arrayBuffer());
    logoUrl = await uploadToStorage("contractor-logos", filename, buffer, logoFile.type);
  }

  await prisma.user.update({ where: { id: session.id }, data: { fullName: name, ...(logoUrl ? { logoUrl } : {}) } });

  if (existing) {
    await prisma.contractorApplicationCategory.deleteMany({ where: { applicationId: existing.id } });
    await prisma.contractorApplicationType.deleteMany({ where: { applicationId: existing.id } });
    await prisma.contractorApplication.update({
      where: { id: existing.id },
      data: {
        licenseFilePath,
        companyName,
        contactPhone,
        officeLocation,
        status: ContractorApplicationStatus.pending,
        submittedAt: new Date(),
        agreedTermsAt: new Date(),
        reviewedAt: null,
        reviewNote: null,
        categories: { create: categoryIds.map((categoryId) => ({ categoryId })) },
        types: { create: typeIds.map((typeId) => ({ typeId })) },
      },
    });
  } else {
    await prisma.contractorApplication.create({
      data: {
        contractorId: session.id,
        licenseFilePath,
        companyName,
        contactPhone,
        officeLocation,
        agreedTermsAt: new Date(),
        categories: { create: categoryIds.map((categoryId) => ({ categoryId })) },
        types: { create: typeIds.map((typeId) => ({ typeId })) },
      },
    });
  }

  const [me, admins] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.id } }),
    prisma.user.findMany({ where: { role: Role.admin } }),
  ]);
  if (me) {
    await sendContractorApplicationReceivedEmail(me.email);
    await sendTemplatedWhatsApp("contractor_application_received", me.whatsappNumber);
    for (const admin of admins) {
      await sendContractorApplicationAdminAlertEmail(admin.email, me.email);
      await sendTemplatedWhatsApp("contractor_application_admin_alert", admin.whatsappNumber, { applicantEmail: me.email });
    }
  }
  revalidateContractors();
}

// Lets a contractor set/replace their own logo any time after registration
// (see the apply form's own optional logo field above for the other entry
// point) - shown in place of the PickTheBrick logo on their dashboard and
// while building a quote for their own client (see BrandMark.tsx's logoUrl
// prop and editAsContractor in app/build/BuildClient.tsx).
export async function updateContractorLogo(formData: FormData) {
  const session = await requireSession();
  if (session.role !== Role.contractor) throw new Error("Only contractor accounts have a logo");

  const file = formData.get("logo") as File | null;
  if (!file || file.size === 0) throw new Error("Please choose a logo file");
  if (file.size > MAX_LOGO_BYTES) throw new Error("Logo is too large - please keep it under 5MB");
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!LOGO_EXTENSIONS.has(ext)) throw new Error("Please upload a JPG, PNG, or WEBP file");

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const logoUrl = await uploadToStorage("contractor-logos", filename, buffer, file.type);

  await prisma.user.update({ where: { id: session.id }, data: { logoUrl } });
  revalidatePath("/contractor");
  revalidatePath("/profile");
}

// Lets a contractor withdraw their own application (at any status) and
// start over - the resubmit path (submitContractorApplication above)
// already sends the admin an email + WhatsApp alert unconditionally, so
// deleting-then-reapplying needs no extra notification wiring here.
export async function deleteContractorApplication() {
  const session = await requireSession();
  if (session.role !== Role.contractor) throw new Error("Only contractor accounts can do this");

  await prisma.contractorApplication.deleteMany({ where: { contractorId: session.id } });
  revalidateContractors();
}

export async function approveContractorApplication(applicationId: string, note?: string) {
  await requireAdmin();
  const application = await prisma.contractorApplication.update({
    where: { id: applicationId },
    data: { status: ContractorApplicationStatus.approved, reviewedAt: new Date(), reviewNote: note?.trim() || null },
    include: { contractor: true },
  });
  await sendContractorApplicationApprovedEmail(application.contractor.email);
  await sendTemplatedWhatsApp("contractor_application_approved", application.contractor.whatsappNumber);
  revalidateContractors();
}

export async function rejectContractorApplication(applicationId: string, note?: string) {
  await requireAdmin();
  const application = await prisma.contractorApplication.update({
    where: { id: applicationId },
    data: { status: ContractorApplicationStatus.rejected, reviewedAt: new Date(), reviewNote: note?.trim() || null },
    include: { contractor: true },
  });
  await sendContractorApplicationRejectedEmail(application.contractor.email, application.reviewNote);
  await sendTemplatedWhatsApp("contractor_application_rejected", application.contractor.whatsappNumber, {
    noteLine: application.reviewNote ? ` Note from our team: ${application.reviewNote}` : "",
  });
  revalidateContractors();
}

// Freeform status setter - admin can move a contractor to any status at any
// time (not just pending -> approved/rejected), so a previously-approved
// contractor can be blocked, or a blocked one reinstated.
export async function setContractorApplicationStatus(
  applicationId: string,
  status: ContractorApplicationStatus,
  note?: string,
) {
  await requireAdmin();
  const application = await prisma.contractorApplication.update({
    where: { id: applicationId },
    data: { status, reviewedAt: new Date(), reviewNote: note?.trim() || null },
    include: { contractor: true },
  });

  if (status === ContractorApplicationStatus.approved) {
    await sendContractorApplicationApprovedEmail(application.contractor.email);
    await sendTemplatedWhatsApp("contractor_application_approved", application.contractor.whatsappNumber);
  } else if (status === ContractorApplicationStatus.rejected) {
    await sendContractorApplicationRejectedEmail(application.contractor.email, application.reviewNote);
    await sendTemplatedWhatsApp("contractor_application_rejected", application.contractor.whatsappNumber, {
      noteLine: application.reviewNote ? ` Note from our team: ${application.reviewNote}` : "",
    });
  } else if (status === ContractorApplicationStatus.blocked) {
    await sendContractorApplicationBlockedEmail(application.contractor.email, application.reviewNote);
    await sendTemplatedWhatsApp("contractor_application_blocked", application.contractor.whatsappNumber, {
      noteLine: application.reviewNote ? ` Note from our team: ${application.reviewNote}` : "",
    });
  }
  revalidateContractors();
}
