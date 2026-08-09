"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/roles";
import { getSession } from "@/lib/auth";
import { resolveActor, actorOwns, type Actor } from "@/lib/actor";
import { Role, DesignRequestStatus } from "@/app/generated/prisma/enums";
import { priceFor, MAX_REVISIONS, type PackageKey } from "@/lib/designPricing";
import { sendDesignerAssignedEmail, sendDesignerRemovedEmail } from "@/lib/email";
import { sendTemplatedWhatsApp } from "@/lib/whatsapp";
import { uploadToStorage, deleteFromStorage } from "@/lib/storage";

const SITE_VISIT_FEE = 500;
const LAYOUT_EXTENSIONS = new Set(["pdf", "dwg", "dxf", "jpg", "jpeg", "png"]);
// Prefix marking a DesignRequestFile as the client's own as-built upload
// rather than a designer's submittal - kept in sync with the same literal
// used client-side in app/designer/DesignerClient.tsx and DesignRequestModal.tsx.
const CLIENT_UPLOAD_LABEL_PREFIX = "Client layout upload:";
// Informational only - shown/highlighted once passed, nothing auto-reassigns.
const DESIGNER_CLAIM_WINDOW_MS = 48 * 60 * 60 * 1000;

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

async function assertOwnDraftRequest(id: string, actor: Actor) {
  const request = await prisma.designRequest.findUnique({ where: { id } });
  if (!request || !actorOwns(actor, request) || request.status !== DesignRequestStatus.draft) {
    throw new Error("Design request is not an editable draft you own");
  }
  return request;
}

// Starts a client's design request the moment they click "Start Design" -
// package + sqft are known immediately, spaces get filled in on the next
// step. Works for a signed-in client or an anonymous visitor alike, exactly
// like getOrCreateDraftQuote() in app/actions/quotes.ts.
//
// Resumes an existing draft for this actor rather than always creating a new
// one - if a visitor gets bounced off the survey (session hiccup, stray
// navigation, whatever) and lands back on the package page, clicking "Start
// Design" again must not silently orphan whatever spaces/features they'd
// already entered on a previous draft.
export async function startDesignRequest(packageKey: string, sqft: number) {
  const actor = await resolveActor();
  if (!Number.isFinite(sqft) || sqft <= 0) throw new Error("Invalid office size");

  const packagePrice = priceFor(packageKey as PackageKey, sqft);
  const existingDraft = await prisma.designRequest.findFirst({
    where: { ...actor, status: DesignRequestStatus.draft },
    orderBy: { createdAt: "desc" },
  });
  if (existingDraft) {
    const updated = await prisma.designRequest.update({
      where: { id: existingDraft.id },
      data: { packageKey, sqft, packagePrice },
    });
    return updated.id;
  }

  const created = await prisma.designRequest.create({
    data: { ...actor, packageKey, sqft, packagePrice },
  });
  return created.id;
}

// Replaces the whole space list for a draft request. Simple wipe-and-recreate:
// each spaceKey gets `quantity` DesignRequestSpace rows (one per instance),
// which cascades away any answers already saved for the previous list. That's
// an accepted MVP trade-off - the wizard flows forward, not back-and-forth.
export async function setDesignRequestSpaces(id: string, entries: { spaceKey: string; quantity: number }[]) {
  const actor = await resolveActor();
  await assertOwnDraftRequest(id, actor);

  await prisma.designRequestSpace.deleteMany({ where: { designRequestId: id } });

  let sortOrder = 0;
  const rows: { designRequestId: string; spaceKey: string; sortOrder: number }[] = [];
  for (const entry of entries) {
    const quantity = Math.max(0, Math.min(6, Math.round(entry.quantity)));
    for (let i = 0; i < quantity; i++) {
      rows.push({ designRequestId: id, spaceKey: entry.spaceKey, sortOrder: sortOrder++ });
    }
  }
  if (rows.length > 0) {
    await prisma.designRequestSpace.createMany({ data: rows });
  }
}

export async function saveDesignRequestSpaceAnswers(
  spaceInstanceId: string,
  answers: Record<string, string>,
  notes: string,
) {
  const actor = await resolveActor();
  const instance = await prisma.designRequestSpace.findUnique({
    where: { id: spaceInstanceId },
    include: { designRequest: true },
  });
  if (!instance || !actorOwns(actor, instance.designRequest) || instance.designRequest.status !== DesignRequestStatus.draft) {
    throw new Error("Design request space is not one you can edit");
  }

  await prisma.designRequestSpace.update({ where: { id: spaceInstanceId }, data: { notes: notes.trim() || null } });
  for (const [questionKey, value] of Object.entries(answers)) {
    await prisma.designRequestSpaceAnswer.upsert({
      where: { designRequestSpaceId_questionKey: { designRequestSpaceId: spaceInstanceId, questionKey } },
      create: { designRequestSpaceId: spaceInstanceId, questionKey, value },
      update: { value },
    });
  }
}

export async function deleteDesignRequestSpace(spaceInstanceId: string) {
  const actor = await resolveActor();
  const instance = await prisma.designRequestSpace.findUnique({
    where: { id: spaceInstanceId },
    include: { designRequest: true },
  });
  if (!instance || !actorOwns(actor, instance.designRequest) || instance.designRequest.status !== DesignRequestStatus.draft) {
    throw new Error("Design request space is not one you can edit");
  }

  await prisma.designRequestSpace.delete({ where: { id: spaceInstanceId } });
}

// Allowed while draft or just-submitted - once a designer claims it
// (in_progress/delivered), real work may already be underway, mirroring
// deleteQuote's draft-or-submitted cutoff in quotes.ts.
export async function deleteDesignRequest(id: string) {
  const session = await requireSession();
  const request = await prisma.designRequest.findUnique({ where: { id } });
  if (!request || request.clientId !== session.id) throw new Error("Design request not found");
  if (request.status !== DesignRequestStatus.draft && request.status !== DesignRequestStatus.submitted) {
    throw new Error("This design request is already being worked on and can no longer be deleted");
  }
  await prisma.designRequest.delete({ where: { id } });
  revalidateDesignRequests();
}

export async function submitDesignRequest(id: string) {
  const actor = await resolveActor();
  if (!("clientId" in actor)) throw new Error("Please sign in to submit your design request");
  await assertOwnDraftRequest(id, actor);

  await prisma.designRequest.update({
    where: { id },
    data: { status: DesignRequestStatus.submitted, submittedAt: new Date() },
  });
  revalidateDesignRequests();
}

async function assertOwnSubmittedRequest(id: string, actor: Actor) {
  const request = await prisma.designRequest.findUnique({ where: { id } });
  if (!request || !actorOwns(actor, request) || request.status !== DesignRequestStatus.submitted) {
    throw new Error("Design request is not one you can edit");
  }
  return request;
}

const MAX_LAYOUT_UPLOAD_BYTES = 10 * 1024 * 1024;

// The client's own layout upload on the post-survey handover screen - kept
// in the same DesignRequestFile table the designer's delivered files use,
// labeled distinctly so the two are never confused in the dashboard/designer
// views. Not a one-shot action - the handover screen keeps this callable
// any number of times (see HandoverClient.tsx), so the client can add more
// files or switch to a link later without anything being "frozen." Accepts
// either an uploaded file or a pasted link (e.g. a Google Drive/Dropbox
// share) - when a link is given, it's stored directly as the filePath with
// no disk write, since the UI just renders it as an <a href>.
export async function uploadDesignRequestLayout(id: string, formData: FormData) {
  const actor = await resolveActor();
  await assertOwnSubmittedRequest(id, actor);

  const link = (formData.get("link") as string | null)?.trim();
  const file = formData.get("file") as File | null;

  let label: string;
  let filePath: string;

  if (link) {
    if (!/^https?:\/\//i.test(link)) throw new Error("Please enter a valid link starting with http:// or https://");
    label = `${CLIENT_UPLOAD_LABEL_PREFIX} ${link}`;
    filePath = link;
  } else {
    if (!file || file.size === 0) throw new Error("Please choose a file or paste a link");
    if (file.size > MAX_LAYOUT_UPLOAD_BYTES) throw new Error("File is too large - please keep it under 10MB");
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!LAYOUT_EXTENSIONS.has(ext)) {
      throw new Error("Please upload a PDF, AutoCAD (DWG/DXF), JPG, or PNG file");
    }
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    filePath = await uploadToStorage("design-submittals", filename, buffer, file.type);
    label = `${CLIENT_UPLOAD_LABEL_PREFIX} ${file.name}`;
  }

  const count = await prisma.designRequestFile.count({ where: { designRequestId: id } });
  await prisma.designRequestFile.create({
    data: { designRequestId: id, label, filePath, sortOrder: count },
  });
  revalidateDesignRequests();
}

// No layout on hand - request a captain-arranged site visit instead. Adds
// the flat AED 500 fee to the request's total (see MyQuotesClient's payments tab).
export async function requestSiteVisit(id: string, preferredDate?: string) {
  const actor = await resolveActor();
  await assertOwnSubmittedRequest(id, actor);

  await prisma.designRequest.update({
    where: { id },
    data: {
      siteVisitRequested: true,
      siteVisitFee: SITE_VISIT_FEE,
      siteVisitPreferredDate: preferredDate ? new Date(preferredDate) : undefined,
    },
  });
  revalidateDesignRequests();
}

export async function recordDesignPaymentMethod(
  id: string,
  method: "card" | "apple_pay" | "google_pay" | "cash" | "pay_later",
) {
  const actor = await resolveActor();
  await assertOwnSubmittedRequest(id, actor);

  await prisma.designRequest.update({
    where: { id },
    data: { paymentMethod: method, paymentMethodSelectedAt: new Date() },
  });
  revalidateDesignRequests();
}

export async function claimDesignRequest(id: string) {
  const session = await requireDesigner();
  const request = await prisma.designRequest.findUnique({ where: { id } });
  if (!request) throw new Error("Design request not found");
  if (request.status !== DesignRequestStatus.submitted) throw new Error("Request has already been claimed");

  const now = new Date();
  await prisma.designRequest.update({
    where: { id },
    data: {
      status: DesignRequestStatus.in_progress,
      designerId: session.id,
      assignedAt: now,
      claimDeadline: new Date(now.getTime() + DESIGNER_CLAIM_WINDOW_MS),
    },
  });
  revalidateDesignRequests();
}

// Admin assigns a designer to a submitted request (instead of the designer
// self-claiming), and can reassign it to someone else later - a designer
// terminated or unavailable mid-job. Either way the 48h submission clock
// restarts for whoever takes over.
export async function assignDesigner(id: string, designerId: string) {
  const session = await requireSession();
  if (!isAdminRole(session.role)) throw new Error("Only an admin can assign a designer");

  const designer = await prisma.user.findUnique({ where: { id: designerId } });
  if (!designer || designer.role !== Role.designer) throw new Error("designerId must reference a designer");

  const request = await prisma.designRequest.findUnique({ where: { id }, include: { designer: true } });
  if (!request) throw new Error("Design request not found");
  if (request.status !== DesignRequestStatus.submitted && request.status !== DesignRequestStatus.in_progress) {
    throw new Error("This request can no longer be reassigned");
  }
  if (request.designerId === designerId) return;

  const previousDesigner = request.designer;
  const now = new Date();
  await prisma.designRequest.update({
    where: { id },
    data: {
      status: DesignRequestStatus.in_progress,
      designerId,
      assignedAt: now,
      claimDeadline: new Date(now.getTime() + DESIGNER_CLAIM_WINDOW_MS),
    },
  });

  await sendDesignerAssignedEmail(designer.email, id);
  await sendTemplatedWhatsApp("designer_assigned", designer.whatsappNumber, { requestId: id });
  if (previousDesigner) {
    await sendDesignerRemovedEmail(previousDesigner.email, id);
    await sendTemplatedWhatsApp("designer_removed", previousDesigner.whatsappNumber, { requestId: id });
  }
  revalidateDesignRequests();
}

async function assertOwnActiveRequest(id: string, designerId: string) {
  const request = await prisma.designRequest.findUnique({ where: { id } });
  if (!request || request.designerId !== designerId || request.status !== DesignRequestStatus.in_progress) {
    throw new Error("Design request is not one of your in-progress requests");
  }
  return request;
}

// Design packages cap how many times a designer may deliver/redeliver a
// submittal (see MAX_REVISIONS in lib/designPricing.ts; premium is
// unlimited). Past the very first upload, a client (or the designer's own
// call-summary) comment must be logged since the last upload before the
// next one is allowed - see addDesignRequestRevisionComment below - so
// there's always a record of what changed and why.
export async function submitDesignRevision(id: string, label: string, formData: FormData) {
  const session = await requireDesigner();
  const request = await assertOwnActiveRequest(id, session.id);
  if (!label.trim()) throw new Error("Please enter a label");

  const max = MAX_REVISIONS[request.packageKey as PackageKey];
  if (max != null && request.revisionsUsed >= max) {
    throw new Error("This package's revision limit has been reached - the client needs to upgrade their package for more revisions");
  }
  if (request.revisionsUsed > 0) {
    const commentSince = await prisma.designRequestRevisionComment.count({
      where: { designRequestId: id, createdAt: { gt: request.lastRevisionAt ?? new Date(0) } },
    });
    if (commentSince === 0) {
      throw new Error("Log the client's feedback on the last revision before uploading the next one");
    }
  }

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new Error("Please choose a file");
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!DOWNLOAD_EXTENSIONS.has(ext)) {
    throw new Error("Please upload a PDF, Word doc, GLB/GLTF, ZIP, JPG, or PNG file");
  }

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = await uploadToStorage("design-submittals", filename, buffer, file.type);

  const count = await prisma.designRequestFile.count({ where: { designRequestId: id } });
  await prisma.designRequestFile.create({
    data: { designRequestId: id, label: label.trim(), filePath, sortOrder: count },
  });
  await prisma.designRequest.update({
    where: { id },
    data: { revisionsUsed: { increment: 1 }, lastRevisionAt: new Date() },
  });
  revalidateDesignRequests();
}

// Client, designer, or admin can all add to the thread - the designer is
// expected to log a channel="call" entry summarizing any phone/Zoom
// discussion themselves, since the client can't be relied on to write it
// up. Open while a request is being actively worked (in_progress) or has
// just been delivered (a client noticing something after delivery should
// still be able to leave a note for the record).
export async function addDesignRequestRevisionComment(id: string, body: string, channel: "text" | "call" = "text") {
  const session = await requireSession();
  const request = await prisma.designRequest.findUnique({ where: { id } });
  if (!request) throw new Error("Design request not found");
  const isParticipant =
    (session.role === Role.client && request.clientId === session.id) ||
    (session.role === Role.designer && request.designerId === session.id) ||
    isAdminRole(session.role);
  if (!isParticipant) throw new Error("Not allowed to comment on this design request");
  if (request.status !== DesignRequestStatus.in_progress && request.status !== DesignRequestStatus.delivered) {
    throw new Error("Comments are only open while a request is being worked on");
  }
  if (!body.trim()) throw new Error("Please enter a comment");

  const authorRole = session.role === Role.designer ? "designer" : isAdminRole(session.role) ? "admin" : "client";
  await prisma.designRequestRevisionComment.create({
    data: { designRequestId: id, authorRole, body: body.trim(), channel },
  });
  revalidateDesignRequests();
}

// The designer who uploaded a submittal file can remove it themselves only
// within this window of the upload - past that, only an admin can (see
// app/admin/designer/AdminDesignerClient.tsx's always-available delete).
// Keep in sync with the client-side disable check in DesignRequestModal.tsx.
const DESIGNER_FILE_DELETE_WINDOW_MS = 10 * 60 * 1000;

export async function deleteDesignRequestFile(fileId: string) {
  const session = await requireSession();
  const file = await prisma.designRequestFile.findUnique({ where: { id: fileId } });
  if (!file) return;

  if (isAdminRole(session.role)) {
    await prisma.designRequestFile.delete({ where: { id: fileId } });
    await deleteFromStorage(file.filePath).catch(() => {});
    revalidateDesignRequests();
    return;
  }

  if (session.role !== Role.designer) throw new Error("Not allowed to delete this file");
  await assertOwnActiveRequest(file.designRequestId, session.id);
  if (Date.now() - file.createdAt.getTime() > DESIGNER_FILE_DELETE_WINDOW_MS) {
    throw new Error("This file can only be deleted within 10 minutes of upload - ask an admin to remove it now");
  }

  await prisma.designRequestFile.delete({ where: { id: fileId } });
  await deleteFromStorage(file.filePath).catch(() => {});
  revalidateDesignRequests();
}

export async function deliverDesignRequest(id: string) {
  const session = await requireDesigner();
  const request = await assertOwnActiveRequest(id, session.id);
  // Only the designer's own submittals count - the client's uploaded
  // reference layout (if any) doesn't satisfy "you've delivered something".
  const fileCount = await prisma.designRequestFile.count({
    where: { designRequestId: id, label: { not: { startsWith: CLIENT_UPLOAD_LABEL_PREFIX } } },
  });
  if (fileCount === 0) throw new Error("Upload at least one file before marking this delivered");

  await prisma.designRequest.update({
    where: { id },
    data: { status: DesignRequestStatus.delivered, deliveredAt: new Date() },
  });
  void request;
  revalidateDesignRequests();
}
