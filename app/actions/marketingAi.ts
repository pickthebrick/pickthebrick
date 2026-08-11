"use server";

import { getSession } from "@/lib/auth";
import { Role } from "@/app/generated/prisma/enums";
import * as marketingState from "@/lib/marketingState";
import {
  runMarketingAnalysis,
  getCurrentMarketingAnalysis,
  generateContentConcept as generateContentConceptProvider,
  runMarketingAgent,
  type ContentConceptInput,
} from "@/lib/ai/marketingProvider";

async function requireSuperAdmin() {
  const session = await getSession();
  if (!session || session.role !== Role.super_admin) throw new Error("Super admin only");
}

// --- AI Marketing Manager analysis ---

export async function getMarketingAnalysis() {
  await requireSuperAdmin();
  return getCurrentMarketingAnalysis();
}

export async function refreshMarketingAnalysis() {
  await requireSuperAdmin();
  return runMarketingAnalysis();
}

export async function setRecommendationStatusAction(id: string, status: "Approved" | "Rejected") {
  await requireSuperAdmin();
  await marketingState.setRecommendationStatus(id, status);
}

// --- Content Studio ---

export async function generateContentConcept(input: ContentConceptInput) {
  await requireSuperAdmin();
  return generateContentConceptProvider(input);
}

// --- Approvals: autonomy, permissions, queue ---

export async function getMarketingWorkspaceState() {
  await requireSuperAdmin();
  return marketingState.getWorkspaceState();
}

export async function setAutonomyLevelAction(level: number) {
  await requireSuperAdmin();
  await marketingState.setAutonomyLevel(level);
}

export async function setToolPermissionAction(tool: string, permission: string, enabled: boolean) {
  await requireSuperAdmin();
  await marketingState.setToolPermission(tool, permission, enabled);
}

export async function approveQueueItemAction(id: string) {
  await requireSuperAdmin();
  await marketingState.approveQueueItem(id);
}

// --- Standing instructions ---

export async function getInstructionsAction() {
  await requireSuperAdmin();
  return marketingState.getInstructions();
}

export async function addInstructionAction(text: string) {
  await requireSuperAdmin();
  return marketingState.addInstruction(text);
}

export async function removeInstructionAction(id: string) {
  await requireSuperAdmin();
  return marketingState.removeInstruction(id);
}

// --- Chat (shared by the floating popup and the full Chat tab) ---

export async function getChatHistoryAction() {
  await requireSuperAdmin();
  return marketingState.getChatHistory();
}

export async function sendChatMessageAction(message: string) {
  await requireSuperAdmin();
  const text = message.trim();
  if (!text) throw new Error("Message can't be empty");
  // runMarketingAgent reads prior history itself and appends this message
  // for the model call - persist both turns only after it returns, so the
  // history it reads never includes this not-yet-saved message twice.
  const { reply, toolCalls } = await runMarketingAgent(text);
  await marketingState.appendChatMessage("user", text);
  await marketingState.appendChatMessage("assistant", reply, toolCalls.length ? toolCalls : undefined);
  return { reply, toolCalls };
}
