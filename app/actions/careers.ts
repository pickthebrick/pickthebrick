"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/roles";
import { getSession } from "@/lib/auth";
import { Role } from "@/app/generated/prisma/enums";
import { sendJobApplicationReceivedEmail } from "@/lib/email";
import { uploadToStorage } from "@/lib/storage";

async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) throw new Error("Admin only");
  return session;
}

export async function createJobPosting(data: {
  title: string;
  department?: string;
  location?: string;
  employmentType?: string;
  description: string;
}) {
  await requireAdmin();
  const title = data.title.trim();
  const description = data.description.trim();
  if (!title) throw new Error("Please enter a job title");
  if (!description) throw new Error("Please enter a description");
  const count = await prisma.jobPosting.count();
  await prisma.jobPosting.create({
    data: {
      title,
      description,
      department: data.department?.trim() || null,
      location: data.location?.trim() || null,
      employmentType: data.employmentType?.trim() || null,
      sortOrder: count,
    },
  });
  revalidatePath("/admin/careers");
  revalidatePath("/careers");
}

export async function updateJobPosting(
  id: string,
  data: { title: string; department?: string; location?: string; employmentType?: string; description: string },
) {
  await requireAdmin();
  const title = data.title.trim();
  const description = data.description.trim();
  if (!title) throw new Error("Please enter a job title");
  if (!description) throw new Error("Please enter a description");
  await prisma.jobPosting.update({
    where: { id },
    data: {
      title,
      description,
      department: data.department?.trim() || null,
      location: data.location?.trim() || null,
      employmentType: data.employmentType?.trim() || null,
    },
  });
  revalidatePath("/admin/careers");
  revalidatePath("/careers");
}

export async function toggleJobPostingEnabled(id: string) {
  await requireAdmin();
  const posting = await prisma.jobPosting.findUnique({ where: { id } });
  if (!posting) return;
  await prisma.jobPosting.update({ where: { id }, data: { enabled: !posting.enabled } });
  revalidatePath("/admin/careers");
  revalidatePath("/careers");
}

export async function deleteJobPosting(id: string) {
  await requireAdmin();
  await prisma.jobPosting.delete({ where: { id } });
  revalidatePath("/admin/careers");
  revalidatePath("/careers");
}

const CV_EXTENSIONS = new Set(["pdf", "doc", "docx"]);
const MAX_CV_BYTES = 10 * 1024 * 1024;

// Public - no session required. Uploads the CV, records the application,
// and emails every super admin directly (see lib/email.ts) so it reaches an
// inbox immediately rather than only ever being visible in /admin/applicants.
export async function submitJobApplication(formData: FormData) {
  const jobPostingId = (formData.get("jobPostingId") as string | null) || null;
  const jobTitle = (formData.get("jobTitle") as string)?.trim();
  const fullName = (formData.get("fullName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const coverNote = (formData.get("coverNote") as string)?.trim() || null;
  const file = formData.get("cv") as File | null;

  if (!jobTitle) throw new Error("Please select a role");
  if (!fullName) throw new Error("Please enter your name");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Please enter a valid email");
  if (!file || file.size === 0) throw new Error("Please attach your CV");
  if (file.size > MAX_CV_BYTES) throw new Error("CV is too large - please keep it under 10MB");
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!CV_EXTENSIONS.has(ext)) throw new Error("Please upload a PDF or Word document");

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const cvPath = await uploadToStorage("job-applications", filename, buffer, file.type);

  await prisma.jobApplication.create({
    data: { jobPostingId, jobTitle, fullName, email, phone, coverNote, cvPath },
  });

  const superAdmins = await prisma.user.findMany({ where: { role: Role.super_admin }, select: { email: true } });
  await Promise.all(
    superAdmins.map((u) =>
      sendJobApplicationReceivedEmail(u.email, { jobTitle, fullName, email, phone, coverNote, cvUrl: cvPath }),
    ),
  );

  revalidatePath("/admin/applicants");
}
