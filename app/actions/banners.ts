"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/roles";
import { getSession } from "@/lib/auth";
import { Role } from "@/app/generated/prisma/enums";
import { uploadToStorage, deleteFromStorage } from "@/lib/storage";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

async function requireAdmin() {
  const session = await getSession();
  if (!session || (!isAdminRole(session.role) && session.role !== Role.marketing)) throw new Error("Admin only");
  return session;
}

export async function createBanner(formData: FormData) {
  await requireAdmin();

  const file = formData.get("image") as File | null;
  const linkUrl = (formData.get("linkUrl") as string) || null;
  const title = (formData.get("title") as string) || null;

  if (!file || file.size === 0) throw new Error("Please choose an image");
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) throw new Error("Please upload a JPG, PNG, WEBP, or GIF image");

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const imagePath = await uploadToStorage("banners", filename, buffer, file.type);

  const count = await prisma.banner.count();
  await prisma.banner.create({
    data: { imagePath, linkUrl, title, sortOrder: count },
  });

  revalidatePath("/admin/marketing");
  revalidatePath("/build");
}

export async function toggleBannerActive(id: string) {
  await requireAdmin();
  const banner = await prisma.banner.findUnique({ where: { id } });
  if (!banner) return;
  await prisma.banner.update({ where: { id }, data: { active: !banner.active } });
  revalidatePath("/admin/marketing");
  revalidatePath("/build");
}

export async function deleteBanner(id: string) {
  await requireAdmin();
  const banner = await prisma.banner.findUnique({ where: { id } });
  if (!banner) return;
  await prisma.banner.delete({ where: { id } });
  await deleteFromStorage(banner.imagePath).catch(() => {});
  revalidatePath("/admin/marketing");
  revalidatePath("/build");
}

// Singleton row backing the joke "AI Designer" banner on /design - see
// app/design/page.tsx and the AiDesignerBanner model.
export async function updateAiDesignerBanner(data: {
  headline: string;
  subText: string;
  popupMessage: string;
  backgroundColor: string;
  enabled: boolean;
}) {
  await requireAdmin();
  const headline = data.headline.trim() || "AI Designer";
  const subText = data.subText.trim() || "Humans are the best.....But AI designer is coming soon!!!";
  const popupMessage = data.popupMessage.trim() || "Our human designers are still better at it.";
  const backgroundColor = /^#[0-9a-fA-F]{6}$/.test(data.backgroundColor.trim()) ? data.backgroundColor.trim() : "#fffcf5";
  await prisma.aiDesignerBanner.upsert({
    where: { id: "ai-designer-banner" },
    create: { id: "ai-designer-banner", headline, subText, popupMessage, backgroundColor, enabled: data.enabled },
    update: { headline, subText, popupMessage, backgroundColor, enabled: data.enabled },
  });
  revalidatePath("/admin/marketing");
  revalidatePath("/design");
}

// Homepage "Built with PickTheBrick" case-study cards (see CaseStudyCard
// model) - photo + button only, tag/title/stats stay in HomeClient.tsx.
export async function setCaseStudyImage(id: string, formData: FormData) {
  await requireAdmin();

  const file = formData.get("image") as File | null;
  if (!file || file.size === 0) throw new Error("Please choose an image");
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) throw new Error("Please upload a JPG, PNG, WEBP, or GIF image");

  const existing = await prisma.caseStudyCard.findUnique({ where: { id } });

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const imageUrl = await uploadToStorage("case-studies", filename, buffer, file.type);

  await prisma.caseStudyCard.upsert({
    where: { id },
    create: { id, imageUrl },
    update: { imageUrl },
  });
  if (existing?.imageUrl) await deleteFromStorage(existing.imageUrl).catch(() => {});

  revalidatePath("/admin/marketing");
  revalidatePath("/");
}

export async function removeCaseStudyImage(id: string) {
  await requireAdmin();
  const existing = await prisma.caseStudyCard.findUnique({ where: { id } });
  if (!existing?.imageUrl) return;
  await prisma.caseStudyCard.update({ where: { id }, data: { imageUrl: null } });
  await deleteFromStorage(existing.imageUrl).catch(() => {});
  revalidatePath("/admin/marketing");
  revalidatePath("/");
}

export async function updateCaseStudyButton(id: string, buttonLabel: string, buttonUrl: string) {
  await requireAdmin();
  const label = buttonLabel.trim() || "View project";
  const url = buttonUrl.trim();
  await prisma.caseStudyCard.upsert({
    where: { id },
    create: { id, buttonLabel: label, buttonUrl: url },
    update: { buttonLabel: label, buttonUrl: url },
  });
  revalidatePath("/admin/marketing");
  revalidatePath("/");
}
