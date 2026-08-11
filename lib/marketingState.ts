import "server-only";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PERMISSIONS } from "@/app/admin/brain/data";

// Single source of truth for everything the Marketing chat agent's tool
// calls can mutate. Both the regular UI server actions (app/actions/marketingAi.ts)
// and the agent's tool-executor (lib/ai/marketingProvider.ts) read/write
// through here, so the Approvals/Overview pages and the chat are always
// looking at the same rows - approve a recommendation in chat and the
// Overview page shows it approved, no separate sync needed.

const WORKSPACE_STATE_ID = "marketing-workspace-state";

export type WorkspaceState = {
  autonomyLevel: number;
  permissions: Record<string, string[]>;
  queueApprovals: Record<string, "Approved">;
  working: string[];
  problems: string[];
  analysisUpdatedAt: Date | null;
};

async function ensureWorkspaceRow() {
  return prisma.marketingWorkspaceState.upsert({
    where: { id: WORKSPACE_STATE_ID },
    create: { id: WORKSPACE_STATE_ID, permissionsJson: JSON.stringify(DEFAULT_PERMISSIONS) },
    update: {},
  });
}

export async function getWorkspaceState(): Promise<WorkspaceState> {
  const row = await ensureWorkspaceRow();
  return {
    autonomyLevel: row.autonomyLevel,
    permissions: JSON.parse(row.permissionsJson || "{}"),
    queueApprovals: JSON.parse(row.queueApprovalsJson || "{}"),
    working: JSON.parse(row.workingJson || "[]"),
    problems: JSON.parse(row.problemsJson || "[]"),
    analysisUpdatedAt: row.analysisUpdatedAt,
  };
}

export async function setAnalysisSummary(working: string[], problems: string[]) {
  await ensureWorkspaceRow();
  await prisma.marketingWorkspaceState.update({
    where: { id: WORKSPACE_STATE_ID },
    data: { workingJson: JSON.stringify(working), problemsJson: JSON.stringify(problems), analysisUpdatedAt: new Date() },
  });
}

export async function setAutonomyLevel(level: number) {
  await ensureWorkspaceRow();
  await prisma.marketingWorkspaceState.update({ where: { id: WORKSPACE_STATE_ID }, data: { autonomyLevel: level } });
}

export async function setToolPermission(tool: string, permission: string, enabled: boolean) {
  const state = await getWorkspaceState();
  const current = state.permissions[tool] ?? [];
  const next = enabled ? Array.from(new Set([...current, permission])) : current.filter((p) => p !== permission);
  const permissions = { ...state.permissions, [tool]: next };
  await prisma.marketingWorkspaceState.update({
    where: { id: WORKSPACE_STATE_ID },
    data: { permissionsJson: JSON.stringify(permissions) },
  });
  return permissions;
}

export async function approveQueueItem(id: string) {
  const state = await getWorkspaceState();
  const queueApprovals = { ...state.queueApprovals, [id]: "Approved" as const };
  await prisma.marketingWorkspaceState.update({
    where: { id: WORKSPACE_STATE_ID },
    data: { queueApprovalsJson: JSON.stringify(queueApprovals) },
  });
  return queueApprovals;
}

export async function getRecommendations() {
  return prisma.marketingRecommendation.findMany({ orderBy: { createdAt: "asc" } });
}

export async function replaceRecommendations(
  list: { title: string; why: string; impact: string; risk: string }[],
) {
  await prisma.$transaction([
    prisma.marketingRecommendation.deleteMany({}),
    prisma.marketingRecommendation.createMany({ data: list }),
  ]);
  return getRecommendations();
}

export async function setRecommendationStatus(id: string, status: "Approved" | "Rejected") {
  return prisma.marketingRecommendation.update({ where: { id }, data: { status } }).catch(() => null);
}

export async function getInstructions() {
  return prisma.marketingInstruction.findMany({ orderBy: { createdAt: "asc" } });
}

export async function addInstruction(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return getInstructions();
  await prisma.marketingInstruction.create({ data: { text: trimmed } });
  return getInstructions();
}

export async function removeInstruction(id: string) {
  await prisma.marketingInstruction.delete({ where: { id } }).catch(() => {});
  return getInstructions();
}

export async function getChatHistory(limit = 40) {
  const rows = await prisma.marketingChatMessage.findMany({ orderBy: { createdAt: "desc" }, take: limit });
  return rows.reverse();
}

export async function appendChatMessage(role: "user" | "assistant", content: string, toolCalls?: unknown) {
  return prisma.marketingChatMessage.create({
    data: { role, content, toolCallsJson: toolCalls ? JSON.stringify(toolCalls) : null },
  });
}
