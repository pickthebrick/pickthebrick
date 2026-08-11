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
  opportunities: MarketingOpportunity[];
  opportunitiesUpdatedAt: Date | null;
};

export type MarketingOpportunity = { title: string; why: string; action: string };
export type MarketingChannel = "google" | "meta" | "website";

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
    opportunities: JSON.parse(row.opportunitiesJson || "[]"),
    opportunitiesUpdatedAt: row.opportunitiesUpdatedAt,
  };
}

export async function setAnalysisSummary(working: string[], problems: string[]) {
  await ensureWorkspaceRow();
  await prisma.marketingWorkspaceState.update({
    where: { id: WORKSPACE_STATE_ID },
    data: { workingJson: JSON.stringify(working), problemsJson: JSON.stringify(problems), analysisUpdatedAt: new Date() },
  });
}

// Growth Manager's latest opportunity list - cache-and-replace, same as the
// analysis summary above (not individually approvable like recommendations).
export async function setOpportunities(list: MarketingOpportunity[]) {
  await ensureWorkspaceRow();
  await prisma.marketingWorkspaceState.update({
    where: { id: WORKSPACE_STATE_ID },
    data: { opportunitiesJson: JSON.stringify(list), opportunitiesUpdatedAt: new Date() },
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

// --- Performance Analyst: per-channel insight cache ---

export type ChannelInsights = { insights: string[]; fallback: boolean; updatedAt: Date | null };

export async function getChannelInsights(channel: MarketingChannel): Promise<ChannelInsights | null> {
  const row = await prisma.marketingChannelInsight.findUnique({ where: { channel } });
  if (!row) return null;
  return { insights: JSON.parse(row.insightsJson || "[]"), fallback: row.fallback, updatedAt: row.updatedAt };
}

export async function setChannelInsights(channel: MarketingChannel, insights: string[], fallback: boolean) {
  await prisma.marketingChannelInsight.upsert({
    where: { channel },
    create: { channel, insightsJson: JSON.stringify(insights), fallback },
    update: { insightsJson: JSON.stringify(insights), fallback },
  });
}

// --- Reporting Manager: report history ---

export async function getReports(limit = 20) {
  return prisma.marketingReport.findMany({ orderBy: { createdAt: "desc" }, take: limit });
}

export async function addReport(period: "daily" | "weekly", content: string, fallback: boolean) {
  return prisma.marketingReport.create({ data: { period, content, fallback } });
}

// --- Marketing Constitution: permanent business knowledge every role's ---
// --- system prompt is built from (see buildBusinessContext() in         ---
// --- lib/ai/marketingProvider.ts), editable from the Knowledge Base tab ---

const CONSTITUTION_ID = "marketing-constitution";

export type MarketingConstitutionFields = {
  business: string;
  customers: string;
  products: string;
  objectives: string;
  brandRules: string;
  commercialRules: string;
};

// Seeded with what's already known about PickTheBrick (same facts as the
// public site assistant's system prompt) so the Constitution is useful on
// day one instead of empty - the founder edits from there, not from scratch.
const DEFAULT_CONSTITUTION: MarketingConstitutionFields = {
  business:
    "PickTheBrick is a Dubai office fit-out aggregator, a subsidiary of Arabesc Contracting LLC. Two entry points: Design (a professional designer builds a concept from a short survey) and Build (client picks products directly from the catalog for a priced quote). Every price shown is supply-and-install - there is no separate installation charge. Installation is carried out by independent contractor partners, approved per trade category, coordinated by a Captain (PickTheBrick's project manager) against one shared project timeline.",
  customers:
    "Primarily Dubai-based SMEs and larger companies fitting out a new or existing office. Decision-makers are usually founders, office managers, or ops leads comparing multiple quotes. Common objections: unclear total cost, distrust of hidden install fees, uncertainty about timelines and contractor quality.",
  products:
    "Catalog categories: flooring, partitions, ceilings, doors, electrical, lighting, HVAC, CCTV, furniture, and authority approvals. Pricing anchor: 1,000 sqft ≈ AED 250K. Instant-estimate formula: (sqft×210 + employees×2500) × quality multiplier (Standard 0.92 / Premium 1.0 / Luxury 1.15).",
  objectives:
    "1. Generate qualified office-fit-out leads. 2. Increase website conversion rate. 3. Reduce cost per qualified lead. 4. Increase revenue attributable to marketing.",
  brandRules:
    "Tone: direct, transparent, confident - not corporate or salesy. Lead with the 'supply + install, always, no hidden install fee' promise when relevant. Avoid generic agency language ('synergy', 'best-in-class', 'game-changing').",
  commercialRules:
    "Never invent a price - only use the pricing anchor/formula above or figures explicitly provided. Never promise a delivery or install timeline unless it comes from real project data. Never claim a service or product is available unless it's actually in the catalog.",
};

async function ensureConstitutionRow() {
  return prisma.marketingConstitution.upsert({
    where: { id: CONSTITUTION_ID },
    create: { id: CONSTITUTION_ID, ...DEFAULT_CONSTITUTION },
    update: {},
  });
}

export async function getConstitution(): Promise<MarketingConstitutionFields> {
  const row = await ensureConstitutionRow();
  return {
    business: row.business,
    customers: row.customers,
    products: row.products,
    objectives: row.objectives,
    brandRules: row.brandRules,
    commercialRules: row.commercialRules,
  };
}

export async function setConstitution(fields: Partial<MarketingConstitutionFields>) {
  await ensureConstitutionRow();
  await prisma.marketingConstitution.update({ where: { id: CONSTITUTION_ID }, data: fields });
  return getConstitution();
}
