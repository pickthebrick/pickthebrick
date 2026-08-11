import "server-only";
import OpenAI from "openai";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
import {
  PINNED,
  MARKETING_KPIS,
  GOOGLE_CAMPAIGNS,
  META_CONTENT,
  LEADS,
  TOP_PAGES,
  QUEUE_ITEMS,
  AUTONOMY_LEVELS,
} from "@/app/admin/brain/data";
import * as marketingState from "@/lib/marketingState";
import { logMarketingEvent, getRecentLogContext } from "@/lib/marketingLog";
import { saveGeneratedContent } from "@/lib/marketingContent";

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

// A compact snapshot of the current sample data - stands in for what a real
// integration would pull live from Google Ads/GA/Meta/the CRM (see the
// design handoff's Data Architecture notes). Kept short on purpose so every
// call stays cheap and fast.
function buildBusinessContext(): string {
  const pinned = PINNED.map((p) => `- ${p.label}: ${p.value}`).join("\n");
  const kpis = MARKETING_KPIS.map((k) => `- ${k.label}: ${k.value} (${k.deltaArrow}${k.delta} vs prev. period)`).join("\n");
  const googleTop = GOOGLE_CAMPAIGNS.slice(0, 5)
    .map((c) => `- ${c.name}: spend ${c.spend}, ${c.leads} leads, ${c.qualified} qualified, ROAS ${c.roas}, status ${c.status}`)
    .join("\n");
  const metaTop = META_CONTENT.slice(0, 5)
    .map((c) => `- "${c.name}" (${c.type}): reach ${c.reach}, engagement ${c.engagement}, ${c.leads} leads, ${c.revenue} revenue`)
    .join("\n");
  const leads = LEADS.slice(0, 6).map((l) => `- ${l.name} via ${l.source}, est. ${l.budget}, status ${l.status}`).join("\n");
  const pages = TOP_PAGES.map((p) => `- ${p.page}: ${p.sessions} sessions, ${p.cvr} conversion, ${p.bounce} bounce`).join("\n");

  return `PickTheBrick is a Dubai office fit-out aggregator (supply + install, always - no separate install charge).

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
${pages}

NOTE: all of the above is illustrative sample data standing in for live Google Ads/GA/Meta/CRM feeds that aren't wired up yet - reason over it as if it were real, but don't claim certainty beyond what it shows.`;
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
  const client = getClient();
  let working = FALLBACK_WORKING;
  let problems = FALLBACK_PROBLEMS;
  let recSource: { title: string; why: string; impact: string; risk: string }[] = FALLBACK_RECOMMENDATIONS;
  let fallback = true;

  if (client) {
    try {
      const response = await client.chat.completions.create({
        model: MARKETING_AI_MODEL,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are the AI Marketing Manager for PickTheBrick. Read the business snapshot and produce a short morning brief. Respond with strict JSON only, shape:
{"working": string[] (2-3 short sentences on what's performing well), "problems": string[] (2-3 short sentences on what needs attention), "recommendations": [{"title": string, "why": string (short), "impact": string (short, e.g. "+6-9 qualified leads/wk"), "risk": string (one of "Low", "Medium — <reason>", "High — <reason>")}] (3-4 items)}
Be specific and reference numbers from the snapshot. No prose outside the JSON.`,
          },
          { role: "user", content: buildBusinessContext() },
        ],
      });
      const raw = response.choices[0]?.message?.content;
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
  const client = getClient();
  if (!client) return FALLBACK_CONCEPT;

  const response = await client.chat.completions.create({
    model: MARKETING_AI_MODEL,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a marketing content generator for PickTheBrick (Dubai office fit-out, supply + install always, transparent fixed pricing). Given a platform and format (and optionally a seed idea), produce one content concept. Respond with strict JSON only, shape: {"hook": string, "visual": string (shot/production direction), "caption": string, "cta": string}. Keep it punchy and specific to the platform/format.`,
      },
      {
        role: "user",
        content: `Platform: ${input.platform}\nFormat: ${input.format}${input.idea ? `\nSeed idea: ${input.idea}` : ""}\n\nBusiness context:\n${buildBusinessContext()}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content;
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

  return `Current AI Autonomy: ${AUTONOMY_LEVELS[state.autonomyLevel]} (level ${state.autonomyLevel})
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
  const client = getClient();
  if (!client) return { reply: NOT_CONFIGURED, toolCalls: [] };

  const [history, agentContext] = await Promise.all([marketingState.getChatHistory(20), buildAgentContext()]);

  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `You are "Marketing" - PickTheBrick's AI marketing employee, living inside the founder's internal dashboard. You can chat, answer questions, and take real action via the tools available to you when asked or instructed. Confirm briefly (1-2 sentences) what you did after acting; if you can't or won't act (e.g. missing info), say so plainly. Keep replies short and direct - founder-to-employee tone, not a customer-support bot.

${buildBusinessContext()}

${agentContext}`,
    },
    ...history.map((h): ChatCompletionMessageParam => ({ role: h.role === "assistant" ? "assistant" : "user", content: h.content })),
    { role: "user", content: userMessage },
  ];

  const allToolCalls: ToolCallRecord[] = [];
  let finalReply = "Sorry, I didn't get an answer for that - please try again.";

  for (let round = 0; round < 4; round++) {
    const response = await client.chat.completions.create({
      model: MARKETING_AI_MODEL,
      messages,
      tools: TOOLS,
      tool_choice: "auto",
    });
    const message = response.choices[0]?.message;
    if (!message) break;

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
        const result = await executeTool(call.function.name, args);
        allToolCalls.push({ name: call.function.name, args });
        messages.push({ role: "tool", tool_call_id: call.id, content: result });
      }
      continue;
    }

    finalReply = message.content ?? finalReply;
    break;
  }

  await logMarketingEvent({ type: "chat", userMessage, assistantReply: finalReply, toolCalls: allToolCalls });

  return { reply: finalReply, toolCalls: allToolCalls };
}
