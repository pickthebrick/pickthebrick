"use server";

import { writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role, DesignRequestStatus } from "@/app/generated/prisma/enums";

const DOWNLOAD_EXTENSIONS = new Set(["pdf", "doc", "docx", "glb", "gltf", "zip", "jpg", "jpeg", "png"]);

async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");
  return session;
}

async function requireDesigner() {
  const session = await requireSession();
  if (session.role !== Role.designer) throw new Error("Designer only");
  return session;
}

function revalidateDesignRequests() {
  revalidatePath("/designer");
  revalidatePath("/my-quotes");
  revalidatePath("/admin/designer");
}

async function assertOwnDraftRequest(id: string, clientId: string) {
  const request = await prisma.designRequest.findUnique({ where: { id } });
  if (!request || request.clientId !== clientId || request.status !== DesignRequestStatus.draft) {
    throw new Error("Design request is not an editable draft you own");
  }
  return request;
}

// Starts a client's design request the moment they click "Start Design" -
// package + sqft are known immediately, spaces get filled in on the next step.
export async function startDesignRequest(packageKey: string, sqft: number) {
  const session = await requireSession();
  if (session.role !== Role.client) throw new Error("Only clients can start a design request");
  if (!Number.isFinite(sqft) || sqft <= 0) throw new Error("Invalid office size");

  const created = await prisma.designRequest.create({
    data: { clientId: session.id, packageKey, sqft },
  });
  return created.id;
}

export async function updateDesignRequestSpaces(id: string, spaces: string[]) {
  const session = await requireSession();
  await assertOwnDraftRequest(id, session.id);

  await prisma.designRequest.update({ where: { id }, data: { spaces: spaces.join(",") } });
}

export async function submitDesignRequest(id: string) {
  const session = await requireSession();
  await assertOwnDraftRequest(id, session.id);

  await prisma.designRequest.update({
    where: { id },
    data: { status: DesignRequestStatus.submitted, submittedAt: new Date() },
  });
  revalidateDesignRequests();
}

export async function claimDesignRequest(id: string) {
  const session = await requireDesigner();
  const request = await prisma.designRequest.findUnique({ where: { id } });
  if (!request) throw new Error("Design request not found");
  if (request.status !== DesignRequestStatus.submitted) throw new Error("Request has already been claimed");

  await prisma.designRequest.update({
    where: { id },
    data: { status: DesignRequestStatus.in_progress, designerId: session.id, assignedAt: new Date() },
  });
  revalidateDesignRequests();
}

async function assertOwnActiveRequest(id: string, designerId: string) {
  const request = await prisma.designRequest.findUnique({ where: { id } });
  if (!request || request.designerId !== designerId || request.status !== DesignRequestStatus.in_progress) {
    throw new Error("Design request is not one of your in-progress requests");
  }
  return request;
}

export async function addDesignRequestFile(id: string, label: string, formData: FormData) {
  const session = await requireDesigner();
  await assertOwnActiveRequest(id, session.id);
  if (!label.trim()) throw new Error("Please enter a label");

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new Error("Please choose a file");
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!DOWNLOAD_EXTENSIONS.has(ext)) {
    throw new Error("Please upload a PDF, Word doc, GLB/GLTF, ZIP, JPG, or PNG file");
  }

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(process.cwd(), "public", "design-submittals", filename), buffer);

  const count = await prisma.designRequestFile.count({ where: { designRequestId: id } });
  await prisma.designRequestFile.create({
    data: { designRequestId: id, label: label.trim(), filePath: `/design-submittals/${filename}`, sortOrder: count },
  });
  revalidateDesignRequests();
}

export async function deleteDesignRequestFile(fileId: string) {
  const session = await requireDesigner();
  const file = await prisma.designRequestFile.findUnique({ where: { id: fileId } });
  if (!file) return;
  await assertOwnActiveRequest(file.designRequestId, session.id);

  await prisma.designRequestFile.delete({ where: { id: fileId } });
  await unlink(path.join(process.cwd(), "public", file.filePath.replace(/^\//, ""))).catch(() => {});
  revalidateDesignRequests();
}

export async function deliverDesignRequest(id: string) {
  const session = await requireDesigner();
  const request = await assertOwnActiveRequest(id, session.id);
  const fileCount = await prisma.designRequestFile.count({ where: { designRequestId: id } });
  if (fileCount === 0) throw new Error("Upload at least one file before marking this delivered");

  await prisma.designRequest.update({
    where: { id },
    data: { status: DesignRequestStatus.delivered, deliveredAt: new Date() },
  });
  void request;
  revalidateDesignRequests();
}
