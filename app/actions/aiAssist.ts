"use server";

import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { resolveActor, actorOwns } from "@/lib/actor";
import { fetchCatalog } from "@/lib/catalog";
import { SPACE_LABELS, PACKAGE_LABELS } from "@/lib/spaces";
import { styleFinderStyleByKey } from "@/lib/styleFinder";
import { AI_ASSIST_MODEL, AI_ASSIST_MAX_TOKENS } from "@/lib/ai/config";
import type { Unit } from "@/app/generated/prisma/enums";

export type AiAssistSpaceInput = { spaceKey: string; qty: number };

export type AiAssistTier = "essential" | "advanced" | "premium";

export type AiAssistIntake = {
  quoteId: string;
  officeSize: number;
  spaces: AiAssistSpaceInput[];
  styleKey: string | null;
  tier: AiAssistTier;
  source: "manual" | "designSurvey";
};

export type AiAssistSwap = {
  productId: string;
  name: string;
  rate: number;
  unit: Unit;
  typeLabel: string;
  subtypeLabel: string;
};

export type AiAssistSuggestion = {
  categoryKey: string;
  categoryLabel: string;
  typeLabel: string;
  subtypeLabel: string;
  productId: string;
  name: string;
  rate: number;
  unit: Unit;
  qty: number;
  rationale: string;
  swap: AiAssistSwap | null;
};

export type AiAssistResult = {
  sessionId: string;
  suggestions: AiAssistSuggestion[];
  emptyCategories: string[];
  usedAi: boolean;
};

function groupSpacesToCounts(spaces: { spaceKey: string }[]): AiAssistSpaceInput[] {
  const counts: Record<string, number> = {};
  const order: string[] = [];
  for (const s of spaces) {
    if (!(s.spaceKey in counts)) order.push(s.spaceKey);
    counts[s.spaceKey] = (counts[s.spaceKey] ?? 0) + 1;
  }
  return order.map((spaceKey) => ({ spaceKey, qty: counts[spaceKey] }));
}

export type AiAssistDesignDefaults = {
  officeSize: number | null;
  tier: string | null;
  spaces: AiAssistSpaceInput[];
  styleKey: string | null;
};

// Prefills the intake form from the client's most recent Design survey +
// Style Finder result, if either exists - the "reuse Design survey data"
// path agreed on for this feature, so a client doesn't have to re-answer
// questions they already answered in the Design flow.
export async function getAiAssistDesignSurveyDefaults(): Promise<AiAssistDesignDefaults | null> {
  const actor = await resolveActor();
  const [request, styleResult] = await Promise.all([
    prisma.designRequest.findFirst({ where: { ...actor }, orderBy: { createdAt: "desc" }, include: { spaceEntries: true } }),
    prisma.styleFinderResult.findFirst({ where: { ...actor } }),
  ]);
  if (!request && !styleResult) return null;
  return {
    officeSize: request?.sqft ?? null,
    tier: request?.packageKey ?? null,
    spaces: request ? groupSpacesToCounts(request.spaceEntries) : [],
    styleKey: styleResult?.topStyle ?? null,
  };
}

// Deterministic baseline quantity per category, keyed off the category's own
// unit and a loose keyword match on its key - the risky/financial part stays
// formula-driven rather than AI-generated, matching the "deterministic
// quantities, AI only picks products" split agreed for this feature.
function deterministicQty(categoryKey: string, unit: Unit, officeSize: number, totalSpaces: number): number {
  const key = categoryKey.toLowerCase();
  if (unit === "sqm") {
    const coverage = /floor|ceil/.test(key) ? 1 : /partition|wall/.test(key) ? 0.3 : 0.5;
    return Math.max(1, Math.round(officeSize * coverage));
  }
  if (unit === "lm") {
    return Math.max(1, Math.round(Math.sqrt(Math.max(officeSize, 1)) * 4));
  }
  // count
  if (/furnitur/.test(key)) return Math.max(1, totalSpaces * 3 || Math.round(officeSize / 12));
  if (/light/.test(key)) return Math.max(2, Math.round(officeSize / 8));
  if (/door/.test(key)) return Math.max(1, totalSpaces || 1);
  if (/cctv|camera|security/.test(key)) return Math.max(2, Math.round((totalSpaces || 4) / 4));
  if (/electric/.test(key)) return Math.max(2, (totalSpaces || 2) * 2);
  return Math.max(1, totalSpaces || 1);
}

type ShortlistEntry = {
  categoryKey: string;
  categoryLabel: string;
  typeLabel: string;
  subtypeLabel: string;
  product: { id: string; name: string; rate: number; unit: Unit; featured: boolean };
};

// Generates a full-quote starting point: one suggested product per catalog
// category, picked by Claude from a shortlist built fresh from the live
// catalog on every call (never a cached/remembered list) - the catalog is
// expected to be replaced heavily in the first running month, so nothing
// here may assume today's products still exist tomorrow. Falls back to a
// deterministic top-ranked pick, same as app/actions/assistant.ts's pattern,
// if no API key is configured or the call fails.
export async function generateAiAssistSuggestions(intake: AiAssistIntake): Promise<AiAssistResult> {
  const actor = await resolveActor();
  const quote = await prisma.quote.findUnique({ where: { id: intake.quoteId } });
  if (!quote || !actorOwns(actor, quote)) throw new Error("Quote not found");

  const officeSize = Math.max(1, intake.officeSize || 1);
  const totalSpaces = intake.spaces.reduce((s, x) => s + x.qty, 0);

  const catalog = await fetchCatalog();
  const shortlists: Record<string, ShortlistEntry[]> = {};
  const emptyCategories: string[] = [];

  for (const categoryKey of catalog.enabledCategories) {
    const meta = catalog.categoryMeta[categoryKey];
    const entries: ShortlistEntry[] = [];
    const types = catalog.catalog[categoryKey] ?? {};
    for (const typeKey of Object.keys(types)) {
      const type = types[typeKey];
      for (const subKey of Object.keys(type.subtypes)) {
        const sub = type.subtypes[subKey];
        for (const p of sub.products) {
          entries.push({
            categoryKey,
            categoryLabel: meta.label,
            typeLabel: type.label,
            subtypeLabel: sub.label,
            product: { id: p.id, name: p.name, rate: p.rate, unit: p.unit, featured: p.featured },
          });
        }
      }
    }
    if (entries.length === 0) {
      emptyCategories.push(meta.label);
      continue;
    }
    entries.sort((a, b) => {
      if (a.product.featured !== b.product.featured) return a.product.featured ? -1 : 1;
      return intake.tier === "premium" ? b.product.rate - a.product.rate : a.product.rate - b.product.rate;
    });
    shortlists[categoryKey] = entries.slice(0, 6);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const picks: Record<string, { productId: string; rationale: string }> = {};
  let usedAi = false;

  if (apiKey && Object.keys(shortlists).length > 0) {
    try {
      const style = intake.styleKey ? styleFinderStyleByKey(intake.styleKey) : undefined;
      const promptCategories = Object.entries(shortlists).map(([key, entries]) => ({
        categoryKey: key,
        categoryLabel: entries[0].categoryLabel,
        options: entries.map((e) => ({ productId: e.product.id, name: e.product.name, rate: e.product.rate, subtype: e.subtypeLabel })),
      }));

      const client = new Anthropic({ apiKey });
      const response = await client.messages.create({
        model: AI_ASSIST_MODEL,
        max_tokens: AI_ASSIST_MAX_TOKENS,
        thinking: { type: "disabled" },
        system:
          `You are helping fit out a Dubai office (PickTheBrick). Pick exactly one product per category that best ` +
          `matches the brief below, choosing ONLY from the productId values listed for that category - this catalog ` +
          `is uploaded fresh and changes often, so never invent a product or recall one from outside this exact list. ` +
          `If nothing in a category's list is a reasonable fit, omit that category rather than forcing a pick. Reply ` +
          `with ONLY a JSON array, no prose, no code fences: ` +
          `[{"categoryKey": string, "productId": string, "rationale": string}]. Keep each rationale under 15 words.`,
        messages: [
          {
            role: "user",
            content:
              `Office brief:\n` +
              `- Size: ${officeSize} sqm\n` +
              `- Spaces: ${intake.spaces.map((s) => `${SPACE_LABELS[s.spaceKey] ?? s.spaceKey} x${s.qty}`).join(", ") || "not specified"}\n` +
              `- Package tier: ${PACKAGE_LABELS[intake.tier] ?? intake.tier}\n` +
              `- Preferred style: ${style ? `${style.name} - ${style.desc}` : "not specified"}\n\n` +
              `Categories and current catalog options:\n${JSON.stringify(promptCategories)}`,
          },
        ],
      });

      if (response.stop_reason !== "refusal") {
        const textBlock = response.content.find((b) => b.type === "text");
        const raw = (textBlock && "text" in textBlock ? textBlock.text : "")?.trim() ?? "[]";
        const jsonText = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
        const parsed = JSON.parse(jsonText) as { categoryKey: string; productId: string; rationale: string }[];
        for (const pick of parsed) {
          const entries = shortlists[pick.categoryKey];
          if (!entries?.some((e) => e.product.id === pick.productId)) continue;
          picks[pick.categoryKey] = { productId: pick.productId, rationale: (pick.rationale ?? "").slice(0, 200) };
        }
        usedAi = true;
      }
    } catch {
      // Falls through to the deterministic pick below for every category.
    }
  }

  const suggestions: AiAssistSuggestion[] = [];
  for (const [categoryKey, entries] of Object.entries(shortlists)) {
    const pick = picks[categoryKey];
    const chosen = pick ? entries.find((e) => e.product.id === pick.productId) ?? entries[0] : entries[0];
    const rationale =
      pick?.rationale || (chosen.product.featured ? "Featured pick for this category." : `A solid ${intake.tier}-tier option.`);
    const swapEntry = entries.find((e) => e.product.id !== chosen.product.id) ?? null;

    suggestions.push({
      categoryKey,
      categoryLabel: chosen.categoryLabel,
      typeLabel: chosen.typeLabel,
      subtypeLabel: chosen.subtypeLabel,
      productId: chosen.product.id,
      name: chosen.product.name,
      rate: chosen.product.rate,
      unit: chosen.product.unit,
      qty: deterministicQty(categoryKey, chosen.product.unit, officeSize, totalSpaces),
      rationale,
      swap: swapEntry
        ? {
            productId: swapEntry.product.id,
            name: swapEntry.product.name,
            rate: swapEntry.product.rate,
            unit: swapEntry.product.unit,
            typeLabel: swapEntry.typeLabel,
            subtypeLabel: swapEntry.subtypeLabel,
          }
        : null,
    });
  }

  const session = await prisma.aiAssistSession.create({
    data: {
      quoteId: intake.quoteId,
      ...actor,
      officeSize,
      spacesJson: JSON.stringify(intake.spaces),
      style: intake.styleKey,
      tier: intake.tier,
      source: intake.source,
      usedAi,
      suggestionsJson: JSON.stringify(suggestions),
    },
  });

  return { sessionId: session.id, suggestions, emptyCategories, usedAi };
}

// Logs what the client actually kept vs. dropped/swapped from the
// suggestion set - the "learning as an asset" trail (see AiAssistSession in
// prisma/schema.prisma): an edit/removal signal here is what a later pass
// can score the suggestion quality against.
export async function recordAiAssistAcceptance(sessionId: string, acceptedProductIds: string[]) {
  const actor = await resolveActor();
  const session = await prisma.aiAssistSession.findUnique({ where: { id: sessionId } });
  if (!session || !actorOwns(actor, session)) throw new Error("AI Assist session not found");
  await prisma.aiAssistSession.update({ where: { id: sessionId }, data: { acceptedJson: JSON.stringify(acceptedProductIds) } });
}
