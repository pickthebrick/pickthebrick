"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/roles";
import { getSession } from "@/lib/auth";
import { Role } from "@/app/generated/prisma/enums";
import { deleteFromStorage } from "@/lib/storage";

async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");
  if (!isAdminRole(session.role)) throw new Error("Admin only");
  return session;
}

async function requireSuperAdmin() {
  const session = await getSession();
  if (!session || session.role !== Role.super_admin) throw new Error("Super admin only");
  return session;
}

// Admin-only contact info edit from the Database tab - phone/whatsappNumber
// aren't collected anywhere else for most roles yet, so this is the one
// place they can be filled in until each role's own flow captures them.
export async function updateUserContactInfo(userId: string, data: { phone?: string; whatsappNumber?: string }) {
  await requireAdmin();
  const update: { phone?: string | null; whatsappNumber?: string | null } = {};
  if ("phone" in data) update.phone = data.phone?.trim() || null;
  if ("whatsappNumber" in data) update.whatsappNumber = data.whatsappNumber?.trim() || null;
  await prisma.user.update({ where: { id: userId }, data: update });
  revalidatePath("/admin/database");
}

// Super-admin-only full erasure of a client/captain/contractor/designer/
// marketer account - not a soft delete. Two different behaviors depending on
// what the account *owns* vs what it's merely *assigned to*:
//
// - Records they own outright (Quote/DesignRequest as client, their own
//   ContractorApplication/DesignerApplication, StyleFinderResult) are deleted
//   entirely, including every child row and any R2-stored files
//   (trade license, CV, design request uploads). This is the explicit
//   "wipe it clean" behavior for a deleted client - their whole project
//   history goes with them, payment records included.
// - Records they're merely assigned to on someone else's project (Quote as
//   captain/contractor, DesignRequest as designer, a timeline item's
//   contractor) are left untouched, just unassigned - the live Postgres FK
//   constraints already do this as ON DELETE SET NULL (verified against the
//   deployed schema, not assumed from Prisma's documented defaults), so nothing
//   extra is needed for those once the RESTRICT-constrained rows below are
//   cleared first.
//
// ContractorApplication/DesignerApplication/ProjectContractor/
// TimelineItemApplication all have ON DELETE RESTRICT back to User (required
// relations), which is exactly why the old deleteAdmin() in team.ts silently
// failed ("has activity on record") for any account with these rows - a bare
// prisma.user.delete() throws on the FK violation. Clearing them first here
// is what makes this safe to call unconditionally, whatever the account's
// role or history.
export async function deleteUserCompletely(userId: string) {
  const session = await requireSuperAdmin();
  if (userId === session.id) throw new Error("You can't delete your own account");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      contractorApplication: { select: { licenseFilePath: true } },
      designerApplication: { select: { cvFilePath: true } },
    },
  });
  if (!user) return;

  const ownedDesignRequests = await prisma.designRequest.findMany({
    where: { clientId: userId },
    select: { files: { select: { filePath: true } } },
  });

  const filePaths = [
    user.contractorApplication?.licenseFilePath,
    user.designerApplication?.cvFilePath,
    ...ownedDesignRequests.flatMap((dr) => dr.files.map((f) => f.filePath)),
  ].filter((p): p is string => Boolean(p));

  await prisma.$transaction([
    prisma.styleFinderResult.deleteMany({ where: { clientId: userId } }),
    // Owned outright - full cascade delete via each model's onDelete: Cascade
    // chain (QuoteItem/QuoteStatusHistory/ProjectProgress/SiteInspectionRequest/
    // PaymentClaim/ProjectContractor/ProjectTimelineItem for Quote;
    // DesignRequestFile/Space/RevisionComment for DesignRequest).
    prisma.quote.deleteMany({ where: { clientId: userId } }),
    prisma.designRequest.deleteMany({ where: { clientId: userId } }),
    // RESTRICT-constrained - must clear before the User row can be deleted.
    prisma.contractorApplication.deleteMany({ where: { contractorId: userId } }),
    prisma.designerApplication.deleteMany({ where: { designerId: userId } }),
    prisma.projectContractor.deleteMany({ where: { contractorId: userId } }),
    prisma.timelineItemApplication.deleteMany({ where: { contractorId: userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  await Promise.all(filePaths.map((path) => deleteFromStorage(path).catch(() => {})));

  revalidatePath("/admin/database");
  revalidatePath("/admin/team");
}
