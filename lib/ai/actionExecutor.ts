import "server-only";
import { prisma } from "@/lib/prisma";
import * as marketingState from "@/lib/marketingState";
import { ACTION_TOOLS } from "@/lib/ai/actionTools";
import { ACTION_PERMISSIONS } from "@/lib/ai/actionPermissions";

// Turns a MarketingRecommendation row into a real action-state machine.
// approveAction/rejectAction only ever change `status` - they never call an
// external service. Only executeAction() does that, and only after checking
// the same per-tool permission system the Approvals page already exposes
// (DEFAULT_PERMISSIONS in app/admin/brain/data.ts - Execute/Publish default
// OFF). This is the actual fix for the AI claiming things were "set up" when
// nothing had run: advisory recommendations (type "advisory", the default -
// what runMarketingAnalysis() generates) have no execute step at all and stop
// at APPROVED, exactly like before this feature existed.

export type CreateActionInput = {
  title: string;
  why: string;
  impact: string;
  risk: string;
  type?: string; // "advisory" (default) or e.g. "google_ads.create_campaign"
  requestPayload?: unknown;
};

export async function createAction(input: CreateActionInput) {
  const type = input.type ?? "advisory";
  return prisma.marketingRecommendation.create({
    data: {
      title: input.title,
      why: input.why,
      impact: input.impact,
      risk: input.risk,
      status: "RECOMMENDED",
      type,
      externalService: type === "advisory" ? null : type.split(".")[0],
      requestPayloadJson: input.requestPayload !== undefined ? JSON.stringify(input.requestPayload) : null,
    },
  });
}

export async function approveAction(id: string) {
  return marketingState.setRecommendationStatus(id, "APPROVED");
}

export async function rejectAction(id: string) {
  return marketingState.setRecommendationStatus(id, "REJECTED");
}

export type ExecuteResult = {
  status: "EXECUTED" | "FAILED";
  externalId?: string;
  error?: string;
};

// Refuses (returns a FAILED-shaped result, never throws) unless the row is
// APPROVED (or retrying a previous FAILED attempt - e.g. permission was off,
// the founder turned it on, and now wants to retry the same approved action)
// and the required permission is on. Advisory rows have no tool mapping and
// can never reach here successfully - approving them is already their
// terminal state.
export async function executeAction(id: string): Promise<ExecuteResult> {
  const row = await prisma.marketingRecommendation.findUnique({ where: { id } });
  if (!row) return { status: "FAILED", error: `No action found with id ${id}.` };

  if (row.status !== "APPROVED" && row.status !== "FAILED") {
    return { status: "FAILED", error: `Action must be APPROVED before it can be executed (current status: ${row.status}).` };
  }

  const tool = ACTION_TOOLS[row.type];
  if (!tool) {
    return { status: "FAILED", error: `"${row.type}" has no execute tool yet - it can only be approved, not executed.` };
  }

  const requiredPermission = ACTION_PERMISSIONS[row.type];
  if (requiredPermission) {
    const state = await marketingState.getWorkspaceState();
    const granted = state.permissions[requiredPermission.tool]?.includes(requiredPermission.permission);
    if (!granted) {
      const error = `Execute permission is off for ${requiredPermission.tool} (needs "${requiredPermission.permission}"). Turn it on in Approvals first.`;
      await prisma.marketingRecommendation.update({ where: { id }, data: { status: "FAILED", error } });
      return { status: "FAILED", error };
    }
  }

  await prisma.marketingRecommendation.update({ where: { id }, data: { status: "EXECUTING", executionStartedAt: new Date() } });

  const payload = row.requestPayloadJson ? JSON.parse(row.requestPayloadJson) : {};
  let result;
  try {
    // tool's real parameter type is specific to its action (see
    // lib/ai/actionTools.ts) - this payload comes from a JSON blob parsed at
    // runtime, so there's nothing more precise to give the type checker here.
    result = await tool(payload as never);
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown execution error.";
    await prisma.marketingRecommendation.update({ where: { id }, data: { status: "FAILED", error, executionCompletedAt: new Date() } });
    return { status: "FAILED", error };
  }

  if (!result.success) {
    const error = result.error ?? "Execution failed.";
    await prisma.marketingRecommendation.update({ where: { id }, data: { status: "FAILED", error, executionCompletedAt: new Date() } });
    return { status: "FAILED", error };
  }

  await prisma.marketingRecommendation.update({
    where: { id },
    data: {
      status: "EXECUTED",
      externalId: result.externalId ?? null,
      resultJson: JSON.stringify(result),
      error: null,
      executionCompletedAt: new Date(),
    },
  });
  return { status: "EXECUTED", externalId: result.externalId };
}
