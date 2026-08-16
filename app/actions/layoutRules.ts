"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role, LayoutAdjacencyRelation } from "@/app/generated/prisma/enums";

const LAYOUT_SETTINGS_ID = "layout-settings";
const LAYOUT_CONSTITUTION_ID = "layout-constitution";

async function requireSuperAdmin() {
  const session = await getSession();
  if (!session || session.role !== Role.super_admin) throw new Error("Super admin only");
}

function revalidateLayoutRules() {
  revalidatePath("/admin/ai-designer");
}

export async function getLayoutRoomTypesAction() {
  await requireSuperAdmin();
  return prisma.layoutRoomType.findMany({ orderBy: { sortOrder: "asc" } });
}

// One row per lib/spaces.ts SPACES[].key - upserted by spaceKey since the
// set of keys is fixed (no add/delete in this admin UI, see the plan).
export async function updateLayoutRoomTypeAction(
  spaceKey: string,
  fields: { minWidth: number; minLength: number; targetArea: number; color: string; sortOrder: number }
) {
  await requireSuperAdmin();
  if (fields.minWidth <= 0 || fields.minLength <= 0 || fields.targetArea <= 0) {
    throw new Error("Width, length, and target area must be greater than zero");
  }
  await prisma.layoutRoomType.upsert({
    where: { spaceKey },
    create: { spaceKey, ...fields },
    update: fields,
  });
  revalidateLayoutRules();
}

export async function getLayoutAdjacencyRulesAction() {
  await requireSuperAdmin();
  return prisma.layoutAdjacencyRule.findMany();
}

// Rules are stored directionally (@@unique([roomTypeA, roomTypeB])) but
// mean the same thing either way, so keys are always sorted before storage -
// this keeps a single row per pair regardless of which order the admin grid
// happened to pass them in, and matches algorithm.ts's own sorted-key lookup.
export async function setLayoutAdjacencyRuleAction(
  roomTypeA: string,
  roomTypeB: string,
  relation: LayoutAdjacencyRelation | null,
  weight: number
) {
  await requireSuperAdmin();
  const [a, b] = [roomTypeA, roomTypeB].sort();

  if (relation === null) {
    await prisma.layoutAdjacencyRule.deleteMany({ where: { roomTypeA: a, roomTypeB: b } });
    revalidateLayoutRules();
    return;
  }

  await prisma.layoutAdjacencyRule.upsert({
    where: { roomTypeA_roomTypeB: { roomTypeA: a, roomTypeB: b } },
    create: { roomTypeA: a, roomTypeB: b, relation, weight },
    update: { relation, weight },
  });
  revalidateLayoutRules();
}

export async function getLayoutSettingsAction() {
  await requireSuperAdmin();
  return prisma.layoutSettings.findUnique({ where: { id: LAYOUT_SETTINGS_ID } });
}

export async function updateLayoutSettingsAction(fields: {
  corridorWidth: number;
  doorWidth: number;
  minRoomClearance: number;
  estimatedCorridorOverheadPct: number;
  currentAlgorithmVersion: number;
}) {
  await requireSuperAdmin();
  if (fields.corridorWidth <= 0 || fields.doorWidth <= 0) {
    throw new Error("Corridor width and door width must be greater than zero");
  }
  if (fields.minRoomClearance < 0 || fields.estimatedCorridorOverheadPct < 0) {
    throw new Error("Clearance and corridor overhead can't be negative");
  }
  if (!Number.isInteger(fields.currentAlgorithmVersion) || fields.currentAlgorithmVersion < 1) {
    throw new Error("Algorithm version must be a whole number of 1 or more");
  }
  await prisma.layoutSettings.upsert({
    where: { id: LAYOUT_SETTINGS_ID },
    create: { id: LAYOUT_SETTINGS_ID, ...fields },
    update: fields,
  });
  revalidateLayoutRules();
}

// Reference knowledge for whoever configures the room types/adjacency/
// circulation values above - not fed into an AI prompt anywhere today (the
// generator itself is a deterministic algorithm, not an LLM call), but a
// natural place to plug in if a future version adds an AI-assisted step,
// and useful on its own so the standards behind the numbers survive beyond
// whoever typed them in. Ships with nothing pre-written, same as the room
// types/adjacency rules.
export async function getLayoutConstitutionAction() {
  await requireSuperAdmin();
  return prisma.layoutConstitution.upsert({
    where: { id: LAYOUT_CONSTITUTION_ID },
    create: { id: LAYOUT_CONSTITUTION_ID, designPhilosophy: "", circulationStandards: "", roomSizingNotes: "", terminology: "" },
    update: {},
  });
}

export async function setLayoutConstitutionAction(fields: {
  designPhilosophy: string;
  circulationStandards: string;
  roomSizingNotes: string;
  terminology: string;
}) {
  await requireSuperAdmin();
  await prisma.layoutConstitution.upsert({
    where: { id: LAYOUT_CONSTITUTION_ID },
    create: { id: LAYOUT_CONSTITUTION_ID, ...fields },
    update: fields,
  });
  revalidateLayoutRules();
}
