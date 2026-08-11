import "server-only";
import OpenAI from "openai";
import type {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessage,
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";
import {
  PINNED,
  MARKETING_KPIS,
  GOOGLE_CAMPAIGNS,
  GOOGLE_INSIGHTS,
  META_CONTENT,
  META_INSIGHTS,
  LEADS,
  QUEUE_ITEMS,
  AUTONOMY_LEVELS,
} from "@/app/admin/brain/data";
import * as marketingState from "@/lib/marketingState";
import type { MarketingChannel, MarketingOpportunity } from "@/lib/marketingState";
import { logMarketingEvent, getRecentLogContext } from "@/lib/marketingLog";
import { saveGeneratedContent } from "@/lib/marketingContent";
import { assertBudgetAvailable, recordUsage, BudgetExceededError } from "@/lib/marketingBudget";
import { getWebsiteAnalytics } from "@/lib/ga4";
import type { MarketingRoleId } from "@/lib/ai/marketingRoles";

// Single place the /admin/brain "AI Marketing Manager" card, the Content
// Studio generator, and the Marketing chat (popup + Chat tab) all call
// through - swapping engines later (e.g. to Claude) means editing this one
// file. Currently backed by OpenAI ("chatgpt engine for now" per the
// founder). Requires OPENAI_API_KEY; MARKETING_AI_MODEL lets the model be
// changed without touching request shape. Mirrors the graceful-fallback
// pattern in app/actions/assistant.ts - every export below returns
// clearly-labeled sample output instead of throwing when no key is set.
const MARKETING_AI_MODEL = process.env.MARKETING_AI_MODEL || "gpt-4o-mini";
const NOT_CONFIGURED = "OPENAI_API_KEY isn't set yet — showing example output. Add it to enable live AI output.";

function getClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

// Every OpenAI request in this file goes through here - the one place that
// enforces this app's own hard spend cap (lib/marketingBudget.ts, not
// OpenAI's own soft project budget) and records token usage/cost for every
// call, regardless of which role made it. Callers just check `ok` - every
// failure mode (missing key, budget cap, or OpenAI itself erroring, e.g. an
// account with no credits) degrades to fallback content instead of a 500,
// matching this app's fallback-first design everywhere else.
type CallModelResult =
  | { ok: true; message: ChatCompletionMessage }
  | { ok: false; reason: "not_configured" | "budget_exceeded" | "api_error"; detail?: string };

// One line, safe to show the founder (in chat) or a developer (server logs)
// for any callModel failure - the actual cause, not a generic "not set up".
function failureNote(result: Extract<CallModelResult, { ok: false }>): string {
  if (result.reason === "budget_exceeded") {
    return "This app's AI budget cap has been reached - showing example output. Raise the cap on the Approvals page to continue.";
  }
  if (result.reason === "api_error") {
    return `OpenAI request failed${result.detail ? ` (${result.detail})` : ""} - showing example output.`;
  }
  return NOT_CONFIGURED;
}

async function callModel(role: MarketingRoleId, params: Omit<ChatCompletionCreateParamsNonStreaming, "model">): Promise<CallModelResult> {
  const client = getClient();
  if (!client) return { ok: false, reason: "not_configured" };

  try {
    await assertBudgetAvailable();
  } catch (err) {
    if (err instanceof BudgetExceededError) return { ok: false, reason: "budget_exceeded" };
    throw err;
  }

  let response;
  try {
    response = await client.chat.completions.create({ model: MARKETING_AI_MODEL, ...params });
  } catch (err) {
    const detail = err instanceof OpenAI.APIError ? (err.error as { message?: string } | undefined)?.message ?? err.message : "unknown error";
    console.error(`marketingProvider: OpenAI call failed for role "${role}"`, err);
    return { ok: false, reason: "api_error", detail };
  }

  if (response.usage) {
    await recordUsage(role, MARKETING_AI_MODEL, response.usage.prompt_tokens, response.usage.completion_tokens);
  }
  const message = response.choices[0]?.message;
  if (!message) return { ok: false, reason: "api_error", detail: "empty response" };
  return { ok: true, message };
}

// The Constitution (permanent business knowledge, founder-editable from the
// Knowledge Base tab) plus a compact snapshot of the current sample data -
// the latter stands in for what a real integration would pull live from
// Google Ads/GA/Meta/the CRM (see the design handoff's Data Architecture
// notes). Kept short on purpose so every call stays cheap and fast.
async function buildBusinessContext(): Promise<string> {
  const constitution = await marketingState.getConstitution();
  const pinned = PINNED.map((p) => `- ${p.label}: ${p.value}`).join("\n");
  const kpis = MARKETING_KPIS.map((k) => `- ${k.label}: ${k.value} (${k.deltaArrow}${k.delta} vs prev. period)`).join("\n");
  const googleTop = GOOGLE_CAMPAIGNS.slice(0, 5)
    .map((c) => `- ${c.name}: spend ${c.spend}, ${c.leads} leads, ${c.qualified} qualified, ROAS ${c.roas}, status ${c.status}`)
    .join("\n");
  const metaTop = META_CONTENT.slice(0, 5)
    .map((c) => `- "${c.name}" (${c.type}): reach ${c.reach}, engagement ${c.engagement}, ${c.leads} leads, ${c.revenue} revenue`)
    .join("\n");
  const leads = LEADS.slice(0, 6).map((l) => `- ${l.name} via ${l.source}, est. ${l.budget}, status ${l.status}`).join("\n");
  const websiteAnalytics = await getWebsiteAnalytics();
  const pages = websiteAnalytics
    ? websiteAnalytics.topPages.map((p) => `- ${p.page}: ${p.sessions} sessions, ${(p.bounceRate * 100).toFixed(1)}% bounce`).join("\n")
    : "(no Google Analytics data yet - GA4 is connected but hasn't recorded any traffic)";

  return `--- Marketing Constitution (permanent, founder-set - follow these rules over anything else below) ---
Business: ${constitution.business}
Customers: ${constitution.customers}
Products: ${constitution.products}
Marketing objectives: ${constitution.objectives}
Brand rules: ${constitution.brandRules}
Commercial rules (hard constraints, never violate): ${constitution.commercialRules}

--- Current snapshot (sample data standing in for live feeds - reason over it as if real, but don't claim certainty beyond what it shows) ---
Pinned business facts:
${pinned}

Marketing KPIs (this period):
${kpis}

Top Google Ads campaigns:
${googleTop}

Top Meta/Instagram content:
${metaTop}

Recent leads:
${leads}

Top website pages:
${pages}`;
}

export type MarketingRecommendation = { id: string; title: string; why: string; impact: string; risk: string; status: string };
export type MarketingAnalysis = {
  working: string[];
  problems: string[];
  recommendations: MarketingRecommendation[];
  fallback: boolean;
  analysisUpdatedAt: Date | null;
};

const FALLBACK_WORKING = [
  'Google Search for "office fit out Dubai" generated 18 qualified leads at AED 142 each.',
  'Instagram Reel "What AED 100K gets you" generated 3.8× your normal website traffic.',
];
const FALLBACK_PROBLEMS = [
  '"Office furniture Dubai" consumed AED 720 with only 2 low-quality leads.',
  "Meta CPM increased 31% over the last 7 days.",
];
const FALLBACK_RECOMMENDATIONS = [
  { title: "Pause 3 underperforming Google keywords", why: "CPA 3.2× account average", impact: "Save ~AED 1,100/wk", risk: "Low" },
  { title: "Increase winning Search campaign budget by 15%", why: "CPA 34% below account average", impact: "+6-9 qualified leads/wk", risk: "Low" },
];

// Regenerates the analysis via the LLM (or the fallback content above),
// persists the recommendations + summary so they survive reloads and can be
// approved/rejected by id (from the UI or from chat), and logs the run.
// Only called from an explicit "Refresh analysis" click, or once on first
// visit ever - NOT on every page mount, so it never silently overwrites a
// status the chat agent (or a prior visit) already set.
export async function runMarketingAnalysis(): Promise<MarketingAnalysis> {
  let working = FALLBACK_WORKING;
  let problems = FALLBACK_PROBLEMS;
  let recSource: { title: string; why: string; impact: string; risk: string }[] = FALLBACK_RECOMMENDATIONS;
  let fallback = true;

  const result = await callModel("manager", {
    max_tokens: 700,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are the Marketing Manager for PickTheBrick - you decide what matters. Read the business snapshot and produce a short morning brief. Respond with strict JSON only, shape:
{"working": string[] (2-3 short sentences on what's performing well), "problems": string[] (2-3 short sentences on what needs attention), "recommendations": [{"title": string, "why": string (short), "impact": string (short, e.g. "+6-9 qualified leads/wk"), "risk": string (one of "Low", "Medium — <reason>", "High — <reason>")}] (3-4 items)}
Be specific and reference numbers from the snapshot. No prose outside the JSON.`,
      },
      { role: "user", content: await buildBusinessContext() },
    ],
  });
  if (result.ok) {
    try {
      const raw = result.message.content;
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed?.working && parsed?.problems && parsed?.recommendations) {
        working = parsed.working;
        problems = parsed.problems;
        recSource = parsed.recommendations;
        fallback = false;
      }
    } catch {
      // fall through to fallback content already assigned above
    }
  }

  const recommendations = await marketingState.replaceRecommendations(recSource);
  await marketingState.setAnalysisSummary(working, problems);
  await logMarketingEvent({ type: "analysis", workingCount: working.length, problemsCount: problems.length, recommendationCount: recommendations.length });

  return { working, problems, recommendations, fallback, analysisUpdatedAt: new Date() };
}

// Cheap read of the last-run analysis - no LLM call, safe to call on every
// Overview page mount. Bootstraps with one real run if nothing's ever been
// generated yet (first visit), same seed-once idea as the Brain checklist.
export async function getCurrentMarketingAnalysis(): Promise<MarketingAnalysis> {
  const state = await marketingState.getWorkspaceState();
  if (!state.analysisUpdatedAt) return runMarketingAnalysis();

  const recommendations = await marketingState.getRecommendations();
  return {
    working: state.working,
    problems: state.problems,
    recommendations,
    fallback: !getClient(),
    analysisUpdatedAt: state.analysisUpdatedAt,
  };
}

export type ContentConceptInput = { platform: string; format: string; idea?: string };
export type ContentConcept = { hook: string; visual: string; caption: string; cta: string; fallback: boolean };

const FALLBACK_CONCEPT: ContentConcept = {
  hook: '"Most people overpay for their Dubai office fit-out. Here\'s exactly what AED 100K buys you."',
  visual: "Split-screen before/after walkthrough, handheld camera, natural light.",
  caption: 'Transparent pricing, no surprises. Supply + install, always. DM "OFFICE" for your estimate.',
  cta: "Get your instant estimate — link in bio",
  fallback: true,
};

export async function generateContentConcept(input: ContentConceptInput): Promise<ContentConcept> {
  const result = await callModel("content", {
    max_tokens: 500,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are the Content Manager for PickTheBrick's marketing team (Dubai office fit-out, supply + install always, transparent fixed pricing). Your job is creating content concepts and campaign copy - not analysis or strategy, that's other teammates' jobs. Given a platform and format (and optionally a seed idea), produce one content concept. Respond with strict JSON only, shape: {"hook": string, "visual": string (shot/production direction), "caption": string, "cta": string}. Keep it punchy and specific to the platform/format.`,
      },
      {
        role: "user",
        content: `Platform: ${input.platform}\nFormat: ${input.format}${input.idea ? `\nSeed idea: ${input.idea}` : ""}\n\nBusiness context:\n${await buildBusinessContext()}`,
      },
    ],
  });
  if (!result.ok) return FALLBACK_CONCEPT;

  const raw = result.message.content;
  if (!raw) return FALLBACK_CONCEPT;
  try {
    const parsed = JSON.parse(raw) as Partial<ContentConcept>;
    if (!parsed.hook || !parsed.visual || !parsed.caption || !parsed.cta) return FALLBACK_CONCEPT;
    const concept: ContentConcept = { hook: parsed.hook, visual: parsed.visual, caption: parsed.caption, cta: parsed.cta, fallback: false };
    await saveGeneratedContent({ platform: input.platform, format: input.format, idea: input.idea, ...concept });
    await logMarketingEvent({ type: "content_generated", platform: input.platform, format: input.format, idea: input.idea });
    return concept;
  } catch {
    return FALLBACK_CONCEPT;
  }
}

// --- Performance Analyst: read-only per-channel analysis ---

const CHANNEL_NAMES: Record<MarketingChannel, string> = { google: "Google Ads", meta: "Meta/Instagram", website: "the website" };
// Google Ads and Meta aren't wired to real APIs yet, so they still fall back
// to sample insights when the LLM call fails or isn't configured. Website
// is real (GA4) - its "fallback" is an honest no-data note, never invented
// numbers.
const CHANNEL_FALLBACK_INSIGHTS: Record<MarketingChannel, string[]> = {
  google: GOOGLE_INSIGHTS,
  meta: META_INSIGHTS,
  website: ["No Google Analytics data yet - GA4 is connected but the property hasn't recorded any traffic."],
};

async function buildChannelData(channel: MarketingChannel): Promise<string> {
  if (channel === "google") {
    return GOOGLE_CAMPAIGNS.map((c) => `- ${c.name}: spend ${c.spend}, ${c.leads} leads, ${c.qualified} qualified, CPL ${c.cpl}, revenue ${c.revenue}, ROAS ${c.roas}, status ${c.status}`).join("\n");
  }
  if (channel === "meta") {
    return META_CONTENT.map((c) => `- "${c.name}" (${c.type}): reach ${c.reach}, engagement ${c.engagement}, ${c.clicks} clicks, ${c.leads} leads, ${c.revenue} revenue`).join("\n");
  }
  const analytics = await getWebsiteAnalytics();
  if (!analytics) return "(no Google Analytics data yet - GA4 is connected but hasn't recorded any traffic)";
  return analytics.topPages.map((p) => `- ${p.page}: ${p.sessions} sessions, ${(p.bounceRate * 100).toFixed(1)}% bounce`).join("\n");
}

// Regenerates one channel's insights via the LLM (or its fallback), always
// persisting so getCurrentChannelInsights() below stays cheap. Called
// directly by the Google Ads/Meta/Website pages' "Refresh" button, or by the
// Marketing Manager delegating through the analyze_performance tool.
export async function runPerformanceAnalysis(channel: MarketingChannel): Promise<marketingState.ChannelInsights> {
  let insights = CHANNEL_FALLBACK_INSIGHTS[channel];
  let fallback = true;

  const result = await callModel("analyst", {
    max_tokens: 500,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are the Performance Analyst for PickTheBrick's marketing team. You only analyze - you never take action, approve anything, or make final calls, that's the Marketing Manager's job. Read the ${CHANNEL_NAMES[channel]} data and produce 3-4 short, specific insight bullets a marketer would actually act on. Respond with strict JSON only: {"insights": string[]}`,
      },
      { role: "user", content: await buildChannelData(channel) },
    ],
  });
  if (result.ok) {
    try {
      const raw = result.message.content;
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed?.insights) && parsed.insights.length) {
        insights = parsed.insights;
        fallback = false;
      }
    } catch {
      // fall through to fallback content already assigned above
    }
  }

  await marketingState.setChannelInsights(channel, insights, fallback);
  await logMarketingEvent({ type: "insights_generated", channel, count: insights.length });
  return { insights, fallback, updatedAt: new Date() };
}

// Cheap read for the Google Ads/Meta/Website pages - no LLM call. Bootstraps
// once if this channel has never been analyzed yet.
export async function getCurrentChannelInsights(channel: MarketingChannel): Promise<marketingState.ChannelInsights> {
  const existing = await marketingState.getChannelInsights(channel);
  if (existing) return existing;
  return runPerformanceAnalysis(channel);
}

// --- Growth Manager: cross-channel opportunity finding ---

const FALLBACK_OPPORTUNITIES: MarketingOpportunity[] = [
  {
    title: "Dedicated cost-calculator landing page",
    why: "/pricing has high traffic but low conversion - visitors want a number, not a range.",
    action: "Build a page around the internal calculator's formula and link it from top campaigns.",
  },
  {
    title: "Scale the AED 100K reel format",
    why: "3.8x normal traffic on the original - the pattern hasn't been repeated since.",
    action: "Brief the Content Manager for 3-5 variations across different case studies.",
  },
];

export async function findGrowthOpportunities(): Promise<{ opportunities: MarketingOpportunity[]; fallback: boolean }> {
  let opportunities = FALLBACK_OPPORTUNITIES;
  let fallback = true;

  const result = await callModel("growth", {
    max_tokens: 600,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are the Growth Manager for PickTheBrick's marketing team. You look across every channel for gaps and untapped opportunities - a keyword nobody's targeting, a winning pattern worth repeating, an underserved page - not day-to-day optimization (the Performance Analyst's job) or single pieces of content (the Content Manager's job). Respond with strict JSON only: {"opportunities": [{"title": string, "why": string, "action": string}]} (3-4 items).`,
      },
      { role: "user", content: await buildBusinessContext() },
    ],
  });
  if (result.ok) {
    try {
      const raw = result.message.content;
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed?.opportunities) && parsed.opportunities.length) {
        opportunities = parsed.opportunities;
        fallback = false;
      }
    } catch {
      // fall through to fallback content already assigned above
    }
  }

  await marketingState.setOpportunities(opportunities);
  await logMarketingEvent({ type: "opportunities_generated", count: opportunities.length });
  return { opportunities, fallback };
}

// Cheap read for the Overview page - bootstraps once on first-ever visit.
export async function getCurrentOpportunities(): Promise<{ opportunities: MarketingOpportunity[]; fallback: boolean }> {
  const state = await marketingState.getWorkspaceState();
  if (!state.opportunitiesUpdatedAt) return findGrowthOpportunities();
  return { opportunities: state.opportunities, fallback: !getClient() };
}

// --- Reporting Manager: daily/weekly report generation ---

export async function generateReport(period: "daily" | "weekly"): Promise<{ content: string; fallback: boolean }> {
  const recommendations = await marketingState.getRecommendations();
  const openCount = recommendations.filter((r) => r.status === "Awaiting review").length;
  const fallbackContent = `${period === "daily" ? "Daily" : "Weekly"} report (sample - add OPENAI_API_KEY for a live one): Spend AED 184,200, 312 leads, 96 qualified, ROI 6.7x. Google Search remains the strongest channel; Meta CPM is up 31% and worth watching. ${recommendations.length} recommendation(s) on file, ${openCount} still awaiting review.`;

  const recentLog = await getRecentLogContext(period === "daily" ? 1 : 7);
  const result = await callModel("reporting", {
    max_tokens: 1200,
    messages: [
      {
        role: "system",
        content: `You are the Reporting Manager for PickTheBrick's marketing team. Write a concise ${period} performance report a founder could read in under a minute: a headline line, what happened, what's still outstanding. Plain text, short paragraphs or a few bullet points - no markdown headers, no code fences.`,
      },
      {
        role: "user",
        content: `${await buildBusinessContext()}\n\nCurrent recommendations:\n${recommendations.map((r) => `- [${r.status}] ${r.title}`).join("\n") || "(none)"}\n\nRecent activity:\n${recentLog}`,
      },
    ],
  });

  const content = result.ok && result.message.content ? result.message.content : fallbackContent;
  const fallback = !(result.ok && result.message.content);
  await marketingState.addReport(period, content, fallback);
  await logMarketingEvent({ type: "report_generated", period });
  return { content, fallback };
}

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type ToolCallRecord = { name: string; args: Record<string, unknown> };

const TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "approve_recommendation",
      description: "Approve one of the current AI Marketing Manager recommendations by id.",
      parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
    },
  },
  {
    type: "function",
    function: {
      name: "reject_recommendation",
      description: "Reject one of the current AI Marketing Manager recommendations by id.",
      parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
    },
  },
  {
    type: "function",
    function: {
      name: "approve_queue_item",
      description: "Approve an item in the AI Action Queue by id.",
      parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
    },
  },
  {
    type: "function",
    function: {
      name: "set_autonomy_level",
      description: "Set the global AI Autonomy level: 0=Manual, 1=Assisted, 2=Semi-Autonomous, 3=Autonomous.",
      parameters: { type: "object", properties: { level: { type: "integer", minimum: 0, maximum: 3 } }, required: ["level"] },
    },
  },
  {
    type: "function",
    function: {
      name: "set_tool_permission",
      description: "Enable or disable a permission for a marketing tool. Valid permissions - Google Ads/Meta Ads: Read, Draft, Modify, Execute. Instagram: Read, Draft, Schedule, Publish.",
      parameters: {
        type: "object",
        properties: {
          tool: { type: "string", enum: ["Google Ads", "Instagram", "Meta Ads"] },
          permission: { type: "string" },
          enabled: { type: "boolean" },
        },
        required: ["tool", "permission", "enabled"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_content_concept",
      description: "Generate a content concept (hook/visual/caption/CTA) for a platform and format, optionally from a seed idea.",
      parameters: {
        type: "object",
        properties: {
          platform: { type: "string", enum: ["Instagram", "Facebook", "LinkedIn", "TikTok", "Google Ads"] },
          format: { type: "string", enum: ["Reel", "Carousel", "Static", "Story", "Ad"] },
          idea: { type: "string" },
        },
        required: ["platform", "format"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_instruction",
      description: "Save a durable standing instruction from the founder that should be followed on every future turn (e.g. 'always flag CPL spikes over 20%').",
      parameters: { type: "object", properties: { text: { type: "string" } }, required: ["text"] },
    },
  },
  {
    type: "function",
    function: {
      name: "analyze_performance",
      description: "Delegate to the Performance Analyst for a fresh read on one channel's data (Google Ads, Meta/Instagram, or the website).",
      parameters: { type: "object", properties: { channel: { type: "string", enum: ["google", "meta", "website"] } }, required: ["channel"] },
    },
  },
  {
    type: "function",
    function: {
      name: "find_growth_opportunities",
      description: "Delegate to the Growth Manager to scan every channel for untapped opportunities (gaps, patterns worth repeating, underserved pages).",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_report",
      description: "Delegate to the Reporting Manager to produce a daily or weekly performance report.",
      parameters: { type: "object", properties: { period: { type: "string", enum: ["daily", "weekly"] } }, required: ["period"] },
    },
  },
];

async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case "approve_recommendation":
      await marketingState.setRecommendationStatus(String(args.id), "Approved");
      return `Recommendation ${args.id} approved.`;
    case "reject_recommendation":
      await marketingState.setRecommendationStatus(String(args.id), "Rejected");
      return `Recommendation ${args.id} rejected.`;
    case "approve_queue_item":
      await marketingState.approveQueueItem(String(args.id));
      return `Queue item ${args.id} approved.`;
    case "set_autonomy_level": {
      const level = Number(args.level);
      await marketingState.setAutonomyLevel(level);
      return `Autonomy set to ${AUTONOMY_LEVELS[level] ?? level} (level ${level}).`;
    }
    case "set_tool_permission":
      await marketingState.setToolPermission(String(args.tool), String(args.permission), Boolean(args.enabled));
      return `${args.tool}: ${args.permission} ${args.enabled ? "enabled" : "disabled"}.`;
    case "generate_content_concept": {
      const concept = await generateContentConcept({
        platform: String(args.platform),
        format: String(args.format),
        idea: args.idea ? String(args.idea) : undefined,
      });
      return JSON.stringify(concept);
    }
    case "add_instruction":
      await marketingState.addInstruction(String(args.text));
      return `Instruction saved: "${args.text}"`;
    case "analyze_performance": {
      const channel = String(args.channel) as MarketingChannel;
      const result = await runPerformanceAnalysis(channel);
      return `Performance Analyst on ${channel}: ${result.insights.join(" ")}`;
    }
    case "find_growth_opportunities": {
      const result = await findGrowthOpportunities();
      return `Growth Manager found: ${result.opportunities.map((o) => `${o.title} - ${o.why}`).join(" | ")}`;
    }
    case "generate_report": {
      const period = String(args.period) as "daily" | "weekly";
      const result = await generateReport(period);
      return `Reporting Manager's ${period} report: ${result.content}`;
    }
    default:
      return `Unknown tool: ${name}`;
  }
}

async function buildAgentContext(): Promise<string> {
  const [state, recommendations, instructions, recentLog] = await Promise.all([
    marketingState.getWorkspaceState(),
    marketingState.getRecommendations(),
    marketingState.getInstructions(),
    getRecentLogContext(),
  ]);

  const permsText =
    Object.entries(state.permissions)
      .map(([tool, perms]) => `- ${tool}: ${perms.length ? perms.join(", ") : "none"}`)
      .join("\n") || "(none set)";
  const recsText =
    recommendations.map((r) => `- id=${r.id} [${r.status}] ${r.title}`).join("\n") ||
    "(none yet - the founder can generate some from the Overview page's Refresh analysis button)";
  const queueText = QUEUE_ITEMS.map(
    (q) => `- id=${q.id} [${state.queueApprovals[q.id] ?? "pending"}] (${q.channel}) ${q.title}`,
  ).join("\n");
  const instrText = instructions.map((i) => `- ${i.text}`).join("\n") || "(none set)";
  const opportunitiesLine = state.opportunitiesUpdatedAt
    ? `${state.opportunities.length} opportunit${state.opportunities.length === 1 ? "y" : "ies"} on file (last found ${state.opportunitiesUpdatedAt.toISOString()}) - call find_growth_opportunities for a fresh scan.`
    : "None found yet - call find_growth_opportunities to have the Growth Manager scan for some.";

  return `Your team: Performance Analyst (analyze_performance), Content Manager (generate_content_concept), Growth Manager (find_growth_opportunities), Reporting Manager (generate_report) - delegate to them via their tool rather than guessing at their job yourself.

Growth opportunities: ${opportunitiesLine}

Current AI Autonomy: ${AUTONOMY_LEVELS[state.autonomyLevel]} (level ${state.autonomyLevel})
Per-tool permissions:
${permsText}

Current recommendations (act on these with approve_recommendation / reject_recommendation using their id):
${recsText}

Action queue (act on these with approve_queue_item using their id):
${queueText}

Standing instructions from the founder - follow these durably on every turn, not just when reminded:
${instrText}

Recent activity memory (your own past chats/actions, most recent last):
${recentLog}`;
}

// The core agentic loop: the founder talks to "Marketing" like an employee -
// asks questions, gives instructions, or tells it to do something - and it
// can actually act via the tools above, not just describe what it would do.
// Bounded to 4 tool-calling rounds so a confused model can't loop forever.
export async function runMarketingAgent(userMessage: string): Promise<{ reply: string; toolCalls: ToolCallRecord[] }> {
  const [history, agentContext, businessContext] = await Promise.all([
    marketingState.getChatHistory(20),
    buildAgentContext(),
    buildBusinessContext(),
  ]);

  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `You are the Marketing Manager - PickTheBrick's AI marketing employee, living inside the founder's internal dashboard. You decide what matters and you're who the founder actually talks to, but you lead a small team of specialists (see below) - delegate to them via their tools rather than trying to do their job yourself from memory. You can chat, answer questions, and take real action via your tools when asked or instructed. Confirm briefly (1-2 sentences) what you did after acting; if you can't or won't act (e.g. missing info), say so plainly. Keep replies short and direct - founder-to-employee tone, not a customer-support bot.

${businessContext}

${agentContext}`,
    },
    ...history.map((h): ChatCompletionMessageParam => ({ role: h.role === "assistant" ? "assistant" : "user", content: h.content })),
    { role: "user", content: userMessage },
  ];

  const allToolCalls: ToolCallRecord[] = [];
  let finalReply = "Sorry, I didn't get an answer for that - please try again.";

  for (let round = 0; round < 4; round++) {
    const result = await callModel("manager", { max_tokens: 1000, messages, tools: TOOLS, tool_choice: "auto" });
    if (!result.ok) {
      finalReply = failureNote(result);
      break;
    }
    const message = result.message;

    if (message.tool_calls && message.tool_calls.length > 0) {
      messages.push({ role: "assistant", content: message.content, tool_calls: message.tool_calls });
      for (const call of message.tool_calls) {
        if (call.type !== "function") continue;
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(call.function.arguments || "{}");
        } catch {
          // leave args empty if the model produced malformed JSON
        }
        const toolResult = await executeTool(call.function.name, args);
        allToolCalls.push({ name: call.function.name, args });
        messages.push({ role: "tool", tool_call_id: call.id, content: toolResult });
      }
      continue;
    }

    finalReply = message.content ?? finalReply;
    break;
  }

  await logMarketingEvent({ type: "chat", userMessage, assistantReply: finalReply, toolCalls: allToolCalls });

  return { reply: finalReply, toolCalls: allToolCalls };
}
