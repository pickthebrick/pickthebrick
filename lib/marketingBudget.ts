import "server-only";
import { prisma } from "@/lib/prisma";

// This app's own AI spend cap - checked before every OpenAI call in
// lib/ai/marketingProvider.ts via assertBudgetAvailable(). OpenAI's own
// project-level budget is a *soft* threshold (requests can keep going after
// it's exceeded), so this is the actual hard stop: once today's or this
// month's recorded spend hits the cap, the app refuses to call OpenAI at
// all rather than hoping the account-level limit catches it.
const BUDGET_ID = "marketing-budget";

// Approximate OpenAI list pricing, USD per 1M tokens - this app's own
// estimate for the hard-stop math, not what OpenAI actually bills. Update
// if you change MARKETING_AI_MODEL or OpenAI repriced it.
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4.1": { input: 2, output: 8 },
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
};
// Unlisted model - assume something mid-tier so the estimate stays
// conservative (overestimates cost) rather than silently under-tracking.
const DEFAULT_PRICING = { input: 0.5, output: 1.5 };

export function estimateCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model] ?? DEFAULT_PRICING;
  return (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output;
}

export type BudgetConfig = {
  dailyCapUsd: number;
  monthlyCapUsd: number;
  maxSingleCallUsd: number;
  warningThresholdUsd: number;
  criticalThresholdUsd: number;
};

async function ensureBudgetRow() {
  return prisma.marketingBudget.upsert({ where: { id: BUDGET_ID }, create: { id: BUDGET_ID }, update: {} });
}

export async function getBudget(): Promise<BudgetConfig> {
  const row = await ensureBudgetRow();
  return {
    dailyCapUsd: row.dailyCapUsd,
    monthlyCapUsd: row.monthlyCapUsd,
    maxSingleCallUsd: row.maxSingleCallUsd,
    warningThresholdUsd: row.warningThresholdUsd,
    criticalThresholdUsd: row.criticalThresholdUsd,
  };
}

export async function setBudget(fields: Partial<BudgetConfig>) {
  await ensureBudgetRow();
  await prisma.marketingBudget.update({ where: { id: BUDGET_ID }, data: fields });
  return getBudget();
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function spendSince(since: Date): Promise<number> {
  const rows = await prisma.marketingAiUsage.findMany({
    where: { createdAt: { gte: since } },
    select: { estimatedCostUsd: true },
  });
  return rows.reduce((sum, r) => sum + r.estimatedCostUsd, 0);
}

export async function getUsageSummary() {
  const [budget, todaySpendUsd, monthSpendUsd] = await Promise.all([
    getBudget(),
    spendSince(startOfToday()),
    spendSince(startOfMonth()),
  ]);
  return { budget, todaySpendUsd, monthSpendUsd };
}

export class BudgetExceededError extends Error {}

// Called before every OpenAI request (see callModel() in
// lib/ai/marketingProvider.ts) - throws if today's or this month's already-
// recorded spend has reached the cap.
export async function assertBudgetAvailable(): Promise<void> {
  const { budget, todaySpendUsd, monthSpendUsd } = await getUsageSummary();
  if (todaySpendUsd >= budget.dailyCapUsd) {
    throw new BudgetExceededError(`Daily AI budget reached ($${budget.dailyCapUsd.toFixed(2)}).`);
  }
  if (monthSpendUsd >= budget.monthlyCapUsd) {
    throw new BudgetExceededError(`Monthly AI budget reached ($${budget.monthlyCapUsd.toFixed(2)}).`);
  }
}

export async function recordUsage(role: string, model: string, inputTokens: number, outputTokens: number) {
  const estimatedCostUsd = estimateCostUsd(model, inputTokens, outputTokens);
  await prisma.marketingAiUsage.create({ data: { role, model, inputTokens, outputTokens, estimatedCostUsd } });
  return estimatedCostUsd;
}

export type UsageTotals = { calls: number; inputTokens: number; outputTokens: number; costUsd: number };
export type RoleUsage = UsageTotals & { role: string };
export type RecentCall = {
  id: string;
  role: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  createdAt: Date;
};

function sumTotals(rows: { inputTokens: number; outputTokens: number; estimatedCostUsd: number }[]): UsageTotals {
  return rows.reduce(
    (acc, r) => ({
      calls: acc.calls + 1,
      inputTokens: acc.inputTokens + r.inputTokens,
      outputTokens: acc.outputTokens + r.outputTokens,
      costUsd: acc.costUsd + r.estimatedCostUsd,
    }),
    { calls: 0, inputTokens: 0, outputTokens: 0, costUsd: 0 },
  );
}

// Full usage detail for the AI Usage tab - token counts (not just USD, which
// getUsageSummary() already covers for the Overview strip), a per-role
// breakdown for the current month, and the most recent individual calls.
export async function getUsageDetail() {
  const [budget, monthRows, recentRows] = await Promise.all([
    getBudget(),
    prisma.marketingAiUsage.findMany({ where: { createdAt: { gte: startOfMonth() } } }),
    prisma.marketingAiUsage.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  const todayRows = monthRows.filter((r) => r.createdAt >= startOfToday());
  const today = sumTotals(todayRows);
  const month = sumTotals(monthRows);

  const byRole = new Map<string, typeof monthRows>();
  for (const row of monthRows) {
    const list = byRole.get(row.role) ?? [];
    list.push(row);
    byRole.set(row.role, list);
  }
  const roleBreakdown: RoleUsage[] = [...byRole.entries()]
    .map(([role, rows]) => ({ role, ...sumTotals(rows) }))
    .sort((a, b) => b.costUsd - a.costUsd);

  const recentCalls: RecentCall[] = recentRows.map((r) => ({
    id: r.id,
    role: r.role,
    model: r.model,
    inputTokens: r.inputTokens,
    outputTokens: r.outputTokens,
    costUsd: r.estimatedCostUsd,
    createdAt: r.createdAt,
  }));

  return { budget, today, month, roleBreakdown, recentCalls };
}
