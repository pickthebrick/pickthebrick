"use server";

import { writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/roles";
import { getSession } from "@/lib/auth";
import { Role } from "@/app/generated/prisma/enums";

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
  await writeFile(path.join(process.cwd(), "public", "banners", filename), buffer);

  const count = await prisma.banner.count();
  await prisma.banner.create({
    data: { imagePath: `/banners/${filename}`, linkUrl, title, sortOrder: count },
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
  await unlink(path.join(process.cwd(), "public", banner.imagePath.replace(/^\//, ""))).catch(() => {});
  revalidatePath("/admin/marketing");
  revalidatePath("/build");
}

// Singleton row backing the joke "AI Designer" banner on /design - see
// app/design/page.tsx and the AiDesignerBanner model.
export async function updateAiDesignerBanner(data: { headline: string; subText: string; popupMessage: string; enabled: boolean }) {
  await requireAdmin();
  const headline = data.headline.trim() || "AI Designer";
  const subText = data.subText.trim() || "Humans are the best.....But AI designer is coming soon!!!";
  const popupMessage = data.popupMessage.trim() || "Our human designers are still better at it.";
  await prisma.aiDesignerBanner.upsert({
    where: { id: "ai-designer-banner" },
    create: { id: "ai-designer-banner", headline, subText, popupMessage, enabled: data.enabled },
    update: { headline, subText, popupMessage, enabled: data.enabled },
  });
  revalidatePath("/admin/marketing");
  revalidatePath("/design");
}
