"use server";

import { getSession } from "@/lib/auth";
import { Role } from "@/app/generated/prisma/enums";
import * as marketingState from "@/lib/marketingState";
import {
  runMarketingAnalysis,
  getCurrentMarketingAnalysis,
  generateContentConcept as generateContentConceptProvider,
  runMarketingAgent,
  runPerformanceAnalysis,
  getCurrentChannelInsights,
  findGrowthOpportunities,
  getCurrentOpportunities,
  generateReport,
  type ContentConceptInput,
} from "@/lib/ai/marketingProvider";
import type { MarketingChannel, MarketingConstitutionFields } from "@/lib/marketingState";
import { getUsageSummary, getUsageDetail, getBudget, setBudget, type BudgetConfig } from "@/lib/marketingBudget";
import { getWebsiteAnalytics } from "@/lib/ga4";
import { getGoogleAdsPerformance } from "@/lib/googleAds";
import { getMetaPageInfo } from "@/lib/meta";
import { executeAction, createAction } from "@/lib/ai/actionExecutor";
import type { ContentConcept } from "@/lib/ai/marketingProvider";

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

export async function setRecommendationStatusAction(id: string, status: "APPROVED" | "REJECTED") {
  await requireSuperAdmin();
  await marketingState.setRecommendationStatus(id, status);
}

// Actually runs an APPROVED action-type recommendation against its external
// service (mocked for now - see lib/ai/actionTools.ts). Returns the real
// outcome; never assume success just because this resolved without throwing.
export async function executeActionAction(id: string) {
  await requireSuperAdmin();
  return executeAction(id);
}

// Every pending/actionable recommendation, regardless of where it came from
// (the automatic analysis run, propose_action, or a proposed content
// concept) - the single feed the Overview, Approvals, and Chat panels all
// read from so nothing shows up in one place and not the others.
export async function getRecommendationsAction() {
  await requireSuperAdmin();
  return marketingState.getRecommendations();
}

// --- Content Studio ---

// Plain generation - does not create an approvable row. Content Studio's UI
// calls this directly so the founder can iterate on drafts freely; only
// proposeContentConceptAction (below) or Aiman's generate_content_concept
// chat tool actually queues something for approval.
export async function generateContentConcept(input: ContentConceptInput) {
  await requireSuperAdmin();
  return generateContentConceptProvider(input);
}

// Turns a generated concept the founder picked in Content Studio into a real
// pending action (type meta.create_post) that shows up on Overview,
// Approvals, and inline in chat - the same approve/execute path as any other
// action, so the image and copy get reviewed before anything is queued as
// live-worthy.
export async function proposeContentConceptAction(input: {
  platform: string;
  format: string;
  concept: ContentConcept;
}) {
  await requireSuperAdmin();
  return createAction({
    title: `${input.platform} ${input.format} concept: ${input.concept.hook.slice(0, 60)}`,
    why: "Content Manager concept selected for review",
    impact: "Pending performance once published",
    risk: "Low",
    type: "meta.create_post",
    requestPayload: {
      platform: input.platform.toLowerCase() === "instagram" ? "instagram" : "facebook",
      caption: input.concept.caption,
      hook: input.concept.hook,
      visual: input.concept.visual,
      cta: input.concept.cta,
      imageUrl: input.concept.imageUrl,
    },
  });
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

// --- Performance Analyst (Google Ads / Meta / Website pages) ---

export async function getChannelInsightsAction(channel: MarketingChannel) {
  await requireSuperAdmin();
  return getCurrentChannelInsights(channel);
}

export async function refreshChannelInsightsAction(channel: MarketingChannel) {
  await requireSuperAdmin();
  return runPerformanceAnalysis(channel);
}

// Real GA4 numbers for the Website & Analytics tab - returns null if GA4
// isn't configured yet or the property has no traffic recorded yet.
export async function getWebsiteAnalyticsAction() {
  await requireSuperAdmin();
  return getWebsiteAnalytics();
}

// Real Google Ads numbers for the Google Ads tab - returns null if the
// integration isn't configured yet or no spend has been recorded yet.
export async function getGoogleAdsPerformanceAction() {
  await requireSuperAdmin();
  return getGoogleAdsPerformance();
}

// Real Facebook Page follower count for the Meta tab - returns null if the
// integration isn't configured yet.
export async function getMetaPageInfoAction() {
  await requireSuperAdmin();
  return getMetaPageInfo();
}

// --- Growth Manager (Overview page) ---

export async function getOpportunitiesAction() {
  await requireSuperAdmin();
  return getCurrentOpportunities();
}

export async function refreshOpportunitiesAction() {
  await requireSuperAdmin();
  return findGrowthOpportunities();
}

// --- Reporting Manager (Reports page) ---

export async function getReportsAction() {
  await requireSuperAdmin();
  return marketingState.getReports();
}

export async function generateReportAction(period: "daily" | "weekly") {
  await requireSuperAdmin();
  return generateReport(period);
}

// --- AI budget (Overview page usage card + Approvals page cap editor) ---

export async function getUsageSummaryAction() {
  await requireSuperAdmin();
  return getUsageSummary();
}

// Full token/cost breakdown for the dedicated AI Usage tab.
export async function getUsageDetailAction() {
  await requireSuperAdmin();
  return getUsageDetail();
}

export async function getBudgetAction() {
  await requireSuperAdmin();
  return getBudget();
}

export async function setBudgetAction(fields: Partial<BudgetConfig>) {
  await requireSuperAdmin();
  return setBudget(fields);
}

// --- Marketing Constitution (Knowledge Base tab) ---

export async function getConstitutionAction() {
  await requireSuperAdmin();
  return marketingState.getConstitution();
}

export async function setConstitutionAction(fields: Partial<MarketingConstitutionFields>) {
  await requireSuperAdmin();
  return marketingState.setConstitution(fields);
}
