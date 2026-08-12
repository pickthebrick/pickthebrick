"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/roles";
import { getSession } from "@/lib/auth";
import { Role } from "@/app/generated/prisma/enums";
import { deleteFromStorage } from "@/lib/storage";
import { featureSlot } from "@/lib/spaceLayers";
import { SPACE_QUESTIONS } from "@/lib/spaceQuestions";

async function requireAdminOrMarketing() {
  const session = await getSession();
  if (!session || (!isAdminRole(session.role) && session.role !== Role.marketing)) throw new Error("Admin only");
  return session;
}

function revalidateDesignLayers() {
  revalidatePath("/admin/marketing");
  revalidatePath("/design/spaces");
  revalidatePath("/design/features");
}

function slugify(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// Opens up a brand-new client-selectable boolean question for a space (e.g.
// "Bean bag seating") - merged alongside the fixed SPACE_QUESTIONS set via
// mergedSpaceQuestions() everywhere a space's questions are read (the
// survey, the layer-image slot list, the designer's answer readout). The
// "custom_" prefix + a short random suffix guarantees the generated key can
// never collide with a hardcoded question key or an earlier custom one.
export async function addCustomSpaceQuestion(spaceKey: string, label: string) {
  await requireAdminOrMarketing();
  const trimmed = label.trim();
  if (!trimmed) throw new Error("Please enter a label");
  const slug = slugify(trimmed) || "option";
  const key = `custom_${slug}_${Math.random().toString(36).slice(2, 7)}`;

  const count = await prisma.spaceCustomQuestion.count({ where: { spaceKey } });
  await prisma.spaceCustomQuestion.create({ data: { spaceKey, key, label: trimmed, sortOrder: count } });
  revalidateDesignLayers();
}

// Removes a custom question and its uploaded layer image, if any - answers
// clients already gave for it are left in place (harmless orphaned data,
// same as deleting any other historical answer) since nothing renders a
// deleted question's key going forward.
export async function deleteCustomSpaceQuestion(id: string) {
  await requireAdminOrMarketing();
  const question = await prisma.spaceCustomQuestion.findUnique({ where: { id } });
  if (!question) return;

  const layerImage = await prisma.spaceLayerImage.findUnique({
    where: { spaceKey_slot: { spaceKey: question.spaceKey, slot: featureSlot(question.key) } },
  });
  await prisma.spaceCustomQuestion.delete({ where: { id } });
  if (layerImage) {
    await prisma.spaceLayerImage.delete({ where: { id: layerImage.id } });
    await deleteFromStorage(layerImage.imageUrl).catch(() => {});
  }
  revalidateDesignLayers();
}

// Deletes a hardcoded boolean question (e.g. "Storage credenza") from a
// space, from the admin's point of view - the question is defined in code
// (SPACE_QUESTIONS) and can't be removed from there, so this records it as
// hidden instead; mergedSpaceQuestions() filters it out everywhere from then
// on (survey, layer-image slots, SpaceIcon toggle), same end result as
// deleteCustomSpaceQuestion above. Choice-type questions (chair/desk counts)
// are structural to the room and aren't offered this control - see the
// group !== "choice" check in DesignLayersClient.tsx.
export async function hideSpaceQuestion(spaceKey: string, key: string) {
  await requireAdminOrMarketing();
  const question = (SPACE_QUESTIONS[spaceKey] ?? []).find((q) => q.key === key);
  if (!question || question.type !== "boolean") throw new Error("This option can't be deleted");

  await prisma.spaceQuestionHidden.upsert({
    where: { spaceKey_key: { spaceKey, key } },
    create: { spaceKey, key },
    update: {},
  });

  const layerImage = await prisma.spaceLayerImage.findUnique({
    where: { spaceKey_slot: { spaceKey, slot: featureSlot(key) } },
  });
  if (layerImage) {
    await prisma.spaceLayerImage.delete({ where: { id: layerImage.id } });
    await deleteFromStorage(layerImage.imageUrl).catch(() => {});
  }
  revalidateDesignLayers();
}
